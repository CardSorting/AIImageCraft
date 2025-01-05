export interface CreditBalance {
  credits: number;
}

export interface CreditOperation {
  type: 'EARN' | 'SPEND';
  amount: number;
  reason: string;
  timestamp: Date;
}

export interface ReferralCode {
  code: string | null;
}

export interface ReferralStats {
  referralCount: number;
  creditsEarned: number;
  tier: number;
  nextTierProgress: number;
}

export interface UseReferralResponse {
  success: boolean;
  message: string;
  creditsAwarded?: number;
  error?: string;
}

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