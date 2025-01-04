import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import type { TradingCard } from "@/pages/Gallery";

interface TradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  card: TradingCard | null;
  onTrade: () => void;
}

export default function TradeModal({ open, onOpenChange, card, onTrade }: TradeModalProps) {
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const [message, setMessage] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  // Return null if no card is selected to prevent the error
  if (!card) return null;

  async function handleTrade() {
    try {
      setIsLoading(true);
      const res = await fetch("/api/trades", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          receiverId: card.creator?.id,
          message,
          offeredCards: selectedCards,
        }),
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      toast({
        title: "Trade offer sent",
        description: "The other user will be notified of your offer.",
      });

      // Invalidate trades query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["/api/trades"] });
      onTrade();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to send trade offer",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl bg-black/80 border-purple-500/20">
        <DialogHeader>
          <DialogTitle className="text-white">Create Trade Offer</DialogTitle>
          <DialogDescription className="text-purple-300/70">
            Select cards from your collection to offer for {card.name}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          <Input
            placeholder="Add a message (optional)"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="bg-purple-950/30 border-purple-500/30 text-white"
          />
        </div>

        <ScrollArea className="h-[300px] mt-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {/* Card selection grid will be added here */}
          </div>
        </ScrollArea>

        <DialogFooter className="mt-4">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="text-purple-300/70 hover:text-purple-300"
          >
            Cancel
          </Button>
          <Button
            onClick={handleTrade}
            disabled={selectedCards.length === 0 || isLoading}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            Send Trade Offer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}