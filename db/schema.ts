import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { sql, relations, type Relations } from "drizzle-orm";
import { many } from "drizzle-orm/pg-core";

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

// Add tasks table after users table
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  taskId: text("task_id").unique().notNull(),
  userId: integer("user_id").notNull().references(() => users.id),
  prompt: text("prompt").notNull(),
  status: text("status").notNull().default('pending'),
  output: jsonb("output"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Add creditBalances table definition after users table
export const creditBalances = pgTable("credit_balances", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  balance: integer("balance").notNull().default(0),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
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

// Core marketplace tables
export const marketplaceListings = pgTable("marketplace_listings", {
  id: serial("id").primaryKey(),
  sellerId: integer("seller_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  basePrice: integer("base_price").notNull(),
  status: text("status").notNull().default('DRAFT'),
  type: text("type").notNull(), // SINGLE_CARD, PACK, BUNDLE
  metadata: jsonb("metadata").notNull(), // Flexible storage for different listing types
  visibility: text("visibility").notNull().default('PUBLIC'),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  expiresAt: timestamp("expires_at"),
  lastProcessedAt: timestamp("last_processed_at"),
  processingLock: text("processing_lock"), // For distributed locking
});

export const marketplaceTransactions = pgTable("marketplace_transactions", {
  id: serial("id").primaryKey(),
  listingId: integer("listing_id").notNull().references(() => marketplaceListings.id),
  buyerId: integer("buyer_id").notNull().references(() => users.id),
  sellerId: integer("seller_id").notNull().references(() => users.id),
  status: text("status").notNull(),
  amount: integer("amount").notNull(),
  fee: integer("fee").notNull(),
  processingKey: text("processing_key").unique(), // Redis transaction processing key
  escrowKey: text("escrow_key").unique(), // Redis escrow reference
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  completedAt: timestamp("completed_at"),
  expiresAt: timestamp("expires_at"),
  redisStateKey: text("redis_state_key").unique(), // For transaction state machine
});

export const marketplaceDisputes = pgTable("marketplace_disputes", {
  id: serial("id").primaryKey(),
  transactionId: integer("transaction_id").notNull().references(() => marketplaceTransactions.id),
  reporterId: integer("reporter_id").notNull().references(() => users.id),
  type: text("type").notNull(),
  status: text("status").notNull().default('OPEN'),
  reason: text("reason").notNull(),
  resolution: text("resolution"),
  evidenceKeys: jsonb("evidence_keys"), // Array of Redis keys containing evidence
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  resolvedAt: timestamp("resolved_at"),
  processingQueueKey: text("processing_queue_key"), // Redis processing queue reference
});

export const marketplaceEscrow = pgTable("marketplace_escrow", {
  id: serial("id").primaryKey(),
  transactionId: integer("transaction_id").notNull().references(() => marketplaceTransactions.id).unique(),
  amount: integer("amount").notNull(),
  releaseConditions: jsonb("release_conditions").notNull(),
  status: text("status").notNull().default('HELD'),
  redisLockKey: text("redis_lock_key").unique(), // For distributed locking
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  releasedAt: timestamp("released_at"),
  expiresAt: timestamp("expires_at"),
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


// Add new analytics and marketplace enhancement tables
export const marketplaceAnalytics = pgTable("marketplace_analytics", {
  id: serial("id").primaryKey(),
  date: timestamp("date").notNull(),
  totalListings: integer("total_listings").notNull().default(0),
  activeSellers: integer("active_sellers").notNull().default(0),
  totalVolume: integer("total_volume").notNull().default(0),
  averagePrice: integer("average_price").notNull().default(0),
  topCategories: jsonb("top_categories"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const sellerMetrics = pgTable("seller_metrics", {
  id: serial("id").primaryKey(),
  sellerId: integer("seller_id").notNull().references(() => users.id),
  totalSales: integer("total_sales").notNull().default(0),
  totalRevenue: integer("total_revenue").notNull().default(0),
  averageRating: integer("average_rating").notNull().default(0),
  responseTime: integer("response_time"),
  completionRate: integer("completion_rate").notNull().default(0),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Fix listingCategories table definition
export const listingCategories = pgTable("listing_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  parentId: integer("parent_id").references(() => listingCategories.id),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const listingCategoryAssignments = pgTable("listing_category_assignments", {
  id: serial("id").primaryKey(),
  listingId: integer("listing_id").notNull().references(() => marketplaceListings.id), // Updated to reference new marketplaceListings
  categoryId: integer("category_id").notNull().references(() => listingCategories.id),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Add marketplaceOperationLog table definition
export const marketplaceOperationLog = pgTable("marketplace_operation_log", {
  id: serial("id").primaryKey(),
  operationType: text("operation_type").notNull(),
  targetType: text("target_type").notNull(),
  targetId: integer("target_id").notNull(),
  status: text("status").notNull(),
  metadata: jsonb("metadata"),
  redisKey: text("redis_key"),
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
  creditBalances: many(creditBalances), //add this line
}));

// Add creditBalances relations after usersRelations
export const creditBalancesRelations = relations(creditBalances, ({ one }) => ({
  user: one(users, {
    fields: [creditBalances.userId],
    references: [users.id],
  }),
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
  listings: many(marketplaceListings), //Updated to reference new marketplaceListings
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

// Fix relations for marketplaceListings
export const marketplaceListingsRelations = relations(marketplaceListings, ({ one, many }) => ({
  seller: one(users, {
    fields: [marketplaceListings.sellerId],
    references: [users.id],
  }),
  transactions: many(marketplaceTransactions),
  categories: many(listingCategoryAssignments),
  operationLogs: many(marketplaceOperationLog, {
    relationName: "listingOperations",
  }),
}));

export const marketplaceTransactionsRelations = relations(marketplaceTransactions, ({ one, many }) => ({
  listing: one(marketplaceListings, {
    fields: [marketplaceTransactions.listingId],
    references: [marketplaceListings.id],
  }),
  buyer: one(users, {
    fields: [marketplaceTransactions.buyerId],
    references: [users.id],
  }),
  seller: one(users, {
    fields: [marketplaceTransactions.sellerId],
    references: [users.id],
  }),
  escrow: one(marketplaceEscrow),
  disputes: many(marketplaceDisputes),
}));

export const marketplaceDisputesRelations = relations(marketplaceDisputes, ({ one }) => ({
  transaction: one(marketplaceTransactions, {
    fields: [marketplaceDisputes.transactionId],
    references: [marketplaceTransactions.id],
  }),
  reporter: one(users, {
    fields: [marketplaceDisputes.reporterId],
    references: [users.id],
  }),
}));

export const marketplaceEscrowRelations = relations(marketplaceEscrow, ({ one }) => ({
  transaction: one(marketplaceTransactions, {
    fields: [marketplaceEscrow.transactionId],
    references: [marketplaceTransactions.id],
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

// Add relations
export const marketplaceAnalyticsRelations = relations(marketplaceAnalytics, ({ }) => ({}));

export const sellerMetricsRelations = relations(sellerMetrics, ({ one }) => ({
  seller: one(users, {
    fields: [sellerMetrics.sellerId],
    references: [users.id],
  }),
}));

// Fix relations for listingCategories
export const listingCategoriesRelations = relations(listingCategories, ({ one, many }) => ({
  parent: one(listingCategories, {
    fields: [listingCategories.parentId],
    references: [listingCategories.id],
  }),
  assignments: many(listingCategoryAssignments),
}));

export const listingCategoryAssignmentsRelations = relations(listingCategoryAssignments, ({ one }) => ({
  listing: one(marketplaceListings, { // Updated to reference new marketplaceListings
    fields: [listingCategoryAssignments.listingId],
    references: [marketplaceListings.id],
  }),
  category: one(listingCategories, {
    fields: [listingCategoryAssignments.categoryId],
    references: [listingCategories.id],
  }),
}));

// Fix relations for marketplaceOperationLog
export const marketplaceOperationLogRelations = relations(marketplaceOperationLog, ({ one }) => ({
  listing: one(marketplaceListings, {
    fields: [marketplaceOperationLog.targetId],
    references: [marketplaceListings.id],
    relationName: "listingOperations",
  }),
}));


// Finally, define schemas and types
export const insertCreditTransactionSchema = createInsertSchema(creditTransactions);
export const selectCreditTransactionSchema = createSelectSchema(creditTransactions);

export const insertCreditPurchaseSchema = createInsertSchema(creditPurchases);
export const selectCreditPurchaseSchema = createSelectSchema(creditPurchases);

export const insertCardPackSchema = createInsertSchema(cardPacks);
export const selectCardPackSchema = createSelectSchema(cardPacks);

export const insertCardPackCardSchema = createInsertSchema(cardPackCards);
export const selectCardPackCardSchema = createSelectSchema(cardPackCards);

export const insertGlobalCardPoolSchema = createInsertSchema(globalCardPool);
export const selectGlobalCardPoolSchema = createSelectSchema(globalCardPool);

export const insertMarketplaceListingSchema = createInsertSchema(marketplaceListings);
export const selectMarketplaceListingSchema = createSelectSchema(marketplaceListings);

export const insertMarketplaceTransactionSchema = createInsertSchema(marketplaceTransactions);
export const selectMarketplaceTransactionSchema = createSelectSchema(marketplaceTransactions);

export const insertMarketplaceDisputeSchema = createInsertSchema(marketplaceDisputes);
export const selectMarketplaceDisputeSchema = createSelectSchema(marketplaceDisputes);

export const insertMarketplaceEscrowSchema = createInsertSchema(marketplaceEscrow);
export const selectMarketplaceEscrowSchema = createSelectSchema(marketplaceEscrow);

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

// Add new schemas
export const insertMarketplaceAnalyticsSchema = createInsertSchema(marketplaceAnalytics);
export const selectMarketplaceAnalyticsSchema = createSelectSchema(marketplaceAnalytics);

export const insertSellerMetricsSchema = createInsertSchema(sellerMetrics);
export const selectSellerMetricsSchema = createSelectSchema(sellerMetrics);

export const insertListingCategorySchema = createInsertSchema(listingCategories);
export const selectListingCategorySchema = createSelectSchema(listingCategories);

export const insertListingCategoryAssignmentSchema = createInsertSchema(listingCategoryAssignments);
export const selectListingCategoryAssignmentSchema = createSelectSchema(listingCategoryAssignments);

// Add operation log schemas
export const insertMarketplaceOperationLogSchema = createInsertSchema(marketplaceOperationLog);
export const selectMarketplaceOperationLogSchema = createSelectSchema(marketplaceOperationLog);

// Add new types
export type InsertMarketplaceAnalytics = typeof marketplaceAnalytics.$inferInsert;
export type SelectMarketplaceAnalytics = typeof marketplaceAnalytics.$inferSelect;

export type InsertSellerMetrics = typeof sellerMetrics.$inferInsert;
export type SelectSellerMetrics = typeof sellerMetrics.$inferSelect;

export type InsertListingCategory = typeof listingCategories.$inferInsert;
export type SelectListingCategory = typeof listingCategories.$inferSelect;

export type InsertListingCategoryAssignment = typeof listingCategoryAssignments.$inferInsert;
export type SelectListingCategoryAssignment = typeof listingCategoryAssignments.$inferSelect;

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

export type InsertMarketplaceListing = typeof marketplaceListings.$inferInsert;
export type SelectMarketplaceListing = typeof marketplaceListings.$inferSelect;

export type InsertMarketplaceTransaction = typeof marketplaceTransactions.$inferInsert;
export type SelectMarketplaceTransaction = typeof marketplaceTransactions.$inferSelect;

export type InsertMarketplaceDispute = typeof marketplaceDisputes.$inferInsert;
export type SelectMarketplaceDispute = typeof marketplaceDisputes.$inferSelect;

export type InsertMarketplaceEscrow = typeof marketplaceEscrow.$inferInsert;
export type SelectMarketplaceEscrow = typeof marketplaceEscrow.$inferSelect;

// Add type definitions for credit balances
export const insertCreditBalanceSchema = createInsertSchema(creditBalances);
export const selectCreditBalanceSchema = createSelectSchema(creditBalances);
export type InsertCreditBalance = typeof creditBalances.$inferInsert;
export type SelectCreditBalance = typeof creditBalances.$inferSelect;

// Fix for the export statement and type definition
export type InsertMarketplaceOperationLog = typeof marketplaceOperationLog.$inferInsert;
export type SelectMarketplaceOperationLog = typeof marketplaceOperationLog.$inferSelect;

// Add task relations
export const tasksRelations = relations(tasks, ({ one }) => ({
  user: one(users, {
    fields: [tasks.userId],
    references: [users.id],
  }),
}));