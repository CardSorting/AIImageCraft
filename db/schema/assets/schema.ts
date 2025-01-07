import { pgTable, text, integer, index } from "drizzle-orm/pg-core";
import { defaultFields, createSchemas } from "../../utils/schema-utils";
import { users } from "../users/schema";

// Images table for storing image metadata
export const images = pgTable("images", {
  ...defaultFields,
  userId: integer("user_id").notNull().references(() => users.id),
  url: text("url").notNull(),
  prompt: text("prompt").notNull(),
  variationIndex: integer("variation_index"),
}, (table) => ({
  userIdIdx: index("images_user_id_idx").on(table.userId),
}));

// Tags for categorizing images
export const tags = pgTable("tags", {
  ...defaultFields,
  name: text("name").unique().notNull(),
});

// Junction table for image tags
export const imageTags = pgTable("image_tags", {
  ...defaultFields,
  imageId: integer("image_id").notNull().references(() => images.id),
  tagId: integer("tag_id").notNull().references(() => tags.id),
}, (table) => ({
  imageTagIdx: index("image_tags_image_tag_idx").on(table.imageId, table.tagId),
}));

// Create schemas
const schemas = {
  images: createSchemas(images),
  tags: createSchemas(tags),
  imageTags: createSchemas(imageTags),
};

// Export schemas
export const {
  images: { insert: insertImageSchema, select: selectImageSchema },
  tags: { insert: insertTagSchema, select: selectTagSchema },
  imageTags: { insert: insertImageTagSchema, select: selectImageTagSchema },
} = schemas;

// Export types
export type Image = typeof images.$inferSelect;
export type InsertImage = typeof images.$inferInsert;

export type Tag = typeof tags.$inferSelect;
export type InsertTag = typeof tags.$inferInsert;

export type ImageTag = typeof imageTags.$inferSelect;
export type InsertImageTag = typeof imageTags.$inferInsert;
