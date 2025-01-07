import { pgTable, text, integer, jsonb, timestamp, index } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { defaultFields, createSchemas } from "../../utils/schema-utils";
import { users } from "../users/schema";

// Core card template table
export const cardTemplates = pgTable("card_templates", {
  ...defaultFields,
  name: text("name").notNull(),
  description: text("description").notNull(),
  elementalType: text("elemental_type").notNull(),
  rarity: text("rarity").notNull(),
  powerStats: jsonb("power_stats").notNull(),
  imageId: integer("image_id").notNull(),
  creatorId: text("creator_id").notNull().references(() => users.id), // Changed to text for Firebase UID
}, (table) => ({
  creatorIdIdx: index("card_templates_creator_id_idx").on(table.creatorId),
}));

// Individual card instances
export const tradingCards = pgTable("trading_cards", {
  ...defaultFields,
  templateId: integer("template_id").notNull().references(() => cardTemplates.id),
  userId: text("user_id").references(() => users.id), // Changed to text for Firebase UID
}, (table) => ({
  userIdIdx: index("trading_cards_user_id_idx").on(table.userId),
  templateIdIdx: index("trading_cards_template_id_idx").on(table.templateId),
}));

// Create schemas
const schemas = {
  cardTemplates: createSchemas(cardTemplates),
  tradingCards: createSchemas(tradingCards),
};

// Export schemas
export const {
  cardTemplates: { insert: insertCardTemplateSchema, select: selectCardTemplateSchema },
  tradingCards: { insert: insertTradingCardSchema, select: selectTradingCardSchema },
} = schemas;

// Export types
export type CardTemplate = typeof cardTemplates.$inferSelect;
export type InsertCardTemplate = typeof cardTemplates.$inferInsert;

export type TradingCard = typeof tradingCards.$inferSelect;
export type InsertTradingCard = typeof tradingCards.$inferInsert;