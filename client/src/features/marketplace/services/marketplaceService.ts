import { 
  PackListing, 
  CreatePackListing, 
  PurchasePackListing, 
  MarketplaceFilters, 
  SellerPerformance, 
  MarketplaceAnalytics, 
  ListingCategory,
  MarketplaceDispute,
  EscrowDetails
} from "../types";

// Helper function to build query string from filters
const buildQueryString = (filters: MarketplaceFilters): string => {
  const params = new URLSearchParams();

  if (filters.minPrice) params.append('minPrice', filters.minPrice.toString());
  if (filters.maxPrice) params.append('maxPrice', filters.maxPrice.toString());
  if (filters.rarity) params.append('rarity', filters.rarity);
  if (filters.element) params.append('element', filters.element);
  if (filters.sortBy) params.append('sortBy', filters.sortBy);
  if (filters.category) params.append('category', filters.category);
  if (filters.status) params.append('status', filters.status);
  if (filters.processingStatus) params.append('processingStatus', filters.processingStatus);

  return params.toString();
};

export const marketplaceService = {
  // Get all active pack listings with optional filters
  getPackListings: async (filters?: MarketplaceFilters): Promise<PackListing[]> => {
    const queryString = filters ? `?${buildQueryString(filters)}` : '';
    const response = await fetch(`/api/marketplace/listings${queryString}`, {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }

    return response.json();
  },

  // Create a new pack listing
  createListing: async (listing: CreatePackListing): Promise<PackListing> => {
    const response = await fetch('/api/marketplace/listings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(listing),
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }

    return response.json();
  },

  // Purchase a pack listing
  purchaseListing: async ({ listingId, escrowOptions }: PurchasePackListing): Promise<void> => {
    const response = await fetch(`/api/marketplace/listings/${listingId}/purchase`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ escrowOptions }),
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }
  },

  // Cancel a pack listing (seller only)
  cancelListing: async (listingId: number): Promise<void> => {
    const response = await fetch(`/api/marketplace/listings/${listingId}/cancel`, {
      method: 'POST',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }
  },

  // Get user's active listings
  getUserListings: async (status?: PackListing['status']): Promise<PackListing[]> => {
    const queryString = status ? `?status=${status}` : '';
    const response = await fetch(`/api/marketplace/listings/user${queryString}`, {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }

    return response.json();
  },

  // Get seller's performance metrics and achievements
  getSellerPerformance: async (): Promise<SellerPerformance> => {
    const response = await fetch('/api/marketplace/seller/performance', {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }

    return response.json();
  },

  // Get listing analytics
  getListingAnalytics: async (listingId?: number): Promise<MarketplaceAnalytics> => {
    const url = listingId 
      ? `/api/marketplace/listings/${listingId}/analytics`
      : '/api/marketplace/listings/analytics';

    const response = await fetch(url, {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }

    return response.json();
  },

  // Bulk operations
  bulkCancelListings: async (listingIds: number[]): Promise<void> => {
    const response = await fetch('/api/marketplace/listings/bulk/cancel', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ listingIds }),
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }
  },

  bulkUpdatePrices: async (updates: { listingId: number; price: number }[]): Promise<void> => {
    const response = await fetch('/api/marketplace/listings/bulk/price', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ updates }),
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }
  },

  // Category management
  getCategories: async (): Promise<ListingCategory[]> => {
    const response = await fetch('/api/marketplace/categories', {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }

    return response.json();
  },

  assignCategory: async (listingId: number, categoryId: number): Promise<void> => {
    const response = await fetch(`/api/marketplace/listings/${listingId}/category`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ categoryId }),
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }
  },

  // Dispute management
  createDispute: async (
    transactionId: number, 
    type: MarketplaceDispute['type'],
    reason: string
  ): Promise<MarketplaceDispute> => {
    const response = await fetch('/api/marketplace/disputes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ transactionId, type, reason }),
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }

    return response.json();
  },

  // Escrow management
  getEscrowDetails: async (transactionId: number): Promise<EscrowDetails> => {
    const response = await fetch(`/api/marketplace/transactions/${transactionId}/escrow`, {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }

    return response.json();
  },

  releaseEscrow: async (transactionId: number): Promise<void> => {
    const response = await fetch(`/api/marketplace/transactions/${transactionId}/escrow/release`, {
      method: 'POST',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }
  },

  // Analytics and performance tracking
  getMarketplaceAnalytics: async (timeframe: 'day' | 'week' | 'month' = 'week'): Promise<MarketplaceAnalytics> => {
    const response = await fetch(`/api/marketplace/analytics?timeframe=${timeframe}`, {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }

    return response.json();
  },
};