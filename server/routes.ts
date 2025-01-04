import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { db } from "@db";
import taskRoutes from "./routes/tasks";

export function registerRoutes(app: Express): Server {
  // Set up authentication routes first
  setupAuth(app);

  // Middleware to check authentication for all /api routes except auth routes
  app.use("/api", (req, res, next) => {
    // Skip auth check for auth-related endpoints
    if (req.path.startsWith("/auth") || req.path === "/user") {
      return next();
    }

    if (!req.isAuthenticated()) {
      return res.status(401).send("Must be logged in to access this resource");
    }
    next();
  });

  // Register task management routes
  app.use("/api/tasks", taskRoutes);

  app.post("/api/generate", async (req, res) => {
    try {
      const { prompt, tags: imageTags } = req.body;

      if (!prompt) {
        return res.status(400).send("Prompt is required");
      }

      if (!process.env.GOAPI_API_KEY) {
        throw new Error("GOAPI_API_KEY is not configured");
      }

      console.log("Calling GoAPI with prompt:", prompt);

      // Call GoAPI Midjourney API to generate image
      const response = await fetch("https://api.goapi.ai/api/v1/task", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.GOAPI_API_KEY,
          "Accept": "application/json"
        },
        body: JSON.stringify({
          model: "midjourney",
          task_type: "imagine",
          input: {
            prompt,
            aspect_ratio: "1:1",
            process_mode: "fast",
            skip_prompt_check: false,
            bot_id: 0
          },
          config: {
            service_mode: "",
            webhook_config: {
              endpoint: `${process.env.PUBLIC_URL}/api/webhook/generation`,
              secret: process.env.WEBHOOK_SECRET || ""
            }
          }
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("GoAPI error response:", {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        throw new Error(`GoAPI error: ${response.status} - ${errorText || response.statusText}`);
      }

      const result = await response.json();
      console.log("GoAPI response:", result);

      if (!result.data?.task_id) {
        console.error("Invalid GoAPI response:", result);
        throw new Error("Invalid response from GoAPI: Missing task ID");
      }

      // Store task in Redis
      await TaskManager.createTask(result.data.task_id, {
        prompt,
        userId: req.user!.id,
        createdAt: new Date().toISOString()
      });

      return res.json({
        taskId: result.data.task_id,
        status: "pending"
      });

    } catch (error: any) {
      console.error("Error generating image:", error);
      if (error.message.includes("GOAPI_API_KEY")) {
        return res.status(500).send("API configuration error");
      } else if (error.message.includes("GoAPI error")) {
        return res.status(500).send(error.message);
      }
      res.status(500).send("Failed to generate image");
    }
  });

  // Webhook endpoint for image generation completion
  app.post("/api/webhook/generation", async (req, res) => {
    try {
      const { task_id, status, output, error } = req.body;

      // Verify webhook secret if configured
      const webhookSecret = req.headers["x-webhook-secret"];
      if (process.env.WEBHOOK_SECRET && webhookSecret !== process.env.WEBHOOK_SECRET) {
        return res.status(401).send("Invalid webhook secret");
      }

      // Get task data from Redis
      const taskData = await TaskManager.getTask(task_id);
      if (!taskData) {
        return res.status(404).send("Task not found");
      }

      if (status === "completed" && output?.image_urls) {
        // Store all image variations in the database
        const imageRecords = await Promise.all(
          output.image_urls.map(async (url: string, index: number) => {
            const [newImage] = await db.insert(images)
              .values({
                userId: taskData.userId,
                url: url,
                prompt: taskData.prompt,
                variationIndex: index
              })
              .returning();
            return newImage;
          })
        );

        // Update task status in Redis with all image variations
        await TaskManager.updateTask(task_id, {
          ...taskData,
          status: "completed",
          imageUrls: output.image_urls,
          imageIds: imageRecords.map(img => img.id)
        });

      } else if (status === "failed") {
        await TaskManager.updateTask(task_id, {
          ...taskData,
          status: "failed",
          error: error?.message || "Unknown error"
        });
      }

      res.sendStatus(200);
    } catch (error) {
      console.error("Error processing webhook:", error);
      res.status(500).send("Internal server error");
    }
  });

  // Endpoint to check task status
  app.get("/api/tasks/:taskId", async (req, res) => {
    try {
      const { taskId } = req.params;
      const taskData = await TaskManager.getTask(taskId);

      if (!taskData) {
        return res.status(404).send("Task not found");
      }

      // Verify task ownership
      if (taskData.userId !== req.user!.id) {
        return res.status(403).send("Unauthorized");
      }

      res.json(taskData);
    } catch (error) {
      console.error("Error checking task status:", error);
      res.status(500).send("Failed to check task status");
    }
  });

  // Get user's images with their tags
  app.get("/api/images", async (req, res) => {
    try {
      const userImages = await db.query.images.findMany({
        where: eq(images.userId, req.user!.id),
        with: {
          tags: {
            with: {
              tag: true,
            },
          },
        },
        orderBy: (images, { desc }) => [desc(images.createdAt)],
      });

      // Transform the data to include tag names directly
      const transformedImages = userImages.map(image => ({
        ...image,
        tags: image.tags.map(t => t.tag.name),
      }));

      res.json(transformedImages);
    } catch (error) {
      console.error("Error fetching images:", error);
      res.status(500).send("Failed to fetch images");
    }
  });

  // Create a trading card from an existing image
  app.post("/api/trading-cards", async (req, res) => {
    try {
      const result = insertTradingCardSchema.safeParse({
        ...req.body,
        userId: req.user!.id,
      });

      if (!result.success) {
        return res
          .status(400)
          .send("Invalid input: " + result.error.issues.map(i => i.message).join(", "));
      }

      // Verify the image exists and belongs to the user
      const [image] = await db
        .select()
        .from(images)
        .where(eq(images.id, result.data.imageId))
        .limit(1);

      if (!image) {
        return res.status(404).send("Image not found");
      }

      if (image.userId !== req.user!.id) {
        return res.status(403).send("You can only create cards from your own images");
      }

      // Create the trading card
      const [newCard] = await db
        .insert(tradingCards)
        .values(result.data)
        .returning();

      res.json(newCard);
    } catch (error) {
      console.error("Error creating trading card:", error);
      res.status(500).send("Failed to create trading card");
    }
  });

  // Get user's trading cards
  app.get("/api/trading-cards", async (req, res) => {
    try {
      const userCards = await db.query.tradingCards.findMany({
        where: eq(tradingCards.userId, req.user!.id),
        with: {
          image: true,
          creator: true,
        },
        orderBy: (cards, { desc }) => [desc(cards.createdAt)],
      });

      res.json(userCards);
    } catch (error) {
      console.error("Error fetching trading cards:", error);
      res.status(500).send("Failed to fetch trading cards");
    }
  });

  // Trading marketplace routes
  app.post("/api/trades", async (req, res) => {
    try {
      const result = insertTradeSchema.safeParse({
        ...req.body,
        initiatorId: req.user!.id,
        status: 'pending'
      });

      if (!result.success) {
        return res.status(400).send(
          "Invalid input: " + result.error.issues.map(i => i.message).join(", ")
        );
      }

      // Start a transaction to ensure data consistency
      const tradeResult = await db.transaction(async (tx) => {
        // Create the trade
        const [trade] = await tx.insert(trades).values(result.data).returning();

        // Add offered cards to the trade
        const { offeredCards } = req.body;
        if (!Array.isArray(offeredCards)) {
          throw new Error("offeredCards must be an array");
        }

        // Verify all cards belong to the initiator
        const userCards = await tx.query.tradingCards.findMany({
          where: and(
            eq(tradingCards.userId, req.user!.id),
            inArray(tradingCards.id, offeredCards)
          ),
        });

        if (userCards.length !== offeredCards.length) {
          throw new Error("Some cards don't belong to you");
        }

        // Add trade items
        const tradeItemsData = offeredCards.map(cardId => ({
          tradeId: trade.id,
          cardId,
          offererId: req.user!.id
        }));

        await tx.insert(tradeItems).values(tradeItemsData);

        return trade;
      });

      res.json(tradeResult);
    } catch (error: any) {
      console.error("Error creating trade:", error);
      res.status(500).send(error.message);
    }
  });

  app.get("/api/trades", async (req, res) => {
    try {
      const userTrades = await db.query.trades.findMany({
        where: or(
          eq(trades.initiatorId, req.user!.id),
          eq(trades.receiverId, req.user!.id)
        ),
        with: {
          initiator: true,
          receiver: true,
          items: {
            with: {
              card: {
                with: {
                  image: true
                }
              },
              offerer: true
            }
          }
        },
        orderBy: (trades, { desc }) => [desc(trades.createdAt)]
      });

      res.json(userTrades);
    } catch (error) {
      console.error("Error fetching trades:", error);
      res.status(500).send("Failed to fetch trades");
    }
  });

  app.post("/api/trades/:id/respond", async (req, res) => {
    try {
      const { id } = req.params;
      const { action } = req.body;

      if (!['accept', 'reject', 'cancel'].includes(action)) {
        return res.status(400).send("Invalid action");
      }

      // Start a transaction for the trade response
      const result = await db.transaction(async (tx) => {
        // Get the trade and verify ownership
        const [trade] = await tx
          .select()
          .from(trades)
          .where(
            and(
              eq(trades.id, parseInt(id)),
              or(
                eq(trades.initiatorId, req.user!.id),
                eq(trades.receiverId, req.user!.id)
              )
            )
          )
          .limit(1);

        if (!trade) {
          throw new Error("Trade not found");
        }

        if (trade.status !== 'pending') {
          throw new Error("Trade is no longer pending");
        }

        // Only the receiver can accept/reject, initiator can cancel
        if (
          (action === 'cancel' && trade.initiatorId !== req.user!.id) ||
          (['accept', 'reject'].includes(action) && trade.receiverId !== req.user!.id)
        ) {
          throw new Error("Unauthorized action");
        }

        const newStatus = action === 'accept' ? 'accepted' :
          action === 'reject' ? 'rejected' : 'cancelled';

        // If accepting, transfer card ownership
        if (action === 'accept') {
          const items = await tx.query.tradeItems.findMany({
            where: eq(tradeItems.tradeId, trade.id),
            with: {
              card: true
            }
          });

          // Update card ownership
          for (const item of items) {
            await tx
              .update(tradingCards)
              .set({
                userId: item.offererId === trade.initiatorId
                  ? trade.receiverId
                  : trade.initiatorId
              })
              .where(eq(tradingCards.id, item.cardId));
          }
        }

        // Update trade status
        const [updatedTrade] = await tx
          .update(trades)
          .set({
            status: newStatus,
            updatedAt: new Date()
          })
          .where(eq(trades.id, trade.id))
          .returning();

        return updatedTrade;
      });

      res.json(result);
    } catch (error: any) {
      console.error("Error responding to trade:", error);
      res.status(500).send(error.message);
    }
  });

  // War Game routes
  app.post("/api/games", async (req, res) => {
    try {
      const { opponentId } = req.body;

      if (!opponentId) {
        return res.status(400).send("Opponent ID is required");
      }

      const game = await WarGameService.createGame(req.user!.id, opponentId);
      res.json(game);
    } catch (error: any) {
      console.error("Error creating game:", error);
      res.status(500).send(error.message);
    }
  });

  app.post("/api/games/:id/play", async (req, res) => {
    try {
      const { id } = req.params;
      const gameId = parseInt(id);

      const updatedGame = await WarGameService.playTurn(gameId);
      res.json(updatedGame);
    } catch (error: any) {
      console.error("Error playing turn:", error);
      res.status(500).send(error.message);
    }
  });

  app.get("/api/games/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const [game] = await db.query.games.findMany({
        where: eq(games.id, parseInt(id)),
        with: {
          player1: true,
          player2: true,
          winner: true,
          cards: {
            with: {
              card: true,
            },
          },
        },
      });

      if (!game) {
        return res.status(404).send("Game not found");
      }

      // Only allow players in the game to view it
      if (game.player1Id !== req.user!.id && game.player2Id !== req.user!.id) {
        return res.status(403).send("You are not a player in this game");
      }

      res.json(game);
    } catch (error: any) {
      console.error("Error fetching game:", error);
      res.status(500).send(error.message);
    }
  });

  app.get("/api/games", async (req, res) => {
    try {
      const userGames = await db.query.games.findMany({
        where: or(
          eq(games.player1Id, req.user!.id),
          eq(games.player2Id, req.user!.id)
        ),
        with: {
          player1: true,
          player2: true,
          winner: true,
        },
        orderBy: (games, { desc }) => [desc(games.createdAt)],
      });

      res.json(userGames);
    } catch (error: any) {
      console.error("Error fetching games:", error);
      res.status(500).send(error.message);
    }
  });

  // Matchmaking routes
  app.post("/api/matchmaking", async (req, res) => {
    try {
      const gameId = await MatchmakingService.findMatch(req.user!.id);
      res.json({ gameId });
    } catch (error: any) {
      console.error("Error in matchmaking:", error);
      res.status(500).send(error.message);
    }
  });

  app.get("/api/matchmaking/status", async (req, res) => {
    try {
      const gameId = await MatchmakingService.getActiveGame(req.user!.id);
      res.json({ gameId });
    } catch (error: any) {
      console.error("Error checking game status:", error);
      res.status(500).send(error.message);
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}