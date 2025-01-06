import { useQuery } from "@tanstack/react-query";
import { marketplaceService } from "../services/marketplaceService";
import { PackListingCard } from "../components/PackListingCard";
import { Loader2, Package, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export function UserListingsPage() {
  const { data: listings, isLoading } = useQuery({
    queryKey: ["/api/marketplace/listings/user"],
    queryFn: () => marketplaceService.getUserListings(),
  });

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/marketplace">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">My Listings</h1>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : !listings?.length ? (
        <div className="text-center p-8 bg-muted rounded-lg">
          <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg text-muted-foreground">You haven't listed any packs yet</p>
          <Link href="/marketplace">
            <Button className="mt-4" variant="outline">
              Browse Marketplace
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-6">
          {listings.map((listing) => (
            <PackListingCard 
              key={listing.id} 
              listing={listing} 
              showActions={true}
            />
          ))}
        </div>
      )}
    </div>
  );
}