import { useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface FavoriteButtonProps {
  itemId: number;
  itemType: 'card' | 'image';
  initialFavorited?: boolean;
}

export function FavoriteButton({ itemId, itemType, initialFavorited = false }: FavoriteButtonProps) {
  const [favorited, setFavorited] = useState(initialFavorited);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const toggleFavorite = async () => {
    try {
      const res = await fetch(`/api/favorites/${itemType}/${itemId}`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText);
      }

      const data = await res.json();
      setFavorited(data.favorited);

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/favorites"] });
      queryClient.invalidateQueries({ 
        queryKey: [itemType === 'card' ? "/api/trading-cards" : "/api/images"] 
      });

      toast({
        title: data.favorited ? "Added to favorites" : "Removed from favorites",
        description: data.favorited ? 
          `${itemType === 'card' ? 'Card' : 'Image'} has been added to your favorites` : 
          `${itemType === 'card' ? 'Card' : 'Image'} has been removed from your favorites`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: `Error favoriting ${itemType}`,
        description: error.message || "Failed to toggle favorite status",
      });
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={(e) => {
        e.stopPropagation();
        toggleFavorite();
      }}
      className={`absolute top-2 right-2 z-30 rounded-full p-2 backdrop-blur-sm
        ${favorited ? 
          'bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30' : 
          'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
        }`}
    >
      <Star className={`h-4 w-4 ${favorited ? 'fill-current' : ''}`} />
    </Button>
  );
}
