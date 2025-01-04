import type { Express } from "express";
import { createServer, type Server } from "http";
import { fal } from "@fal-ai/client";
import { setupAuth } from "./auth";
import { db } from "@db";
import { 
  images, 
  tags, 
  imageTags, 
  tradingCards, 
  trades,
  tradeItems,
  insertTradingCardSchema,
  insertTradeSchema,
  insertTradeItemSchema
} from "@db/schema";
import { eq, and, or, inArray } from "drizzle-orm";

fal.config({
  credentials: process.env.FAL_KEY,
});

export function registerRoutes(app: Express): Server {
  // Set up authentication routes first
  setupAuth(app);

  app.post("/api/generate", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).send("Must be logged in to generate images");
      }

      const { prompt, tags: imageTags } = req.body;

      if (!prompt) {
        return res.status(400).send("Prompt is required");
      }

      const result = await fal.subscribe("fal-ai/recraft-v3", {
        input: {
          prompt,
        },
        logs: true,
        onQueueUpdate: (update) => {
          if (update.status === "IN_PROGRESS") {
            console.log("Generation progress:", update.logs.map((log) => log.message));
          }
        },
      });

      if (!result.data?.images?.[0]?.url) {
        throw new Error("Failed to generate image");
      }

      // Store the image in the database
      const [newImage] = await db.insert(images)
        .values({
          userId: req.user.id,
          url: result.data.images[0].url,
          prompt,
        })
        .returning();

      // Process tags if provided
      if (imageTags && Array.isArray(imageTags)) {
        for (const tagName of imageTags) {
          // Find or create tag
          let [existingTag] = await db
            .select()
            .from(tags)
            .where(eq(tags.name, tagName.toLowerCase()))
            .limit(1);

          if (!existingTag) {
            [existingTag] = await db
              .insert(tags)
              .values({ name: tagName.toLowerCase() })
              .returning();
          }

          // Create image-tag association
          await db.insert(imageTags).values({
            imageId: newImage.id,
            tagId: existingTag.id,
          });
        }
      }

      return res.json({
        imageUrl: result.data.images[0].url,
      });
    } catch (error) {
      console.error("Error generating image:", error);
      res.status(500).send("Failed to generate image");
    }
  });

  // Get all tags
  app.get("/api/tags", async (req, res) => {
    try {
      const allTags = await db.select().from(tags);
      res.json(allTags);
    } catch (error) {
      console.error("Error fetching tags:", error);
      res.status(500).send("Failed to fetch tags");
    }
  });

  // Get user's images with their tags
  app.get("/api/images", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).send("Must be logged in to view images");
      }

      const userImages = await db.query.images.findMany({
        where: eq(images.userId, req.user.id),
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
      if (!req.isAuthenticated()) {
        return res.status(401).send("Must be logged in to create trading cards");
      }

      const result = insertTradingCardSchema.safeParse({
        ...req.body,
        userId: req.user.id,
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

      if (image.userId !== req.user.id) {
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
      if (!req.isAuthenticated()) {
        return res.status(401).send("Must be logged in to view trading cards");
      }

      const userCards = await db.query.tradingCards.findMany({
        where: eq(tradingCards.userId, req.user.id),
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
      if (!req.isAuthenticated()) {
        return res.status(401).send("Must be logged in to create trades");
      }

      const result = insertTradeSchema.safeParse({
        ...req.body,
        initiatorId: req.user.id,
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
            eq(tradingCards.userId, req.user.id),
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
          offererId: req.user.id
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
      if (!req.isAuthenticated()) {
        return res.status(401).send("Must be logged in to view trades");
      }

      const userTrades = await db.query.trades.findMany({
        where: or(
          eq(trades.initiatorId, req.user.id),
          eq(trades.receiverId, req.user.id)
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
      if (!req.isAuthenticated()) {
        return res.status(401).send("Must be logged in to respond to trades");
      }

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
                eq(trades.initiatorId, req.user.id),
                eq(trades.receiverId, req.user.id)
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
          (action === 'cancel' && trade.initiatorId !== req.user.id) ||
          (['accept', 'reject'].includes(action) && trade.receiverId !== req.user.id)
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

  const httpServer = createServer(app);
  return httpServer;
}