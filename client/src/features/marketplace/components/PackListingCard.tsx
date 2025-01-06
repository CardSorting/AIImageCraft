import { PackListing } from "../types";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { marketplaceService } from "../services/marketplaceService";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, AlertCircle } from "lucide-react";

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

  const renderCardPreview = (card: PackListing["pack"]["cards"][0], index: number) => {
    try {
      const imageUrl = card?.globalPoolCard?.card?.template?.image?.url;
      if (!imageUrl) {
        return (
          <div key={index} className="aspect-card bg-muted rounded-lg p-2 flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-muted-foreground" />
          </div>
        );
      }

      return (
        <div key={index} className="aspect-card bg-muted rounded-lg p-2">
          <img
            src={imageUrl}
            alt={`Card ${index + 1}`}
            className="w-full h-full object-cover rounded"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = 'fallback-image-url.jpg'; // Add a fallback image URL
              target.alt = 'Card image unavailable';
            }}
          />
        </div>
      );
    } catch (error) {
      console.error('Error rendering card preview:', error);
      return (
        <div key={index} className="aspect-card bg-muted rounded-lg p-2 flex items-center justify-center">
          <AlertCircle className="w-6 h-6 text-muted-foreground" />
        </div>
      );
    }
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
        <div className="grid grid-cols-4 gap-2">
          {listing.pack.cards.map((card, index) => renderCardPreview(card, index))}
        </div>
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