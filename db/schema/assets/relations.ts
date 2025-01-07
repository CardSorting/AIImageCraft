import { relations } from "drizzle-orm";
import { images, tags, imageTags } from "./schema";
import { users } from "../users/schema";
import { cardTemplates } from "../cards/schema";

export const imagesRelations = relations(images, ({ one, many }) => ({
  user: one(users, {
    fields: [images.userId],
    references: [users.id],
  }),
  tags: many(imageTags),
  cardTemplates: many(cardTemplates),
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
