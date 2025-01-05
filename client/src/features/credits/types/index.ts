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