import { z } from "zod";

// Credit package configuration
export const CreditPackage = z.object({
  id: z.string(),
  credits: z.number(),
  price: z.number()
});

export type CreditPackage = z.infer<typeof CreditPackage>;

// Purchase intent response
export const PurchaseIntentResponse = z.object({
  clientSecret: z.string(),
  amount: z.number()
});

export type PurchaseIntentResponse = z.infer<typeof PurchaseIntentResponse>;

// Credit transaction types
export const TransactionType = z.enum([
  'PURCHASE',
  'USAGE',
  'REFUND',
  'BONUS',
  'REFERRAL'
]);

export type TransactionType = z.infer<typeof TransactionType>;

export interface ICreditService {
  getCredits(userId: number): Promise<number>;
  addCredits(userId: number, amount: number): Promise<number>;
  useCredits(userId: number, amount: number): Promise<boolean>;
  hasEnoughCredits(userId: number, amount: number): Promise<boolean>;
  createPurchaseIntent(userId: number, packageId: string): Promise<PurchaseIntentResponse>;
  completePurchase(paymentIntentId: string): Promise<void>;
  getPurchaseHistory(userId: number): Promise<any[]>;
  getTransactionHistory(userId: number): Promise<any[]>;
}

// Credit service errors
export class InsufficientCreditsError extends Error {
  constructor(message = "Insufficient credits") {
    super(message);
    this.name = "InsufficientCreditsError";
  }
}

export class InvalidPackageError extends Error {
  constructor(message = "Invalid credit package") {
    super(message);
    this.name = "InvalidPackageError";
  }
}

export class PaymentError extends Error {
  constructor(message = "Payment processing failed") {
    super(message);
    this.name = "PaymentError";
  }
}
