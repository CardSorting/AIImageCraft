import { PackListing, CreatePackListing, PurchasePackListing, MarketplaceFilters, SellerPerformance } from "../types";

// Helper function to build query string from filters
const buildQueryString = (filters: MarketplaceFilters): string => {
  const params = new URLSearchParams();

  if (filters.minPrice) params.append('minPrice', filters.minPrice.toString());
  if (filters.maxPrice) params.append('maxPrice', filters.maxPrice.toString());
  if (filters.rarity) params.append('rarity', filters.rarity);
  if (filters.element) params.append('element', filters.element);
  if (filters.sortBy) params.append('sortBy', filters.sortBy);

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
  purchaseListing: async ({ listingId }: PurchasePackListing): Promise<void> => {
    const response = await fetch(`/api/marketplace/listings/${listingId}/purchase`, {
      method: 'POST',
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
  getUserListings: async (): Promise<PackListing[]> => {
    const response = await fetch('/api/marketplace/listings/user', {
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
};