import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { sql } from "drizzle-orm";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").unique().notNull(),
  password: text("password").notNull(),
});

export const images = pgTable("images", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  url: text("url").notNull(),
  prompt: text("prompt").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const tradingCards = pgTable("trading_cards", {
  id: serial("id").primaryKey(),
  imageId: integer("image_id").notNull().references(() => images.id),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  description: text("description").notNull(), // Story/flavor text
  elementalType: text("elemental_type").notNull(),
  rarity: text("rarity").notNull(),
  powerStats: jsonb("power_stats").notNull(), // Store attack, defense, etc.
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

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  images: many(images),
  tradingCards: many(tradingCards),
}));

export const imagesRelations = relations(images, ({ one, many }) => ({
  user: one(users, {
    fields: [images.userId],
    references: [users.id],
  }),
  tags: many(imageTags),
  tradingCard: many(tradingCards),
}));

export const tradingCardsRelations = relations(tradingCards, ({ one }) => ({
  image: one(images, {
    fields: [tradingCards.imageId],
    references: [images.id],
  }),
  creator: one(users, {
    fields: [tradingCards.userId],
    references: [users.id],
  }),
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

// Schemas
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

// Types
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