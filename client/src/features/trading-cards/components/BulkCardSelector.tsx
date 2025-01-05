import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { CardItem } from "@/features/gallery/components/CardItem";
import type { TradingCard } from "@/features/trading-cards/types";
import { Button } from "@/components/ui/button";
import { Package, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface BulkCardSelectorProps {
  cards: TradingCard[];
  selectedCards: Set<number>;
  onSelectionChange: (newSelection: Set<number>) => void;
  cardPacks?: Array<{
    id: number;
    name: string;
    cards?: Array<{
      id: number;
    }>;
  }>;
  isAddingToPack: boolean;
}

export function BulkCardSelector({
  cards,
  selectedCards,
  onSelectionChange,
  cardPacks,
  isAddingToPack,
}: BulkCardSelectorProps) {
  const { toast } = useToast();
  const [availableSlots, setAvailableSlots] = useState<number>(10);
  const [disabledCards, setDisabledCards] = useState<Set<number>>(new Set());

  // Calculate available slots and disabled cards whenever packs or selection changes
  useEffect(() => {
    if (isAddingToPack && cardPacks) {
      // Find packs that still have space
      const packsWithSpace = cardPacks.filter(pack => {
        const currentCount = pack.cards?.length || 0;
        return currentCount < 10;
      });

      if (packsWithSpace.length === 0) {
        setAvailableSlots(0);
        setDisabledCards(new Set(cards.map(card => card.id)));
        return;
      }

      // Find the pack with the most available space
      const maxAvailableSlots = Math.max(
        ...packsWithSpace.map(pack => 10 - (pack.cards?.length || 0))
      );

      setAvailableSlots(maxAvailableSlots);

      // Find cards that are already in any pack
      const cardsInPacks = new Set(
        cardPacks.flatMap(pack => pack.cards?.map(card => card.id) || [])
      );

      setDisabledCards(cardsInPacks);
    } else {
      setAvailableSlots(10);
      setDisabledCards(new Set());
    }
  }, [cardPacks, isAddingToPack, cards]);

  const handleCardSelect = (cardId: number) => {
    if (disabledCards.has(cardId)) {
      toast({
        variant: "destructive",
        title: "Card unavailable",
        description: "This card is already in one of your packs.",
      });
      return;
    }

    const newSelected = new Set(selectedCards);
    if (selectedCards.has(cardId)) {
      newSelected.delete(cardId);
      onSelectionChange(newSelected);
    } else {
      if (selectedCards.size >= availableSlots) {
        toast({
          variant: "destructive",
          title: "Selection limit reached",
          description: `You can only select up to ${availableSlots} cards based on available pack space.`,
        });
        return;
      }

      newSelected.add(cardId);
      onSelectionChange(newSelected);
    }
  };

  return (
    <ScrollArea className="h-[400px] pr-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {cards.map((card) => (
          <div
            key={card.id}
            className={cn(
              "relative transition-opacity duration-200",
              disabledCards.has(card.id) && "opacity-50"
            )}
          >
            <CardItem
              card={card}
              isCardsRoute
              isSelected={selectedCards.has(card.id)}
              onSelect={() => handleCardSelect(card.id)}
            />
            {disabledCards.has(card.id) && (
              <div className="absolute inset-0 bg-black/40 backdrop-blur-sm rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-medium px-3 py-1 bg-black/60 rounded-full">
                  Already in pack
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
