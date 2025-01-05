import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Share2, Check, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface ShareButtonProps {
  itemType: 'image' | 'card';
  itemId: number;
  className?: string;
}

export function ShareButton({ itemType, itemId, className }: ShareButtonProps) {
  const [isSharing, setIsSharing] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleShare = async () => {
    setIsSharing(true);
    try {
      // First attempt to use the Web Share API
      if (navigator.share) {
        const shareData = {
          title: `Check out this ${itemType} on AI Card Battle!`,
          text: `I just created this amazing ${itemType} using AI Card Battle!`,
          url: `${window.location.origin}/${itemType}s/${itemId}`,
        };

        await navigator.share(shareData);
        
        // After successful share, notify the backend
        const res = await fetch('/api/share', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ itemType, itemId }),
        });

        if (!res.ok) {
          throw new Error(await res.text());
        }

        const result = await res.json();
        
        toast({
          title: result.credited ? "Share Successful!" : "Share Recorded",
          description: result.message,
          className: result.credited 
            ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white"
            : undefined,
        });

        // Invalidate credits query to update the UI
        queryClient.invalidateQueries({ queryKey: ['/api/credits'] });
      } else {
        // Fallback for browsers that don't support Web Share API
        toast({
          variant: "destructive",
          title: "Sharing not supported",
          description: "Your browser doesn't support direct sharing. Try copying the link manually.",
        });
      }
    } catch (error: any) {
      console.error('Error sharing:', error);
      toast({
        variant: "destructive",
        title: "Share Failed",
        description: error.message || "Failed to share. Please try again.",
      });
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleShare}
      disabled={isSharing}
      className={`gap-2 ${className || ''}`}
    >
      {isSharing ? (
        <>
          <span className="animate-spin">
            <Share2 className="h-4 w-4" />
          </span>
          Sharing...
        </>
      ) : (
        <>
          <Share2 className="h-4 w-4" />
          Share & Earn
        </>
      )}
    </Button>
  );
}
