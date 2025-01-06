import type { TradingCard } from "@/features/trading-cards/types";

export interface PackListing {
  id: number;
  packId: number;
  sellerId: number;
  price: number;
  status: 'ACTIVE' | 'SOLD' | 'CANCELLED';
  createdAt: string;
  seller: {
    id: number;
    username: string;
  };
  pack: {
    id: number;
    name: string;
    description?: string;
    previewCard: {
      name: string;
      image: {
        url: string;
      };
      rarity: string;
      elementalType: string;
    } | null;
    totalCards: number;
  };
}

export interface CreatePackListing {
  packId: number;
  price: number;
}

export interface PurchasePackListing {
  listingId: number;
}

export interface MarketplaceFilters {
  minPrice?: number;
  maxPrice?: number;
  rarity?: string;
  element?: string;
  sellerId?: number;
  sortBy?: 'price_asc' | 'price_desc' | 'date_asc' | 'date_desc' | 'trending' | 'popularity';
  seller?: string;
}

export interface SellerPerformance {
  level: number;
  experience: number;
  experienceToNextLevel: number;
  achievements: Achievement[];
  stats: {
    totalSales: number;
    totalRevenue: number;
    averageRating: number;
    responseRate: number;
    listingQuality: number;
  };
  weeklyGoals: {
    sales: {
      target: number;
      current: number;
    };
    revenue: {
      target: number;
      current: number;
    };
    listings: {
      target: number;
      current: number;
    };
  };
  activityStreak: {
    current: number;
    longest: number;
    lastActive: string;
  };
  ranking: {
    position: number;
    totalSellers: number;
    tier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'DIAMOND';
  };
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  progress: number;
  maxProgress: number;
  unlockedAt?: string;
  category: 'SALES' | 'ENGAGEMENT' | 'QUALITY' | 'SPECIAL';
  rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
}