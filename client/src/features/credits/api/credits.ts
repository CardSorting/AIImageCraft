/**
 * Credits API module
 * Centralizes all credit-related API calls
 */

import { 
  CreditBalance, 
  DailyChallengeResponse,
  CompleteChallengeResponse,
  DailyChallenge
} from "../types";

export async function fetchCredits(): Promise<CreditBalance> {
  const res = await fetch("/api/credits", {
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }

  return res.json();
}

// Daily Challenges API

export async function fetchDailyChallenges(): Promise<DailyChallengeResponse> {
  const res = await fetch("/api/challenges/daily", {
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }

  return res.json();
}

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

export async function checkChallengeProgress(challengeId: string): Promise<DailyChallenge> {
  const res = await fetch(`/api/challenges/${challengeId}/progress`, {
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }

  return res.json();
}