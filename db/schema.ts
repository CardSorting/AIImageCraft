import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { sql } from "drizzle-orm";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").unique().notNull(),
  password: text("password").notNull(),
  referralCode: text("referral_code").unique(),
  totalReferralBonus: integer("total_referral_bonus").default(0),
  // Add XP and level tracking
  xpPoints: integer("xp_points").default(0).notNull(),
  level: integer("level").default(1).notNull(),
  totalXpEarned: integer("total_xp_earned").default(0).notNull(),
  levelUpNotification: boolean("level_up_notification").default(false),
});

// New table for level milestone rewards
export const levelMilestones = pgTable("level_milestones", {
  id: serial("id").primaryKey(),
  level: integer("level").notNull(),
  rewardType: text("reward_type").notNull(), // 'CREDITS', 'BADGE', 'TITLE'
  rewardValue: jsonb("reward_value").notNull(),
  description: text("description").notNull(),
});

// New table for user rewards
export const userRewards = pgTable("user_rewards", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  milestoneId: integer("milestone_id").notNull().references(() => levelMilestones.id),
  claimed: boolean("claimed").default(false).notNull(),
  claimedAt: timestamp("claimed_at"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const referrals = pgTable("referrals", {
  id: serial("id").primaryKey(),
  referrerId: integer("referrer_id").notNull().references(() => users.id),
  refereeId: integer("referee_id").notNull().references(() => users.id).unique(),
  status: text("status").notNull().default('pending'),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  completedAt: timestamp("completed_at"),
});

export const referralBonuses = pgTable("referral_bonuses", {
  id: serial("id").primaryKey(),
  referralId: integer("referral_id").notNull().references(() => referrals.id),
  amount: integer("amount").notNull(),
  type: text("type").notNull(),
  status: text("status").notNull().default('pending'),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  processedAt: timestamp("processed_at"),
  metadata: jsonb("metadata"),
});

export const images = pgTable("images", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  url: text("url").notNull(),
  prompt: text("prompt").notNull(),
  variationIndex: integer("variation_index"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const cardTemplates = pgTable("card_templates", {
  id: serial("id").primaryKey(),
  imageId: integer("image_id").notNull().references(() => images.id),
  name: text("name").notNull(),
  description: text("description").notNull(),
  elementalType: text("elemental_type").notNull(),
  rarity: text("rarity").notNull(),
  powerStats: jsonb("power_stats").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  creatorId: integer("creator_id").notNull().references(() => users.id),
});

export const tradingCards = pgTable("trading_cards", {
  id: serial("id").primaryKey(),
  templateId: integer("template_id").notNull().references(() => cardTemplates.id),
  userId: integer("user_id").references(() => users.id), 
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Add the global card pool table after tradingCards table
export const globalCardPool = pgTable("global_card_pool", {
  id: serial("id").primaryKey(),
  cardId: integer("card_id").notNull().references(() => tradingCards.id),
  originalOwnerId: integer("original_owner_id").notNull().references(() => users.id),
  inPack: boolean("in_pack").default(false).notNull(),
  transferredAt: timestamp("transferred_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Add relations for global card pool
export const globalCardPoolRelations = relations(globalCardPool, ({ one }) => ({
  card: one(tradingCards, {
    fields: [globalCardPool.cardId],
    references: [tradingCards.id],
  }),
  originalOwner: one(users, {
    fields: [globalCardPool.originalOwnerId],
    references: [users.id],
  }),
}));

// Update card pack cards to reference global pool
export const cardPacks = pgTable("card_packs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const cardPackCards = pgTable("card_pack_cards", {
  id: serial("id").primaryKey(),
  packId: integer("pack_id").notNull().references(() => cardPacks.id),
  globalPoolCardId: integer("global_pool_card_id").notNull().references(() => globalCardPool.id),
  position: integer("position").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const cardPacksRelations = relations(cardPacks, ({ one, many }) => ({
  owner: one(users, {
    fields: [cardPacks.userId],
    references: [users.id],
  }),
  cards: many(cardPackCards),
}));

export const cardPackCardsRelations = relations(cardPackCards, ({ one }) => ({
  pack: one(cardPacks, {
    fields: [cardPackCards.packId],
    references: [cardPacks.id],
  }),
  globalPoolCard: one(globalCardPool, {
    fields: [cardPackCards.globalPoolCardId],
    references: [globalCardPool.id],
  }),
}));


export const tags = pgTable("tags", {
  id: serial("id").primaryKey(),
  name: text("name").unique().notNull(),
});

export const imageTags = pgTable("image_tags", {
  id: serial("id").primaryKey(),
  imageId: integer("image_id").notNull().references(() => images.id),
  tagId: integer("tag_id").notNull().references(() => tags.id),
});

export const trades = pgTable("trades", {
  id: serial("id").primaryKey(),
  initiatorId: integer("initiator_id").notNull().references(() => users.id),
  receiverId: integer("receiver_id").notNull().references(() => users.id),
  status: text("status").notNull().default('pending'),
  message: text("message"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const tradeItems = pgTable("trade_items", {
  id: serial("id").primaryKey(),
  tradeId: integer("trade_id").notNull().references(() => trades.id),
  cardId: integer("card_id").notNull().references(() => tradingCards.id),
  offererId: integer("offerer_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const games = pgTable("games", {
  id: serial("id").primaryKey(),
  player1Id: integer("player1_id").notNull().references(() => users.id),
  player2Id: integer("player2_id").notNull().references(() => users.id),
  winnerId: integer("winner_id").references(() => users.id),
  status: text("status").notNull().default('ACTIVE'),
  currentTurn: integer("current_turn").notNull().default(1),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  gameState: jsonb("game_state").notNull(),
});

export const gameCards = pgTable("game_cards", {
  id: serial("id").primaryKey(),
  gameId: integer("game_id").notNull().references(() => games.id),
  cardId: integer("card_id").notNull().references(() => tradingCards.id),
  ownerId: integer("owner_id").notNull().references(() => users.id),
  position: text("position").notNull().default('DECK'),
  order: integer("order").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const userFavorites = pgTable("user_favorites", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  itemType: text("item_type").notNull(),
  itemId: integer("item_id").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const dailyChallenges = pgTable("daily_challenges", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  creditReward: integer("credit_reward").notNull(),
  requiredCount: integer("required_count").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const challengeProgress = pgTable("challenge_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  challengeId: integer("challenge_id").notNull().references(() => dailyChallenges.id),
  progress: integer("progress").notNull().default(0),
  completed: boolean("completed").notNull().default(false),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  images: many(images),
  tradingCards: many(tradingCards),
  cardTemplates: many(cardTemplates, { relationName: "creator" }),
  cardPacks: many(cardPacks),
  initiatedTrades: many(trades, { relationName: "initiator" }),
  receivedTrades: many(trades, { relationName: "receiver" }),
  gamesAsPlayer1: many(games, { relationName: "player1" }),
  gamesAsPlayer2: many(games, { relationName: "player2" }),
  wonGames: many(games, { relationName: "winner" }),
  favorites: many(userFavorites),
  referralsGiven: many(referrals, { relationName: "referrer" }),
  referralsReceived: many(referrals, { relationName: "referee" }),
  challengeProgress: many(challengeProgress),
  rewards: many(userRewards),
}));

export const imagesRelations = relations(images, ({ one, many }) => ({
  user: one(users, {
    fields: [images.userId],
    references: [users.id],
  }),
  tags: many(imageTags),
  cardTemplate: many(cardTemplates),
}));

export const cardTemplatesRelations = relations(cardTemplates, ({ one, many }) => ({
  image: one(images, {
    fields: [cardTemplates.imageId],
    references: [images.id],
  }),
  creator: one(users, {
    fields: [cardTemplates.creatorId],
    references: [users.id],
  }),
  tradingCards: many(tradingCards),
}));

export const tradingCardsRelations = relations(tradingCards, ({ one, many }) => ({
  template: one(cardTemplates, {
    fields: [tradingCards.templateId],
    references: [cardTemplates.id],
  }),
  owner: one(users, {
    fields: [tradingCards.userId],
    references: [users.id],
  }),
  tradeItems: many(tradeItems),
  favoritedBy: many(userFavorites),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  images: many(imageTags),
}));

export const imageTagsRelations = relations(imageTags, ({ one }) => ({
  image: one(images, {
    fields: [imageTags.imageId],
    references: [images.id],
  }),
  tag: one(tags, {
    fields: [imageTags.tagId],
    references: [tags.id],
  }),
}));

export const tradesRelations = relations(trades, ({ one, many }) => ({
  initiator: one(users, {
    fields: [trades.initiatorId],
    references: [users.id],
  }),
  receiver: one(users, {
    fields: [trades.receiverId],
    references: [users.id],
  }),
  items: many(tradeItems),
}));

export const tradeItemsRelations = relations(tradeItems, ({ one }) => ({
  trade: one(trades, {
    fields: [tradeItems.tradeId],
    references: [trades.id],
  }),
  card: one(tradingCards, {
    fields: [tradeItems.cardId],
    references: [tradingCards.id],
  }),
  offerer: one(users, {
    fields: [tradeItems.offererId],
    references: [users.id],
  }),
}));

export const gamesRelations = relations(games, ({ one, many }) => ({
  player1: one(users, {
    fields: [games.player1Id],
    references: [users.id],
  }),
  player2: one(users, {
    fields: [games.player2Id],
    references: [users.id],
  }),
  winner: one(users, {
    fields: [games.winnerId],
    references: [users.id],
  }),
  cards: many(gameCards),
}));

export const gameCardsRelations = relations(gameCards, ({ one }) => ({
  game: one(games, {
    fields: [gameCards.gameId],
    references: [games.id],
  }),
  card: one(tradingCards, {
    fields: [gameCards.cardId],
    references: [tradingCards.id],
  }),
  owner: one(users, {
    fields: [gameCards.ownerId],
    references: [users.id],
  }),
}));

export const userFavoritesRelations = relations(userFavorites, ({ one }) => ({
    user: one(users, {
        fields: [userFavorites.userId],
        references: [users.id],
    }),
}));

export const referralsRelations = relations(referrals, ({ one, many }) => ({
  referrer: one(users, {
    fields: [referrals.referrerId],
    references: [users.id],
    relationName: "referrer",
  }),
  referee: one(users, {
    fields: [referrals.refereeId],
    references: [users.id],
    relationName: "referee",
  }),
  bonuses: many(referralBonuses),
}));

export const referralBonusesRelations = relations(referralBonuses, ({ one }) => ({
  referral: one(referrals, {
    fields: [referralBonuses.referralId],
    references: [referrals.id],
  }),
}));

export const dailyChallengesRelations = relations(dailyChallenges, ({ many }) => ({
  progress: many(challengeProgress),
}));

export const challengeProgressRelations = relations(challengeProgress, ({ one }) => ({
  user: one(users, {
    fields: [challengeProgress.userId],
    references: [users.id],
  }),
  challenge: one(dailyChallenges, {
    fields: [challengeProgress.challengeId],
    references: [dailyChallenges.id],
  }),
}));

export const levelMilestonesRelations = relations(levelMilestones, ({ many }) => ({
  userRewards: many(userRewards),
}));

export const userRewardsRelations = relations(userRewards, ({ one }) => ({
  user: one(users, {
    fields: [userRewards.userId],
    references: [users.id],
  }),
  milestone: one(levelMilestones, {
    fields: [userRewards.milestoneId],
    references: [levelMilestones.id],
  }),
}));

// Add marketplace tables after the existing tables
export const packListings = pgTable("pack_listings", {
  id: serial("id").primaryKey(),
  packId: integer("pack_id").notNull().references(() => cardPacks.id),
  sellerId: integer("seller_id").notNull().references(() => users.id),
  price: integer("price").notNull(),
  status: text("status").notNull().default('ACTIVE'),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const marketplaceTransactions = pgTable("marketplace_transactions", {
  id: serial("id").primaryKey(),
  listingId: integer("listing_id").notNull().references(() => packListings.id),
  buyerId: integer("buyer_id").notNull().references(() => users.id),
  price: integer("price").notNull(),
  status: text("status").notNull().default('COMPLETED'),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Add relations for marketplace tables
export const packListingsRelations = relations(packListings, ({ one, many }) => ({
  pack: one(cardPacks, {
    fields: [packListings.packId],
    references: [cardPacks.id],
  }),
  seller: one(users, {
    fields: [packListings.sellerId],
    references: [users.id],
  }),
  transactions: many(marketplaceTransactions),
}));

export const marketplaceTransactionsRelations = relations(marketplaceTransactions, ({ one }) => ({
  listing: one(packListings, {
    fields: [marketplaceTransactions.listingId],
    references: [packListings.id],
  }),
  buyer: one(users, {
    fields: [marketplaceTransactions.buyerId],
    references: [users.id],
  }),
}));

export const insertCardTemplateSchema = createInsertSchema(cardTemplates);
export const selectCardTemplateSchema = createSelectSchema(cardTemplates);

export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);

export const insertImageSchema = createInsertSchema(images);
export const selectImageSchema = createSelectSchema(images);

export const insertTradingCardSchema = createInsertSchema(tradingCards);
export const selectTradingCardSchema = createSelectSchema(tradingCards);

export const insertTagSchema = createInsertSchema(tags);
export const selectTagSchema = createSelectSchema(tags);

export const insertImageTagSchema = createInsertSchema(imageTags);
export const selectImageTagSchema = createSelectSchema(imageTags);

export const insertTradeSchema = createInsertSchema(trades);
export const selectTradeSchema = createSelectSchema(trades);

export const insertTradeItemSchema = createInsertSchema(tradeItems);
export const selectTradeItemSchema = createSelectSchema(tradeItems);

export const insertGameSchema = createInsertSchema(games);
export const selectGameSchema = createSelectSchema(games);

export const insertGameCardSchema = createInsertSchema(gameCards);
export const selectGameCardSchema = createSelectSchema(gameCards);

export const insertUserFavoriteSchema = createInsertSchema(userFavorites);
export const selectUserFavoriteSchema = createSelectSchema(userFavorites);

export const insertReferralSchema = createInsertSchema(referrals);
export const selectReferralSchema = createSelectSchema(referrals);

export const insertReferralBonusSchema = createInsertSchema(referralBonuses);
export const selectReferralBonusSchema = createSelectSchema(referralBonuses);

export const insertDailyChallengeSchema = createInsertSchema(dailyChallenges);
export const selectDailyChallengeSchema = createSelectSchema(dailyChallenges);

export const insertChallengeProgressSchema = createInsertSchema(challengeProgress);
export const selectChallengeProgressSchema = createSelectSchema(challengeProgress);

export const insertLevelMilestoneSchema = createInsertSchema(levelMilestones);
export const selectLevelMilestoneSchema = createSelectSchema(levelMilestones);

export const insertUserRewardSchema = createInsertSchema(userRewards);
export const selectUserRewardSchema = createSelectSchema(userRewards);

// Add schemas for the new tables
export const insertCardPackSchema = createInsertSchema(cardPacks);
export const selectCardPackSchema = createSelectSchema(cardPacks);

export const insertCardPackCardSchema = createInsertSchema(cardPackCards);
export const selectCardPackCardSchema = createSelectSchema(cardPackCards);

export const insertGlobalCardPoolSchema = createInsertSchema(globalCardPool);
export const selectGlobalCardPoolSchema = createSelectSchema(globalCardPool);

export const insertPackListingSchema = createInsertSchema(packListings);
export const selectPackListingSchema = createSelectSchema(packListings);

export const insertMarketplaceTransactionSchema = createInsertSchema(marketplaceTransactions);
export const selectMarketplaceTransactionSchema = createSelectSchema(marketplaceTransactions);


export type InsertCardTemplate = typeof cardTemplates.$inferInsert;
export type SelectCardTemplate = typeof cardTemplates.$inferSelect;

export type InsertUser = typeof users.$inferInsert;
export type SelectUser = typeof users.$inferSelect;

export type InsertImage = typeof images.$inferInsert;
export type SelectImage = typeof images.$inferSelect;

export type InsertTradingCard = typeof tradingCards.$inferInsert;
export type SelectTradingCard = typeof tradingCards.$inferSelect;

export type InsertTag = typeof tags.$inferInsert;
export type SelectTag = typeof tags.$inferSelect;

export type InsertImageTag = typeof imageTags.$inferInsert;
export type SelectImageTag = typeof imageTags.$inferSelect;

export type InsertTrade = typeof trades.$inferInsert;
export type SelectTrade = typeof trades.$inferSelect;

export type InsertTradeItem = typeof tradeItems.$inferInsert;
export type SelectTradeItem = typeof tradeItems.$inferSelect;

export type InsertGame = typeof games.$inferInsert;
export type SelectGame = typeof games.$inferSelect;

export type InsertGameCard = typeof gameCards.$inferInsert;
export type SelectGameCard = typeof gameCards.$inferSelect;

export type InsertUserFavorite = typeof userFavorites.$inferInsert;
export type SelectUserFavorite = typeof userFavorites.$inferSelect;

export type InsertReferral = typeof referrals.$inferInsert;
export type SelectReferral = typeof referrals.$inferSelect;

export type InsertReferralBonus = typeof referralBonuses.$inferInsert;
export type SelectReferralBonus = typeof referralBonuses.$inferSelect;

export type InsertDailyChallenge = typeof dailyChallenges.$inferInsert;
export type SelectDailyChallenge = typeof dailyChallenges.$inferSelect;

export type InsertChallengeProgress = typeof challengeProgress.$inferInsert;
export type SelectChallengeProgress = typeof challengeProgress.$inferSelect;

export type InsertLevelMilestone = typeof levelMilestones.$inferInsert;
export type SelectLevelMilestone = typeof levelMilestones.$inferSelect;

export type InsertUserReward = typeof userRewards.$inferInsert;
export type SelectUserReward = typeof userRewards.$inferSelect;

// Add types for the new tables
export type InsertCardPack = typeof cardPacks.$inferInsert;
export type SelectCardPack = typeof cardPacks.$inferSelect;

export type InsertCardPackCard = typeof cardPackCards.$inferInsert;
export type SelectCardPackCard = typeof cardPackCards.$inferSelect;

export type InsertGlobalCardPool = typeof globalCardPool.$inferInsert;
export type SelectGlobalCardPool = typeof globalCardPool.$inferSelect;

export type InsertPackListing = typeof packListings.$inferInsert;
export type SelectPackListing = typeof packListings.$inferSelect;

export type InsertMarketplaceTransaction = typeof marketplaceTransactions.$inferInsert;
export type SelectMarketplaceTransaction = typeof marketplaceTransactions.$inferSelect;