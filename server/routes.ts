import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { db } from "@db";
import { eq, and, or, inArray } from "drizzle-orm";
import { 
  images, 
  tradingCards,
  trades,
  tradeItems,
  games,
  insertTradingCardSchema,
  insertTradeSchema,
} from "@db/schema";
import { WarGameService } from "./services/game/war/war.service";
import { AIOpponentService } from "./services/game/ai/ai-opponent.service";
import taskRoutes from "./routes/tasks";
import { TaskService } from "./services/task";
import { favorites } from "@db/schema";

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

  // Image generation endpoint
  app.post("/api/generate", async (req, res) => {
    try {
      const { prompt } = req.body;

      if (!prompt) {
        return res.status(400).send("Prompt is required");
      }

      const result = await TaskService.createImageGenerationTask(prompt, req.user!.id);
      res.json(result);
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

  // Updated War Game routes
  app.post("/api/games", async (req, res) => {
    try {
      const game = await WarGameService.createGameWithAI(req.user!.id);
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

  // Get user's favorite cards
  app.get("/api/favorites", async (req, res) => {
    try {
      const userFavorites = await db.query.favorites.findMany({
        where: eq(favorites.userId, req.user!.id),
        with: {
          card: {
            with: {
              template: {
                with: {
                  image: true,
                  creator: true,
                },
              },
            },
          },
        },
        orderBy: (favorites, { desc }) => [desc(favorites.createdAt)],
      });

      const cards = userFavorites.map(fav => fav.card);
      res.json(cards);
    } catch (error) {
      console.error("Error fetching favorites:", error);
      res.status(500).send("Failed to fetch favorites");
    }
  });

  // Add a card to favorites
  app.post("/api/favorites/:cardId", async (req, res) => {
    try {
      const { cardId } = req.params;

      // Check if already favorited
      const existing = await db.query.favorites.findFirst({
        where: and(
          eq(favorites.userId, req.user!.id),
          eq(favorites.cardId, parseInt(cardId))
        ),
      });

      if (existing) {
        // If already favorited, remove it
        await db.delete(favorites)
          .where(eq(favorites.id, existing.id));
        res.json({ favorited: false });
      } else {
        // Add to favorites
        await db.insert(favorites)
          .values({
            userId: req.user!.id,
            cardId: parseInt(cardId),
          });
        res.json({ favorited: true });
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      res.status(500).send("Failed to toggle favorite");
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}