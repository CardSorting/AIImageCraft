import { PackListing } from "../types";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { marketplaceService } from "../services/marketplaceService";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Package, AlertCircle, X, Clock, CheckCircle, Ban } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface PackListingCardProps {
  listing: PackListing;
  onDelete?: () => void;
  showActions?: boolean;
}

export function PackListingCard({ listing, onDelete, showActions = true }: PackListingCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const purchaseMutation = useMutation({
    mutationFn: marketplaceService.purchaseListing,
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "You have successfully purchased the pack.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/marketplace/listings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/marketplace/listings/user"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: marketplaceService.cancelListing,
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Listing has been cancelled successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/marketplace/listings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/marketplace/listings/user"] });
      onDelete?.();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDelete = () => {
    deleteMutation.mutate(listing.id);
    setShowDeleteDialog(false);
  };

  const handlePurchase = () => {
    // Check if the user is trying to purchase their own listing
    if (listing.seller && listing.seller.id === currentUserId) {
      toast({
        title: "Error",
        description: "You cannot purchase your own listing",
        variant: "destructive",
      });
      return;
    }
    purchaseMutation.mutate({ listingId: listing.id });
  };

  // Get the current user's ID from your auth context or global state
  const currentUserId = window.__USER__?.id;

  return (
    <Card className={cn(
      "w-full transition-all duration-300",
      listing.status === 'SOLD' && "bg-green-500/5 border-green-500/20",
      listing.status === 'CANCELLED' && "bg-red-500/5 border-red-500/20",
      listing.status === 'ACTIVE' && "hover:border-purple-500/50"
    )}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">{listing.pack.name}</h3>
              {listing.status === 'ACTIVE' && (
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-500">
                  Active
                </span>
              )}
              {listing.status === 'SOLD' && (
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-500">
                  Sold
                </span>
              )}
              {listing.status === 'CANCELLED' && (
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-500">
                  Cancelled
                </span>
              )}
            </div>
            {listing.seller && (
              <p className="text-sm text-muted-foreground">
                Seller: {listing.seller.username}
              </p>
            )}
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
                <span className={cn(
                  "text-xs px-2 py-1 rounded-md",
                  listing.pack.previewCard.rarity === 'LEGENDARY' && "bg-yellow-500/40",
                  listing.pack.previewCard.rarity === 'EPIC' && "bg-purple-500/40",
                  listing.pack.previewCard.rarity === 'RARE' && "bg-blue-500/40",
                  listing.pack.previewCard.rarity === 'COMMON' && "bg-gray-500/40"
                )}>
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
        <div className="mt-2 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Pack contains {listing.pack.totalCards} cards
          </p>
          {listing.status === 'ACTIVE' && (
            <p className="text-sm flex items-center gap-1 text-green-500">
              <Clock className="w-4 h-4" />
              Listed
            </p>
          )}
          {listing.status === 'SOLD' && (
            <p className="text-sm flex items-center gap-1 text-green-500">
              <CheckCircle className="w-4 h-4" />
              Sold
            </p>
          )}
          {listing.status === 'CANCELLED' && (
            <p className="text-sm flex items-center gap-1 text-red-500">
              <Ban className="w-4 h-4" />
              Cancelled
            </p>
          )}
        </div>
      </CardContent>
      {showActions && listing.status === 'ACTIVE' && (
        <CardFooter className="flex justify-end gap-2">
          {listing.seller && listing.seller.id === currentUserId ? (
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={deleteMutation.isPending}>
                  {deleteMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Cancelling...
                    </>
                  ) : (
                    <>
                      <X className="mr-2 h-4 w-4" />
                      Cancel Listing
                    </>
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Cancel Listing</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to cancel this listing? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>
                    Confirm
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : (
            <Button
              onClick={handlePurchase}
              disabled={purchaseMutation.isPending || (listing.seller && listing.seller.id === currentUserId)}
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
          )}
        </CardFooter>
      )}
    </Card>
  );
}