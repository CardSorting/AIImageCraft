/**
 * Credits API module
 * Centralizes all credit-related API calls
 */

import { 
  CreditBalance, 
  ReferralCode, 
  ReferralStats, 
  UseReferralResponse,
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

export async function generateReferralCode(): Promise<ReferralCode> {
  const res = await fetch("/api/referral/generate", {
    method: "POST",
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }

  return res.json();
}

export async function getReferralCode(): Promise<ReferralCode> {
  const res = await fetch("/api/referral/code", {
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }

  return res.json();
}

export async function getReferralStats(): Promise<ReferralStats> {
  const res = await fetch("/api/referral/stats", {
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }

  return res.json();
}

export async function useReferralCode(code: string): Promise<UseReferralResponse> {
  const res = await fetch("/api/referral/use", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ code }),
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