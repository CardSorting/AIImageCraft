import { useQuery } from "@tanstack/react-query";
import { marketplaceService } from "../services/marketplaceService";
import { PackListingCard } from "../components/PackListingCard";
import { MarketplaceFilters } from "../components/MarketplaceFilters";
import { useState } from "react";
import type { MarketplaceFilters as FiltersType } from "../types";
import { Loader2, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export function MarketplacePage() {
  const [filters, setFilters] = useState<FiltersType>({});

  const { data: listings, isLoading } = useQuery({
    queryKey: ["/api/marketplace/listings", filters],
    queryFn: () => marketplaceService.getPackListings(filters),
  });

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Card Pack Marketplace</h1>
        <Link href="/marketplace/listings">
          <Button variant="outline" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            My Listings
          </Button>
        </Link>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        <aside className="w-full md:w-80">
          <MarketplaceFilters filters={filters} onFilterChange={setFilters} />
        </aside>

        <main className="flex-1">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : !listings?.length ? (
            <div className="text-center p-8 bg-muted rounded-lg">
              <p className="text-lg text-muted-foreground">No listings found</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {listings.map((listing) => (
                <PackListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}