/**
 * Credits API module
 * Centralizes all credit-related API calls
 */

import { CreditBalance, ReferralCode, UseReferralResponse } from "../types";

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
