import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { db } from "@db";
import { eq, and, desc, inArray, sql } from "drizzle-orm";
import { 
  users, 
  creditTransactions,
  images, 
  imageTags, 
  tags,
  userRewards,
  levelMilestones,
  challengeProgress,
  dailyChallenges,
} from "@db/schema";
import { TaskService } from "./services/task";
import { CreditManager } from "./services/credits/credit-manager";
import creditRoutes from "./routes/credits";
import favoritesRoutes from "./routes/favorites";
import taskRoutes from "./routes/tasks";

export function registerRoutes(app: Express): Server {
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

  // Register all route modules
  app.use("/api/credits", creditRoutes);
  app.use("/api/favorites", favoritesRoutes);
  app.use("/api/tasks", taskRoutes);

  // Add the specific /generate route for image generation
  app.post("/api/generate", async (req, res) => {
    try {
      const { prompt } = req.body;

      if (!prompt) {
        return res.status(400).send("Prompt is required");
      }

      // Check if user has enough credits using PostgreSQL
      const hasEnoughCredits = await CreditManager.hasEnoughCredits(
        req.user!.id,
        CreditManager.IMAGE_GENERATION_COST
      );

      if (!hasEnoughCredits) {
        return res.status(400).send(
          `Insufficient credits. Image generation costs ${CreditManager.IMAGE_GENERATION_COST} credits.`
        );
      }

      try {
        // Create the image generation task first to ensure it works
        const result = await TaskService.createImageGenerationTask(prompt, req.user!.id);

        // If task creation succeeds, deduct credits using PostgreSQL
        const deductResult = await CreditManager.useCredits(
          req.user!.id,
          CreditManager.IMAGE_GENERATION_COST
        );

        if (!deductResult) {
          throw new Error("Failed to process credit deduction");
        }

        res.json(result);
      } catch (taskError: any) {
        console.error("Task creation error:", taskError);
        throw taskError;
      }
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

  // Get a single image by ID
  app.get("/api/images/:id", async (req, res) => {
    try {
      const imageId = parseInt(req.params.id);

      // First fetch the image
      const [image] = await db
        .select()
        .from(images)
        .where(
          and(
            eq(images.id, imageId),
            eq(images.userId, req.user!.id)
          )
        )
        .limit(1);

      if (!image) {
        return res.status(404).send("Image not found");
      }

      // Then fetch associated tags
      const imageTagResults = await db
        .select({
          name: tags.name
        })
        .from(tags)
        .innerJoin(imageTags, eq(imageTags.tagId, tags.id))
        .where(eq(imageTags.imageId, imageId));

      // Combine the results
      const result = {
        ...image,
        tags: imageTagResults.map(tag => tag.name)
      };

      res.json(result);
    } catch (error: any) {
      console.error("Error fetching image:", error);
      res.status(500).send("Failed to fetch image");
    }
  });

  // Get user's images
  app.get("/api/images", async (req, res) => {
    try {
      // First fetch all user's images
      const userImages = await db
        .select()
        .from(images)
        .where(eq(images.userId, req.user!.id))
        .orderBy(desc(images.createdAt));

      // Fetch tags for all images in a single query
      const allTags = await db
        .select({
          imageId: imageTags.imageId,
          name: tags.name
        })
        .from(tags)
        .innerJoin(imageTags, eq(imageTags.tagId, tags.id))
        .where(inArray(imageTags.imageId, userImages.map(img => img.id)));

      // Group tags by image
      const tagsByImage = allTags.reduce((acc, tag) => {
        if (!acc[tag.imageId]) {
          acc[tag.imageId] = [];
        }
        acc[tag.imageId].push(tag.name);
        return acc;
      }, {} as Record<number, string[]>);

      // Combine images with their tags
      const result = userImages.map(image => ({
        ...image,
        tags: tagsByImage[image.id] || []
      }));

      res.json(result);
    } catch (error) {
      console.error("Error fetching images:", error);
      res.status(500).send("Failed to fetch images");
    }
  });

  // Sharing endpoint
  app.post("/api/share", async (req, res) => {
    try {
      const { itemType, itemId } = req.body;

      if (!['image', 'card'].includes(itemType) || !itemId) {
        return res.status(400).send("Invalid share data. Required: itemType (image or card) and itemId");
      }

      const result = await CreditManager.trackAndRewardShare(
        req.user!.id,
        itemType as 'image' | 'card',
        itemId
      );

      res.json({
        success: true,
        ...result,
        message: result.credited
          ? `Earned ${result.creditsEarned} credits for sharing! (${result.dailySharesCount}/${CreditManager.MAX_DAILY_SHARE_REWARDS} daily shares)`
          : `Daily share limit reached (${result.dailySharesCount}/${CreditManager.MAX_DAILY_SHARE_REWARDS}). Try again tomorrow!`
      });
    } catch (error) {
      console.error("Error processing share:", error);
      res.status(500).send("Failed to process share");
    }
  });

  // Share limit endpoint
  app.get("/api/share/daily-limit", async (req, res) => {
    try {
      const count = await CreditManager.getDailySharesCount(req.user!.id);
      res.json({
        count,
        limit: CreditManager.MAX_DAILY_SHARE_REWARDS,
        remaining: Math.max(0, CreditManager.MAX_DAILY_SHARE_REWARDS - count)
      });
    } catch (error) {
      console.error("Error fetching share limit:", error);
      res.status(500).send("Failed to fetch share limit");
    }
  });
  app.post("/api/referral/generate", async (req, res) => {
    try {
      const existingCode = await CreditManager.getReferralCode(req.user!.id);
      if (existingCode) {
        return res.json({ code: existingCode });
      }

      const code = await CreditManager.generateReferralCode(req.user!.id);
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

      const result = await CreditManager.useReferralCode(code, req.user!.id);

      if (!result.success) {
        return res.status(400).send(result.error);
      }

      res.json({
        success: true,
        message: `Successfully used referral code! You received ${CreditManager.REFERRAL_WELCOME_BONUS} Pulse credits as a welcome bonus.`,
        creditsAwarded: CreditManager.REFERRAL_WELCOME_BONUS
      });
    } catch (error) {
      console.error("Error using referral code:", error);
      res.status(500).send("Failed to use referral code");
    }
  });

  app.get("/api/referral/code", async (req, res) => {
    try {
      const code = await CreditManager.getReferralCode(req.user!.id);
      res.json({ code });
    } catch (error) {
      console.error("Error fetching referral code:", error);
      res.status(500).send("Failed to fetch referral code");
    }
  });

  app.get("/api/referral/stats", async (req, res) => {
    try {
      const referralCount = await CreditManager.getReferralCount(req.user!.id);
      const currentTier = CreditManager.REFERRAL_TIERS.findIndex(
        tier => referralCount >= tier.min && referralCount <= tier.max
      ) + 1;

      const currentTierInfo = CreditManager.REFERRAL_TIERS[currentTier - 1];
      const nextTierInfo = CreditManager.REFERRAL_TIERS[currentTier] || null;

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