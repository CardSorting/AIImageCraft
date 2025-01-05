import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { db } from "@db";
import { eq, and, or, inArray, sql, gt } from "drizzle-orm";
import {
  images,
  trades,
  tradeItems,
  games,
  insertTradeSchema,
  tradingCards,
  dailyChallenges,
  challengeProgress,
  users,
  levelMilestones,
  userRewards
} from "@db/schema";
import { WarGameService } from "./services/game/war/war.service";
import taskRoutes from "./routes/tasks";
import favoritesRoutes from "./routes/favorites";
import tradingCardRoutes from "./routes/trading-cards";
import { TaskService } from "./services/task";
import { PulseCreditManager } from "./services/redis";

export function registerRoutes(app: Express): Server {
  // Set up authentication routes first
  setupAuth(app);

  // Middleware to check authentication for all /api routes except auth routes
  app.use("/api", (req, res, next) => {
    if (req.path.startsWith("/auth") || req.path === "/user") {
      return next();
    }

    if (!req.isAuthenticated()) {
      return res.status(401).send("Must be logged in to access this resource");
    }
    next();
  });

  // Daily Challenges endpoint
  app.get("/api/challenges/daily", async (req, res) => {
    try {
      // Get the active challenges for today
      const challenges = await db.query.dailyChallenges.findMany({
        where: and(
          sql`DATE(${dailyChallenges.expiresAt}) = CURRENT_DATE`,
          sql`DATE(${dailyChallenges.createdAt}) = CURRENT_DATE`
        ),
        with: {
          progress: {
            where: eq(challengeProgress.userId, req.user!.id),
          },
        },
      });

      // Calculate total earnings for today
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const completedToday = await db.query.challengeProgress.findMany({
        where: and(
          eq(challengeProgress.userId, req.user!.id),
          sql`DATE(${challengeProgress.completedAt}) = CURRENT_DATE`,
          eq(challengeProgress.completed, true)
        ),
        with: {
          challenge: true,
        },
      });

      const totalEarnedToday = completedToday.reduce(
        (sum, prog) => sum + prog.challenge.creditReward,
        0
      );

      // Transform challenges to match frontend type
      const transformedChallenges = challenges.map(challenge => ({
        id: challenge.id.toString(),
        type: challenge.type,
        title: challenge.title,
        description: challenge.description,
        creditReward: challenge.creditReward,
        requiredCount: challenge.requiredCount,
        currentProgress: challenge.progress[0]?.progress ?? 0,
        completed: challenge.progress[0]?.completed ?? false,
        expiresAt: challenge.expiresAt.toISOString(),
      }));

      // Calculate max daily earnings from available challenges
      const maxDailyEarnings = challenges.reduce(
        (sum, challenge) => sum + challenge.creditReward,
        0
      );

      res.json({
        challenges: transformedChallenges,
        totalEarnedToday,
        maxDailyEarnings,
      });
    } catch (error) {
      console.error("Error fetching daily challenges:", error);
      res.status(500).send("Failed to fetch daily challenges");
    }
  });

  // Register task management routes
  app.use("/api/tasks", taskRoutes);

  // Register favorites routes
  app.use("/api/favorites", favoritesRoutes);

  // Register trading card routes
  app.use("/api/trading-cards", tradingCardRoutes);

  // Get a single image by ID
  app.get("/api/images/:id", async (req, res) => {
    try {
      const imageId = parseInt(req.params.id);

      const [image] = await db.query.images.findMany({
        where: and(
          eq(images.id, imageId),
          eq(images.userId, req.user!.id)
        ),
        with: {
          tags: {
            with: {
              tag: true,
            },
          },
        },
      });

      if (!image) {
        return res.status(404).send("Image not found");
      }

      // Transform the data to include tag names directly
      const transformedImage = {
        ...image,
        tags: image.tags.map(t => t.tag.name),
      };

      res.json(transformedImage);
    } catch (error: any) {
      console.error("Error fetching image:", error);
      res.status(500).send("Failed to fetch image");
    }
  });

  // Image generation endpoint
  app.post("/api/generate", async (req, res) => {
    try {
      const { prompt } = req.body;

      if (!prompt) {
        return res.status(400).send("Prompt is required");
      }

      // Check if user has enough credits
      const hasCredits = await PulseCreditManager.hasEnoughCredits(
        req.user!.id,
        PulseCreditManager.IMAGE_GENERATION_COST
      );

      if (!hasCredits) {
        return res.status(403).send(
          `Insufficient Pulse credits. Image generation requires ${PulseCreditManager.IMAGE_GENERATION_COST} credits`
        );
      }

      // Use credits before generating image
      await PulseCreditManager.useCredits(
        req.user!.id,
        PulseCreditManager.IMAGE_GENERATION_COST
      );

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
                  template: {
                    with: {
                      image: true
                    }
                  }
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
      res.status(500).send("Failed to fetch games");
    }
  });

  // Add matchmaking routes for AI games
  app.post("/api/matchmaking", async (req, res) => {
    try {
      const game = await WarGameService.createGameWithAI(req.user!.id);
      res.json({ gameId: game.id });
    } catch (error: any) {
      console.error("Error creating AI game:", error);
      res.status(500).send(error.message);
    }
  });

  app.get("/api/matchmaking/status", async (req, res) => {
    try {
      const activeGames = await db.query.games.findMany({
        where: and(
          eq(games.player1Id, req.user!.id),
          eq(games.status, 'ACTIVE')
        ),
        limit: 1
      });

      if (activeGames.length > 0) {
        res.json({ gameId: activeGames[0].id });
      } else {
        res.json({ gameId: null });
      }
    } catch (error: any) {
      console.error("Error checking game status:", error);
      res.status(500).send(error.message);
    }
  });

  // Get user credits endpoint
  app.get("/api/credits", async (req, res) => {
    try {
      const credits = await PulseCreditManager.getCredits(req.user!.id);
      res.json({ credits });
    } catch (error) {
      console.error("Error fetching credits:", error);
      res.status(500).send("Failed to fetch credits");
    }
  });

  // Add this new route after the /api/credits endpoint and before the httpServer creation
  app.post("/api/share", async (req, res) => {
    try {
      const { itemType, itemId } = req.body;

      if (!['image', 'card'].includes(itemType) || !itemId) {
        return res.status(400).send("Invalid share data. Required: itemType (image or card) and itemId");
      }

      const result = await PulseCreditManager.trackAndRewardShare(
        req.user!.id,
        itemType as 'image' | 'card',
        itemId
      );

      res.json({
        success: true,
        ...result,
        message: result.credited
          ? `Earned ${result.creditsEarned} credits for sharing! (${result.dailySharesCount}/${PulseCreditManager.MAX_DAILY_SHARE_REWARDS} daily shares)`
          : `Daily share limit reached (${result.dailySharesCount}/${PulseCreditManager.MAX_DAILY_SHARE_REWARDS}). Try again tomorrow!`
      });
    } catch (error) {
      console.error("Error processing share:", error);
      res.status(500).send("Failed to process share");
    }
  });

  app.get("/api/share/daily-limit", async (req, res) => {
    try {
      const count = await PulseCreditManager.getDailySharesCount(req.user!.id);
      res.json({
        count,
        limit: PulseCreditManager.MAX_DAILY_SHARE_REWARDS,
        remaining: Math.max(0, PulseCreditManager.MAX_DAILY_SHARE_REWARDS - count)
      });
    } catch (error) {
      console.error("Error fetching share limit:", error);
      res.status(500).send("Failed to fetch share limit");
    }
  });

  // Referral system endpoints
  app.post("/api/referral/generate", async (req, res) => {
    try {
      const existingCode = await PulseCreditManager.getReferralCode(req.user!.id);
      if (existingCode) {
        return res.json({ code: existingCode });
      }

      const code = await PulseCreditManager.generateReferralCode(req.user!.id);
      res.json({ code });
    } catch (error) {
      console.error("Error generating referral code:", error);
      res.status(500).send("Failed to generate referral code");
    }
  });

  app.post("/api/referral/use", async (req, res) => {
    try {
      const { code } = req.body;

      if (!code) {
        return res.status(400).send("Referral code is required");
      }

      const result = await PulseCreditManager.useReferralCode(code, req.user!.id);

      if (!result.success) {
        return res.status(400).send(result.error);
      }

      res.json({
        success: true,
        message: `Successfully used referral code! You received ${PulseCreditManager.REFERRAL_WELCOME_BONUS} Pulse credits as a welcome bonus.`,
        creditsAwarded: PulseCreditManager.REFERRAL_WELCOME_BONUS
      });
    } catch (error) {
      console.error("Error using referral code:", error);
      res.status(500).send("Failed to use referral code");
    }
  });

  app.get("/api/referral/code", async (req, res) => {
    try {
      const code = await PulseCreditManager.getReferralCode(req.user!.id);
      res.json({ code });
    } catch (error) {
      console.error("Error fetching referral code:", error);
      res.status(500).send("Failed to fetch referral code");
    }
  });

  // Add this new endpoint after the existing referral endpoints
  app.get("/api/referral/stats", async (req, res) => {
    try {
      const referralCount = await PulseCreditManager.getReferralCount(req.user!.id);
      const currentTier = PulseCreditManager.REFERRAL_TIERS.findIndex(
        tier => referralCount >= tier.min && referralCount <= tier.max
      ) + 1;

      const currentTierInfo = PulseCreditManager.REFERRAL_TIERS[currentTier - 1];
      const nextTierInfo = PulseCreditManager.REFERRAL_TIERS[currentTier] || null;

      // Calculate progress to next tier
      const progressInTier = referralCount - currentTierInfo.min;
      const tierSize = currentTierInfo.max - currentTierInfo.min + 1;
      const progressPercentage = (progressInTier / tierSize) * 100;

      res.json({
        referralCount,
        currentTier,
        currentBonus: currentTierInfo.bonus,
        nextTierBonus: nextTierInfo?.bonus,
        progressToNextTier: progressPercentage,
        creditsEarned: referralCount * currentTierInfo.bonus
      });
    } catch (error) {
      console.error("Error fetching referral stats:", error);
      res.status(500).send("Failed to fetch referral statistics");
    }
  });

  // XP and Level Management Routes
  app.post("/api/xp/award", async (req, res) => {
    try {
      const { amount, reason } = req.body;

      // Start a transaction for XP award and level up checks
      const result = await db.transaction(async (tx) => {
        // Get current user state
        const [user] = await tx
          .select()
          .from(users)
          .where(eq(users.id, req.user!.id))
          .limit(1);

        const oldLevel = user.level;
        const newXp = user.xpPoints + amount;
        const newLevel = Math.floor(Math.sqrt(newXp / 100)) + 1;
        const didLevelUp = newLevel > oldLevel;

        // Update user XP and level
        const [updatedUser] = await tx
          .update(users)
          .set({
            xpPoints: newXp,
            totalXpEarned: user.totalXpEarned + amount,
            level: newLevel,
            levelUpNotification: didLevelUp,
          })
          .where(eq(users.id, req.user!.id))
          .returning();

        // If leveled up, check for new milestone rewards
        let newRewards = [];
        if (didLevelUp) {
          const milestones = await tx
            .select()
            .from(levelMilestones)
            .where(eq(levelMilestones.level, newLevel));

          // Create reward entries for new milestones
          for (const milestone of milestones) {
            const [reward] = await tx
              .insert(userRewards)
              .values({
                userId: req.user!.id,
                milestoneId: milestone.id,
                claimed: false,
              })
              .returning();

            newRewards.push({
              ...milestone,
              rewardId: reward.id,
            });
          }
        }

        return {
          xpGained: amount,
          currentXp: updatedUser.xpPoints,
          currentLevel: updatedUser.level,
          totalXpEarned: updatedUser.totalXpEarned,
          leveledUp: didLevelUp,
          oldLevel,
          newLevel,
          newRewards,
        };
      });

      res.json(result);
    } catch (error) {
      console.error("Error awarding XP:", error);
      res.status(500).send("Failed to award XP");
    }
  });

  app.get("/api/xp/progress", async (req, res) => {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, req.user!.id))
        .limit(1);

      // Calculate XP required for next level
      const currentLevel = user.level;
      const xpForCurrentLevel = Math.pow(currentLevel - 1, 2) * 100;
      const xpForNextLevel = Math.pow(currentLevel, 2) * 100;
      const xpProgress = user.xpPoints - xpForCurrentLevel;
      const xpRequired = xpForNextLevel - xpForCurrentLevel;

      res.json({
        currentXp: user.xpPoints,
        currentLevel: user.level,
        totalXpEarned: user.totalXpEarned,
        xpProgress,
        xpRequired,
        progressPercentage: (xpProgress / xpRequired) * 100,
        hasLevelUpNotification: user.levelUpNotification,
      });
    } catch (error) {
      console.error("Error fetching XP progress:", error);
      res.status(500).send("Failed to fetch XP progress");
    }
  });

  app.get("/api/rewards", async (req, res) => {
    try {
      const rewards = await db.query.userRewards.findMany({
        where: and(
          eq(userRewards.userId, req.user!.id),
          eq(userRewards.claimed, false)
        ),
        with: {
          milestone: true,
        },
      });

      res.json(rewards);
    } catch (error) {
      console.error("Error fetching rewards:", error);
      res.status(500).send("Failed to fetch rewards");
    }
  });

  app.post("/api/rewards/:id/claim", async (req, res) => {
    try {
      const rewardId = parseInt(req.params.id);

      const result = await db.transaction(async (tx) => {
        // Get the reward and verify ownership
        const [reward] = await tx
          .select()
          .from(userRewards)
          .where(
            and(
              eq(userRewards.id, rewardId),
              eq(userRewards.userId, req.user!.id),
              eq(userRewards.claimed, false)
            )
          )
          .limit(1);

        if (!reward) {
          throw new Error("Reward not found or already claimed");
        }

        // Get the milestone details
        const [milestone] = await tx
          .select()
          .from(levelMilestones)
          .where(eq(levelMilestones.id, reward.milestoneId))
          .limit(1);

        // Update reward as claimed
        const [updatedReward] = await tx
          .update(userRewards)
          .set({
            claimed: true,
            claimedAt: new Date(),
          })
          .where(eq(userRewards.id, rewardId))
          .returning();

        // Clear level up notification if all rewards are claimed
        const remainingRewards = await tx
          .select()
          .from(userRewards)
          .where(
            and(
              eq(userRewards.userId, req.user!.id),
              eq(userRewards.claimed, false)
            )
          );

        if (remainingRewards.length === 0) {
          await tx
            .update(users)
            .set({ levelUpNotification: false })
            .where(eq(users.id, req.user!.id));
        }

        return {
          success: true,
          reward: {
            ...updatedReward,
            milestone,
          },
        };
      });

      res.json(result);
    } catch (error) {
      console.error("Error claiming reward:", error);
      res.status(500).send(error.message);
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}