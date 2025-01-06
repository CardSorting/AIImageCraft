import { useQuery } from "@tanstack/react-query";
import { marketplaceService } from "../services/marketplaceService";
import { PackListingCard } from "../components/PackListingCard";
import { Loader2, Package } from "lucide-react";

export function UserListingsPage() {
  const { data: listings, isLoading } = useQuery({
    queryKey: ["/api/marketplace/listings/user"],
    queryFn: () => marketplaceService.getUserListings(),
  });

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">My Listings</h1>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : !listings?.length ? (
        <div className="text-center p-8 bg-muted rounded-lg">
          <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg text-muted-foreground">You haven't listed any packs yet</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {listings.map((listing) => (
            <PackListingCard 
              key={listing.id} 
              listing={listing} 
              showActions={true}
              onDelete={() => {
                // This will be handled by the invalidateQueries in the mutation
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
