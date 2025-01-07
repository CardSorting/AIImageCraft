import type { images } from "./schema";

// Export core types
export type Image = typeof images.$inferSelect;
export type InsertImage = typeof images.$inferInsert;

// Export image-specific types
export type ImageVariation = {
  url: string;
  index: number;
};
