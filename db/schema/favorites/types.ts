import type { userFavorites } from "./schema";

// Export core types
export type UserFavorite = typeof userFavorites.$inferSelect;
export type InsertUserFavorite = typeof userFavorites.$inferInsert;

// Export favorite-specific types
export type FavoriteItemType = 'card' | 'image' | 'collection';
