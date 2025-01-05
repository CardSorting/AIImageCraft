import { useState } from "react";
import { CardItem } from "@/features/gallery/components/CardItem";
import type { TradingCard } from "@/features/trading-cards/types";
import { Button } from "@/components/ui/button";
import { Package, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface CardGridProps {
  cards: TradingCard[];
}

interface CardPack {
  id: number;
  name: string;
  description?: string;
  cards?: Array<{
    id: number;
    name: string;
    image: {
      url: string;
    };
  }>;
}

export function CardGrid({ cards }: CardGridProps) {
  const [selectedCards, setSelectedCards] = useState<Set<number>>(new Set());
  const [isAddingToPack, setIsAddingToPack] = useState(false);
  const [selectedPackId, setSelectedPackId] = useState<string>("");
  const { toast } = useToast();

  // Fetch existing card packs
  const { data: cardPacks, isLoading: isLoadingPacks } = useQuery<CardPack[]>({
    queryKey: ["/api/card-packs"],
    enabled: isAddingToPack,
  });

  // Mutation for adding cards to pack
  const { mutate: addCardsToPack, isPending: isAddingCards } = useMutation({
    mutationFn: async ({ packId }: { packId: number }) => {
      const res = await fetch(`/api/card-packs/${packId}/cards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardIds: Array.from(selectedCards) }),
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Cards added to pack!",
        description: `Successfully added ${selectedCards.size} cards to the pack.`,
      });
      setIsAddingToPack(false);
      setSelectedPackId("");
      setSelectedCards(new Set());
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error adding cards to pack",
        description: error.message,
      });
    },
  });

  const handleCardSelect = (cardId: number) => {
    const newSelected = new Set(selectedCards);
    if (selectedCards.has(cardId)) {
      newSelected.delete(cardId);
    } else if (selectedCards.size < 10) {
      newSelected.add(cardId);
    } else {
      toast({
        variant: "destructive",
        title: "Selection limit reached",
        description: "You can only select up to 10 cards at a time.",
      });
      return;
    }
    setSelectedCards(newSelected);
  };

  const handlePackSelect = (packId: string) => {
    setSelectedPackId(packId);
    if (packId) {
      addCardsToPack({ packId: parseInt(packId) });
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 relative">
        {cards.map((card) => (
          <CardItem
            key={card.id}
            card={card}
            isCardsRoute
            isSelected={selectedCards.has(card.id)}
            onSelect={() => handleCardSelect(card.id)}
          />
        ))}
      </div>

      {/* Floating Action Button for selected cards */}
      {selectedCards.size > 0 && (
        <div className="fixed bottom-6 right-6 flex items-center gap-4 p-4 bg-black/90 backdrop-blur-sm rounded-lg border border-purple-500/20 shadow-lg">
          <div className="text-white">
            <span className="font-medium">{selectedCards.size}</span>
            <span className="text-purple-300/70 ml-2">cards selected</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedCards(new Set())}
              className="text-purple-300/70 hover:text-purple-300"
            >
              <X className="w-4 h-4" />
            </Button>
            <Button
              onClick={() => setIsAddingToPack(true)}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              <Package className="w-4 h-4 mr-2" />
              Add to Pack
            </Button>
          </div>
        </div>
      )}

      {/* Add to Pack Dialog */}
      <Dialog open={isAddingToPack} onOpenChange={setIsAddingToPack}>
        <DialogContent className="sm:max-w-[425px] bg-black/80 border-purple-500/20 text-white">
          <DialogHeader>
            <DialogTitle>Add Cards to Pack</DialogTitle>
            <DialogDescription className="text-purple-300/70">
              Select a pack to add your {selectedCards.size} selected card{selectedCards.size !== 1 ? 's' : ''} to.
            </DialogDescription>
          </DialogHeader>

          {isLoadingPacks ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
            </div>
          ) : cardPacks && cardPacks.length > 0 ? (
            <div className="space-y-4">
              <Select
                value={selectedPackId}
                onValueChange={handlePackSelect}
              >
                <SelectTrigger className="w-full bg-purple-950/30 border-purple-500/30 text-white">
                  <SelectValue placeholder="Choose a pack" />
                </SelectTrigger>
                <SelectContent className="bg-black/90 border-purple-500/20">
                  {cardPacks.map((pack) => {
                    const totalCards = (pack.cards?.length || 0) + selectedCards.size;
                    const isDisabled = totalCards > 10;
                    
                    return (
                      <SelectItem
                        key={pack.id}
                        value={pack.id.toString()}
                        disabled={isDisabled}
                        className="text-white hover:bg-purple-500/20 focus:bg-purple-500/20 focus:text-white"
                      >
                        <span className="flex items-center justify-between w-full">
                          <span>{pack.name}</span>
                          <span className="text-sm text-purple-300/70">
                            {pack.cards?.length || 0}/10 
                            {isDisabled && " (Not enough space)"}
                          </span>
                        </span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>

              <div className="text-sm text-purple-300/70">
                Note: Each pack can hold a maximum of 10 cards.
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-purple-300/70">No packs available. Create a pack first.</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
