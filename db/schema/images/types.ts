import { type } from "drizzle-orm";
import { images } from "./schema";
import { z } from "zod";

// Export core types
export type Image = typeof images.$inferSelect;
export type InsertImage = typeof images.$inferInsert;

// Task-specific types
export interface TaskOutput {
  image_urls?: string[];
  progress?: number;
  temporary_image_urls?: string[] | null;
  error?: string;
}

export interface TaskMetadata {
  error?: string;
  created_at?: string;
  started_at?: string;
  ended_at?: string;
}

// Export image-specific types
export type ImageVariation = {
  url: string;
  variationIndex: number;
};

// Export validation schemas
export const imageSchema = z.object({
  id: z.number(),
  userId: z.number(),
  url: z.string().url(),
  prompt: z.string(),
  variationIndex: z.number().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const insertImageSchema = imageSchema.omit({ 
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type ValidatedImage = z.infer<typeof imageSchema>;
export type ValidatedInsertImage = z.infer<typeof insertImageSchema>;