import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { sql, relations, eq, and, or, inArray } from "drizzle-orm";

// Define all tables first, starting with independent tables
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").unique().notNull(),
  password: text("password").notNull(),
  referralCode: text("referral_code").unique(),
  totalReferralBonus: integer("total_referral_bonus").default(0),
  xpPoints: integer("xp_points").default(0).notNull(),
  level: integer("level").default(1).notNull(),
  totalXpEarned: integer("total_xp_earned").default(0).notNull(),
  levelUpNotification: boolean("level_up_notification").default(false),
});

export const levelMilestones = pgTable("level_milestones", {
  id: serial("id").primaryKey(),
  level: integer("level").notNull(),
  rewardType: text("reward_type").notNull(),
  rewardValue: jsonb("reward_value").notNull(),
  description: text("description").notNull(),
});

export const userRewards = pgTable("user_rewards", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  milestoneId: integer("milestone_id").notNull().references(() => levelMilestones.id),
  claimed: boolean("claimed").default(false).notNull(),
  claimedAt: timestamp("claimed_at"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const creditTransactions = pgTable("credit_transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  amount: integer("amount").notNull(),
  type: text("type").notNull(),
  reason: text("reason").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const creditPurchases = pgTable("credit_purchases", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  amount: integer("amount").notNull(),
  cost: integer("cost").notNull(),
  status: text("status").notNull(),
  paymentIntentId: text("payment_intent_id"),
  paymentMethodId: text("payment_method_id"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  completedAt: timestamp("completed_at"),
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

export const cardPacks = pgTable("card_packs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

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

export const listingViews = pgTable("listing_views", {
  id: serial("id").primaryKey(),
  listingId: integer("listing_id").notNull().references(() => packListings.id),
  viewerId: integer("viewer_id").references(() => users.id),
  viewedAt: timestamp("viewed_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  duration: integer("duration_seconds"),
  source: text("source"),
  deviceType: text("device_type"),
});

export const listingPriceHistory = pgTable("listing_price_history", {
  id: serial("id").primaryKey(),
  listingId: integer("listing_id").notNull().references(() => packListings.id),
  price: integer("price").notNull(),
  changedAt: timestamp("changed_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  reason: text("reason"),
});

export const listingAnalyticsAggregate = pgTable("listing_analytics_aggregate", {
  id: serial("id").primaryKey(),
  listingId: integer("listing_id").notNull().references(() => packListings.id),
  date: timestamp("date").notNull(),
  viewCount: integer("view_count").notNull().default(0),
  uniqueViewers: integer("unique_viewers").notNull().default(0),
  averageViewDuration: integer("average_view_duration"),
  totalRevenue: integer("total_revenue").notNull().default(0),
  conversionRate: integer("conversion_rate").notNull().default(0),
  categoryPerformance: jsonb("category_performance"),
  comparisonMetrics: jsonb("comparison_metrics"),
});

export const listingEngagementMetrics = pgTable("listing_engagement_metrics", {
  id: serial("id").primaryKey(),
  listingId: integer("listing_id").notNull().references(() => packListings.id),
  date: timestamp("date").notNull(),
  clickThroughRate: integer("click_through_rate").notNull().default(0),
  bookmarkCount: integer("bookmark_count").notNull().default(0),
  shareCount: integer("share_count").notNull().default(0),
  inquiryCount: integer("inquiry_count").notNull().default(0),
});

export const globalCardPool = pgTable("global_card_pool", {
  id: serial("id").primaryKey(),
  cardId: integer("card_id").notNull().references(() => tradingCards.id),
  originalOwnerId: integer("original_owner_id").notNull().references(() => users.id),
  inPack: boolean("in_pack").default(false).notNull(),
  transferredAt: timestamp("transferred_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const cardPackCards = pgTable("card_pack_cards", {
  id: serial("id").primaryKey(),
  packId: integer("pack_id").notNull().references(() => cardPacks.id),
  globalPoolCardId: integer("global_pool_card_id").notNull().references(() => globalCardPool.id),
  position: integer("position").notNull(),
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

// Define relations
export const usersRelations = relations(users, ({ many }) => ({
  images: many(images),
  tradingCards: many(tradingCards),
  cardTemplates: many(cardTemplates, { relationName: "creator" }),
  cardPacks: many(cardPacks),
  creditTransactions: many(creditTransactions),
  creditPurchases: many(creditPurchases),
  favorites: many(userFavorites),
  challengeProgress: many(challengeProgress),
  rewards: many(userRewards),
}));

export const creditTransactionsRelations = relations(creditTransactions, ({ one }) => ({
  user: one(users, {
    fields: [creditTransactions.userId],
    references: [users.id],
  }),
}));

export const creditPurchasesRelations = relations(creditPurchases, ({ one }) => ({
  user: one(users, {
    fields: [creditPurchases.userId],
    references: [users.id],
  }),
}));

export const cardPacksRelations = relations(cardPacks, ({ one, many }) => ({
  owner: one(users, {
    fields: [cardPacks.userId],
    references: [users.id],
  }),
  cards: many(cardPackCards),
  listings: many(packListings),
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
  views: many(listingViews),
  priceHistory: many(listingPriceHistory),
  analytics: one(listingAnalyticsAggregate),
  engagement: one(listingEngagementMetrics),

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

export const listingViewsRelations = relations(listingViews, ({ one }) => ({
  listing: one(packListings, {
    fields: [listingViews.listingId],
    references: [packListings.id],
  }),
  viewer: one(users, {
    fields: [listingViews.viewerId],
    references: [users.id],
  }),
}));

export const listingPriceHistoryRelations = relations(listingPriceHistory, ({ one }) => ({
  listing: one(packListings, {
    fields: [listingPriceHistory.listingId],
    references: [packListings.id],
  }),
}));

export const listingAnalyticsAggregateRelations = relations(listingAnalyticsAggregate, ({ one }) => ({
  listing: one(packListings, {
    fields: [listingAnalyticsAggregate.listingId],
    references: [packListings.id],
  }),
}));

export const listingEngagementMetricsRelations = relations(listingEngagementMetrics, ({ one }) => ({
  listing: one(packListings, {
    fields: [listingEngagementMetrics.listingId],
    references: [packListings.id],
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
  inGlobalPool: many(globalCardPool),
  inGame: many(gameCards),

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


// Finally, define schemas and types
export const insertCreditTransactionSchema = createInsertSchema(creditTransactions);
export const selectCreditTransactionSchema = createSelectSchema(creditTransactions);

export const insertCreditPurchaseSchema = createInsertSchema(creditPurchases);
export const selectCreditPurchaseSchema = createSelectSchema(creditPurchases);

export const insertPackListingSchema = createInsertSchema(packListings);
export const selectPackListingSchema = createSelectSchema(packListings);

export const insertCardPackSchema = createInsertSchema(cardPacks);
export const selectCardPackSchema = createSelectSchema(cardPacks);

export const insertCardPackCardSchema = createInsertSchema(cardPackCards);
export const selectCardPackCardSchema = createSelectSchema(cardPackCards);

export const insertGlobalCardPoolSchema = createInsertSchema(globalCardPool);
export const selectGlobalCardPoolSchema = createSelectSchema(globalCardPool);

export const insertMarketplaceTransactionSchema = createInsertSchema(marketplaceTransactions);
export const selectMarketplaceTransactionSchema = createSelectSchema(marketplaceTransactions);

export const insertListingViewSchema = createInsertSchema(listingViews);
export const selectListingViewSchema = createSelectSchema(listingViews);

export const insertListingPriceHistorySchema = createInsertSchema(listingPriceHistory);
export const selectListingPriceHistorySchema = createSelectSchema(listingPriceHistory);

export const insertListingAnalyticsAggregateSchema = createInsertSchema(listingAnalyticsAggregate);
export const selectListingAnalyticsAggregateSchema = createSelectSchema(listingAnalyticsAggregate);

export const insertListingEngagementMetricsSchema = createInsertSchema(listingEngagementMetrics);
export const selectListingEngagementMetricsSchema = createSelectSchema(listingEngagementMetrics);

export type InsertCreditTransaction = typeof creditTransactions.$inferInsert;
export type SelectCreditTransaction = typeof creditTransactions.$inferSelect;

export type InsertCreditPurchase = typeof creditPurchases.$inferInsert;
export type SelectCreditPurchase = typeof creditPurchases.$inferSelect;

export type InsertPackListing = typeof packListings.$inferInsert;
export type SelectPackListing = typeof packListings.$inferSelect;

export type InsertCardPack = typeof cardPacks.$inferInsert;
export type SelectCardPack = typeof cardPacks.$inferSelect;

export type InsertCardPackCard = typeof cardPackCards.$inferInsert;
export type SelectCardPackCard = typeof cardPackCards.$inferSelect;

export type InsertGlobalCardPool = typeof globalCardPool.$inferInsert;
export type SelectGlobalCardPool = typeof globalCardPool.$inferSelect;

export type InsertMarketplaceTransaction = typeof marketplaceTransactions.$inferInsert;
export type SelectMarketplaceTransaction = typeof marketplaceTransactions.$inferSelect;

export type InsertListingView = typeof listingViews.$inferInsert;
export type SelectListingView = typeof listingViews.$inferSelect;

export type InsertListingPriceHistory = typeof listingPriceHistory.$inferInsert;
export type SelectListingPriceHistory = typeof listingPriceHistory.$inferSelect;

export type InsertListingAnalyticsAggregate = typeof listingAnalyticsAggregate.$inferInsert;
export type SelectListingAnalyticsAggregate = typeof listingAnalyticsAggregate.$inferSelect;

export type InsertListingEngagementMetrics = typeof listingEngagementMetrics.$inferInsert;
export type SelectListingEngagementMetrics = typeof listingEngagementMetrics.$inferSelect;

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