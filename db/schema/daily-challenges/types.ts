import type { dailyChallenges, challengeProgress } from "./schema";

// Export types for daily challenges
export type DailyChallenge = typeof dailyChallenges.$inferSelect;
export type InsertDailyChallenge = typeof dailyChallenges.$inferInsert;

// Export types for challenge progress
export type ChallengeProgress = typeof challengeProgress.$inferSelect;
export type InsertChallengeProgress = typeof challengeProgress.$inferInsert;

// Export challenge-specific enums and types
export type ChallengeType = 'CREATE_CARD' | 'SHARE_CONTENT' | 'WIN_GAME' | 'USE_AI';
export type ChallengeStatus = 'pending' | 'completed' | 'expired';
