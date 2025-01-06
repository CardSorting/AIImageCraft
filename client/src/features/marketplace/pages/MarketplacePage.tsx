import { useQuery } from "@tanstack/react-query";
import { marketplaceService } from "../services/marketplaceService";
import { PackListingCard } from "../components/PackListingCard";
import { MarketplaceFilters } from "../components/MarketplaceFilters";
import { useState } from "react";
import type { MarketplaceFilters as FiltersType } from "../types";
import { Loader2, Package, Store, CircleDollarSign, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Card } from "@/components/ui/card";

export function MarketplacePage() {
  const [filters, setFilters] = useState<FiltersType>({
    sortBy: 'trending' // Set default sort to trending
  });

  const { data: listings, isLoading } = useQuery({
    queryKey: ["/api/marketplace/listings", filters],
    queryFn: () => marketplaceService.getPackListings(filters),
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header Section */}
      <div className="bg-card border-b">
        <div className="container mx-auto py-8">
          <div className="flex flex-col md:flex-row gap-8 items-start md:items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold">Marketplace</h1>
              <p className="text-muted-foreground mt-2">
                Browse and trade unique card packs from collectors worldwide
              </p>
            </div>
            <div className="flex gap-3">
              <Link href="/marketplace/listings">
                <Button variant="outline" className="flex items-center gap-2">
                  <Store className="w-4 h-4" />
                  My Store
                </Button>
              </Link>
              <Link href="/marketplace/credits">
                <Button className="flex items-center gap-2">
                  <Coins className="w-4 h-4" />
                  Buy Credits
                </Button>
              </Link>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Package className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Available Listings</p>
                <p className="text-2xl font-bold">{listings?.length || 0}</p>
              </div>
            </Card>
            <Card className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <CircleDollarSign className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg. Pack Price</p>
                <p className="text-2xl font-bold">
                  {listings?.length
                    ? Math.round(
                        listings.reduce((acc, l) => acc + l.price, 0) / listings.length
                      )
                    : 0}
                </p>
              </div>
            </Card>
            <Card className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Store className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Sellers</p>
                <p className="text-2xl font-bold">
                  {new Set(listings?.map(l => l.seller.id) || []).size}
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar Filters */}
          <aside className="w-full md:w-80 md:sticky md:top-8 self-start">
            <MarketplaceFilters filters={filters} onFilterChange={setFilters} />
          </aside>

          {/* Main Content Area */}
          <main className="flex-1">
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            ) : !listings?.length ? (
              <div className="text-center p-8 bg-muted rounded-lg">
                <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg text-muted-foreground">No listings found</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Try adjusting your filters or search criteria
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {listings.map((listing) => (
                  <PackListingCard 
                    key={listing.id} 
                    listing={listing}
                    layout="grid"
                  />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}