import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Sparkles, Star } from "lucide-react";
import { CreateTradingCard } from "@/features/trading-cards/components/CreateTradingCard";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface ImageCardProps {
  imageId: number;
  imageUrl: string;
  tags?: string[];
  onTradingCardCreated?: () => void;
}

function FavoriteButton({ imageId }: { imageId: number }) {
  const [favorited, setFavorited] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const toggleFavorite = async () => {
    try {
      const res = await fetch(`/api/favorites/image/${imageId}`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText);
      }

      const data = await res.json();
      setFavorited(data.favorited);

      // Invalidate both favorites and images queries
      queryClient.invalidateQueries({ queryKey: ["/api/favorites"] });
      queryClient.invalidateQueries({ queryKey: ["/api/images"] });

      toast({
        title: data.favorited ? "Added to favorites" : "Removed from favorites",
        description: data.favorited ? 
          "Image has been added to your favorites" : 
          "Image has been removed from your favorites",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error favoriting image",
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

export default function ImageCard({ 
  imageId, 
  imageUrl, 
  tags = [], 
  onTradingCardCreated 
}: ImageCardProps) {
  const [isCreateCardOpen, setIsCreateCardOpen] = useState(false);

  const handleDownload = async () => {
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ai-generated-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <>
      <Card className="group relative w-full h-full overflow-hidden backdrop-blur-sm bg-black/30 border-purple-500/20">
        <div className="absolute inset-0">
          <img
            src={imageUrl}
            alt="AI generated"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="absolute bottom-4 left-4 right-4">
            <div className="flex flex-wrap gap-2 mb-4">
              {tags.map((tag, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="bg-purple-500/20 text-purple-200 hover:bg-purple-500/30"
                >
                  {tag}
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="icon"
                onClick={handleDownload}
                className="bg-white/10 hover:bg-white/20 backdrop-blur-sm"
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                variant="secondary"
                onClick={() => setIsCreateCardOpen(true)}
                className="flex-1 bg-purple-500/20 hover:bg-purple-500/30 backdrop-blur-sm"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Create Card
              </Button>
            </div>
          </div>
        </div>
        <FavoriteButton imageId={imageId} />
      </Card>

      <CreateTradingCard
        imageId={imageId}
        imageUrl={imageUrl}
        open={isCreateCardOpen}
        onOpenChange={setIsCreateCardOpen}
        onSuccess={onTradingCardCreated}
      />
    </>
  );
}