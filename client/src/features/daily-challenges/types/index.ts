import { z } from 'zod';

export type ChallengeType = 'CREATE_CARD' | 'SHARE_CONTENT' | 'WIN_GAME' | 'USE_AI';

export interface DailyChallenge {
  id: string;
  type: ChallengeType;
  title: string;
  description: string;
  creditReward: number;
  requiredCount: number;
  currentProgress: number;
  completed: boolean;
  expiresAt: string;
}

export interface DailyChallengeProgress {
  challengeId: string;
  progress: number;
  completed: boolean;
  completedAt?: string;
}

export interface DailyChallengeResponse {
  challenges: DailyChallenge[];
  totalEarnedToday: number;
  maxDailyEarnings: number;
}

export interface CompleteChallengeResponse {
  success: boolean;
  message: string;
  creditsAwarded: number;
  challenge: DailyChallenge;
}

// Zod schema for challenge validation
export const dailyChallengeSchema = z.object({
  id: z.string(),
  type: z.enum(['CREATE_CARD', 'SHARE_CONTENT', 'WIN_GAME', 'USE_AI']),
  title: z.string(),
  description: z.string(),
  creditReward: z.number(),
  requiredCount: z.number(),
  currentProgress: z.number(),
  completed: z.boolean(),
  expiresAt: z.string(),
});
