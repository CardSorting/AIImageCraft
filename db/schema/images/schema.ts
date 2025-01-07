import { pgTable, text, integer, index } from "drizzle-orm/pg-core";
import { defaultFields, createSchemas } from "../../utils/schema-utils";
import { users } from "../users/schema";

// Images table for storing generated images
export const images = pgTable("images", {
  ...defaultFields,
  userId: integer("user_id").notNull().references(() => users.id),
  url: text("url").notNull(),
  prompt: text("prompt").notNull(),
  variationIndex: integer("variation_index").default(0),
}, (table) => ({
  userIdIdx: index("images_user_id_idx").on(table.userId),
}));

// Create schemas
const schemas = {
  images: createSchemas(images),
};

// Export schemas
export const {
  images: { insert: insertImageSchema, select: selectImageSchema },
} = schemas;
