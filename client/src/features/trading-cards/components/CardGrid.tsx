import { useState } from "react";
import { CardItem } from "@/features/gallery/components/CardItem";
import { BulkCardSelector } from "./BulkCardSelector";
import type { TradingCard } from "@/features/trading-cards/types";
import { Button } from "@/components/ui/button";
import { Package, X, ArrowUpDown } from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
    image: { url: string };
  }>;
}

type SortOption = {
  label: string;
  value: string;
  compareFn: (a: TradingCard, b: TradingCard) => number;
};

const sortOptions: SortOption[] = [
  {
    label: "Name (A-Z)",
    value: "name-asc",
    compareFn: (a, b) => a.name.localeCompare(b.name),
  },
  {
    label: "Name (Z-A)",
    value: "name-desc",
    compareFn: (a, b) => b.name.localeCompare(a.name),
  },
  {
    label: "Rarity (Highest)",
    value: "rarity-desc",
    compareFn: (a, b) => {
      const rarityOrder = { Common: 0, Uncommon: 1, Rare: 2, Epic: 3, Legendary: 4, Mythic: 5 };
      return (rarityOrder[b.rarity as keyof typeof rarityOrder] || 0) -
        (rarityOrder[a.rarity as keyof typeof rarityOrder] || 0);
    },
  },
  {
    label: "Rarity (Lowest)",
    value: "rarity-asc",
    compareFn: (a, b) => {
      const rarityOrder = { Common: 0, Uncommon: 1, Rare: 2, Epic: 3, Legendary: 4, Mythic: 5 };
      return (rarityOrder[a.rarity as keyof typeof rarityOrder] || 0) -
        (rarityOrder[b.rarity as keyof typeof rarityOrder] || 0);
    },
  },
  {
    label: "Attack (Highest)",
    value: "attack-desc",
    compareFn: (a, b) => b.powerStats.attack - a.powerStats.attack,
  },
  {
    label: "Defense (Highest)",
    value: "defense-desc",
    compareFn: (a, b) => b.powerStats.defense - a.powerStats.defense,
  },
  {
    label: "Speed (Highest)",
    value: "speed-desc",
    compareFn: (a, b) => b.powerStats.speed - a.powerStats.speed,
  },
  {
    label: "Magic (Highest)",
    value: "magic-desc",
    compareFn: (a, b) => b.powerStats.magic - a.powerStats.magic,
  },
  {
    label: "Element (A-Z)",
    value: "element-asc",
    compareFn: (a, b) => a.elementalType.localeCompare(b.elementalType),
  },
];

export function CardGrid({ cards }: CardGridProps) {
  const [selectedCards, setSelectedCards] = useState<Set<number>>(new Set());
  const [isAddingToPack, setIsAddingToPack] = useState(false);
  const [selectedPackId, setSelectedPackId] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("name-asc");
  const [isCompactView, setIsCompactView] = useState(false);
  const { toast } = useToast();

  // Sort cards based on selected option
  const sortedCards = [...cards].sort(
    sortOptions.find((option) => option.value === sortBy)?.compareFn ||
      sortOptions[0].compareFn
  );

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

  const handlePackSelect = (packId: string) => {
    setSelectedPackId(packId);
    if (packId) {
      addCardsToPack({ packId: parseInt(packId) });
    }
  };

  return (
    <>
      {/* Controls */}
      <div className="flex justify-between items-center mb-6 gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <ArrowUpDown className="h-4 w-4" />
              Sort by: {sortOptions.find((option) => option.value === sortBy)?.label}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            {sortOptions.map((option) => (
              <DropdownMenuItem
                key={option.value}
                onClick={() => setSortBy(option.value)}
                className="cursor-pointer"
              >
                {option.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="ghost"
          onClick={() => setIsCompactView(!isCompactView)}
          className="px-2"
        >
          {isCompactView ? "Expanded View" : "Compact View"}
        </Button>
      </div>

      {/* Card Grid */}
      <div
        className={`grid gap-6 ${
          isCompactView
            ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
            : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        }`}
      >
        {sortedCards.map((card) => (
          <CardItem
            key={card.id}
            card={card}
            isCardsRoute
            isSelected={selectedCards.has(card.id)}
            onSelect={() => setSelectedCards((prev) => {
              const newSet = new Set(prev);
              if (prev.has(card.id)) {
                newSet.delete(card.id);
              } else {
                newSet.add(card.id);
              }
              return newSet;
            })}
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
        <DialogContent className="sm:max-w-[800px] bg-black/80 border-purple-500/20 text-white">
          <DialogHeader>
            <DialogTitle>Add Cards to Pack</DialogTitle>
            <DialogDescription className="text-purple-300/70">
              Select cards to add to a pack. Cards that are already in packs will be
              disabled.
            </DialogDescription>
          </DialogHeader>

          {isLoadingPacks ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
            </div>
          ) : cardPacks && cardPacks.length > 0 ? (
            <div className="space-y-6">
              <Select value={selectedPackId} onValueChange={handlePackSelect}>
                <SelectTrigger className="w-full bg-purple-950/30 border-purple-500/30 text-white">
                  <SelectValue placeholder="Choose a pack" />
                </SelectTrigger>
                <SelectContent className="bg-black/90 border-purple-500/20">
                  {cardPacks.map((pack) => {
                    const totalCards = pack.cards?.length || 0;
                    const availableSlots = 10 - totalCards;

                    return (
                      <SelectItem
                        key={pack.id}
                        value={pack.id.toString()}
                        disabled={availableSlots === 0}
                        className="text-white hover:bg-purple-500/20 focus:bg-purple-500/20 focus:text-white"
                      >
                        <span className="flex items-center justify-between w-full">
                          <span>{pack.name}</span>
                          <span className="text-sm text-purple-300/70">
                            {totalCards}/10
                            {availableSlots === 0 && " (Full)"}
                          </span>
                        </span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>

              <BulkCardSelector
                cards={sortedCards}
                selectedCards={selectedCards}
                onSelectionChange={setSelectedCards}
                cardPacks={cardPacks}
                isAddingToPack={isAddingToPack}
              />
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