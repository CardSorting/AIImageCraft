import type { TradingCard } from "@/features/trading-cards/types";

export interface PackListing {
  id: number;
  packId: number;
  sellerId: number;
  price: number;
  status: 'DRAFT' | 'ACTIVE' | 'SOLD' | 'CANCELLED' | 'LOCKED';
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
  metadata: Record<string, any>;
  processingStatus?: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  transactionKey?: string;
  escrowStatus?: 'NONE' | 'PENDING' | 'HELD' | 'RELEASED';
}

export interface MarketplaceAnalytics {
  overview: {
    totalListings: number;
    activeSellers: number;
    totalVolume: number;
    averagePrice: number;
    topCategories: {
      name: string;
      count: number;
      percentage: number;
    }[];
  };
  trends: {
    date: string;
    listings: number;
    volume: number;
    averagePrice: number;
  }[];
  performance: {
    conversionRate: number;
    averageTimeToSell: number;
    popularCategories: string[];
    priceRange: {
      min: number;
      max: number;
      optimal: number;
    };
  };
}

export interface ListingCategory {
  id: number;
  name: string;
  slug: string;
  description?: string;
  parentId?: number;
  parent?: ListingCategory;
  children?: ListingCategory[];
  listingCount: number;
}

export interface CreatePackListing {
  packId: number;
  price: number;
  categoryId?: number;
  metadata?: Record<string, any>;
}

export interface PurchasePackListing {
  listingId: number;
  escrowOptions?: {
    releaseConditions: string[];
    expiresIn?: number; // in hours
  };
}

export interface MarketplaceFilters {
  minPrice?: number;
  maxPrice?: number;
  rarity?: string;
  element?: string;
  sellerId?: number;
  sortBy?: 'price_asc' | 'price_desc' | 'date_asc' | 'date_desc' | 'trending' | 'popularity';
  seller?: string;
  category?: string;
  status?: 'ACTIVE' | 'DRAFT' | 'SOLD' | 'CANCELLED' | 'LOCKED';
  processingStatus?: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
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

export interface MarketplaceDispute {
  id: number;
  transactionId: number;
  reporterId: number;
  type: 'ITEM_NOT_RECEIVED' | 'ITEM_NOT_AS_DESCRIBED' | 'OTHER';
  status: 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'CLOSED';
  reason: string;
  resolution?: string;
  evidence?: {
    type: string;
    url: string;
    description: string;
  }[];
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

export interface EscrowDetails {
  id: number;
  transactionId: number;
  amount: number;
  releaseConditions: string[];
  status: 'PENDING' | 'HELD' | 'RELEASED' | 'REFUNDED';
  createdAt: string;
  releasedAt?: string;
  expiresAt?: string;
}