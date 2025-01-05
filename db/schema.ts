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
  userId: integer("user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
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

export const usersRelations = relations(users, ({ many }) => ({
  images: many(images),
  tradingCards: many(tradingCards),
  cardTemplates: many(cardTemplates, { relationName: "creator" }),
  initiatedTrades: many(trades, { relationName: "initiator" }),
  receivedTrades: many(trades, { relationName: "receiver" }),
  gamesAsPlayer1: many(games, { relationName: "player1" }),
  gamesAsPlayer2: many(games, { relationName: "player2" }),
  wonGames: many(games, { relationName: "winner" }),
  favorites: many(userFavorites),
  referralsGiven: many(referrals, { relationName: "referrer" }),
  referralsReceived: many(referrals, { relationName: "referee" }),
  challengeProgress: many(challengeProgress),
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