import { relations } from "drizzle-orm";
import { cardTemplates, tradingCards } from "./schema";
import { users } from "../users/schema";
import { images } from "../assets/schema";

export const cardTemplatesRelations = relations(cardTemplates, ({ one, many }) => ({
  creator: one(users, {
    fields: [cardTemplates.creatorId],
    references: [users.id],
  }),
  image: one(images, {
    fields: [cardTemplates.imageId],
    references: [images.id],
  }),
  tradingCards: many(tradingCards),
}));

export const tradingCardsRelations = relations(tradingCards, ({ one }) => ({
  template: one(cardTemplates, {
    fields: [tradingCards.templateId],
    references: [cardTemplates.id],
  }),
  owner: one(users, {
    fields: [tradingCards.userId],
    references: [users.id],
  }),
}));
