import { 
  DailyChallengeResponse, 
  CompleteChallengeResponse, 
  DailyChallenge 
} from '../types';

/**
 * Fetch all daily challenges for the current user
 */
export async function fetchDailyChallenges(): Promise<DailyChallengeResponse> {
  const res = await fetch("/api/challenges/daily", {
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }

  return res.json();
}

/**
 * Mark a challenge as complete and award credits
 */
export async function completeChallenge(challengeId: string): Promise<CompleteChallengeResponse> {
  const res = await fetch(`/api/challenges/${challengeId}/complete`, {
    method: "POST",
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }

  return res.json();
}

/**
 * Check the current progress of a specific challenge
 */
export async function checkChallengeProgress(challengeId: string): Promise<DailyChallenge> {
  const res = await fetch(`/api/challenges/${challengeId}/progress`, {
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }

  return res.json();
}
