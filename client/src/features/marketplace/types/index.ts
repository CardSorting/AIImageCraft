import type { CardPack } from "@/features/trading-cards/types";

export interface PackListing {
  id: number;
  packId: number;
  sellerId: number;
  price: number;
  status: 'ACTIVE' | 'SOLD' | 'CANCELLED';
  pack: CardPack;
  createdAt: string;
  seller: {
    id: number;
    username: string;
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
  sortBy?: 'price_asc' | 'price_desc' | 'date_asc' | 'date_desc';
}
