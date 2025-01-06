import { PackListing } from "../types";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { marketplaceService } from "../services/marketplaceService";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, AlertCircle, Package } from "lucide-react";

interface PackListingCardProps {
  listing: PackListing;
  onPurchase?: () => void;
  showActions?: boolean;
}

export function PackListingCard({ listing, onPurchase, showActions = true }: PackListingCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const purchaseMutation = useMutation({
    mutationFn: marketplaceService.purchaseListing,
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "You have successfully purchased the pack.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/marketplace/listings"] });
      onPurchase?.();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handlePurchase = () => {
    purchaseMutation.mutate({ listingId: listing.id });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold">{listing.pack.name}</h3>
            <p className="text-sm text-muted-foreground">
              Seller: {listing.seller.username}
            </p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold">{listing.price} Credits</p>
            <p className="text-sm text-muted-foreground">
              Listed: {new Date(listing.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {listing.pack.description && (
          <p className="text-sm mb-4">{listing.pack.description}</p>
        )}
        <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
          {listing.pack.previewCard ? (
            <>
              <img
                src={listing.pack.previewCard.image.url}
                alt={`Preview of ${listing.pack.name}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-white">
                <span className="text-sm font-medium bg-black/40 px-2 py-1 rounded-md">
                  {listing.pack.previewCard.name}
                </span>
                <span className={`text-xs px-2 py-1 rounded-md ${
                  listing.pack.previewCard.rarity === 'Legendary' ? 'bg-yellow-500/40' :
                  listing.pack.previewCard.rarity === 'Epic' ? 'bg-purple-500/40' :
                  listing.pack.previewCard.rarity === 'Rare' ? 'bg-blue-500/40' :
                  'bg-gray-500/40'
                }`}>
                  {listing.pack.previewCard.rarity}
                </span>
              </div>
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="w-12 h-12 text-muted-foreground" />
            </div>
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          Pack contains {listing.pack.totalCards} cards
        </p>
      </CardContent>
      {showActions && (
        <CardFooter className="flex justify-end gap-2">
          <Button
            onClick={handlePurchase}
            disabled={purchaseMutation.isPending}
          >
            {purchaseMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Purchasing...
              </>
            ) : (
              "Purchase Pack"
            )}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}