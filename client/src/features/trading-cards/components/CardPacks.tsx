import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Package, Plus, ChevronsUpDown } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ListPackModal } from "./ListPackModal";
import { CardItem } from "@/features/gallery/components/CardItem";
import { BulkCardSelector } from "./BulkCardSelector";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import type { TradingCard } from "@/features/trading-cards/types";

interface CardPack {
  id: number;
  name: string;
  description: string | null;
  createdAt: string;
  creator?: {
    id: number;
    username: string;
  };
  cards: Array<{
    id: number;
    name: string;
    image: { url: string };
    elementalType: string;
    rarity: string;
  }>;
}

interface TradingCard {
  id: number;
  name: string;
  image: { url: string };
  elementalType: string;
  rarity: string;
}

export function CardPacks() {
  const [isCreating, setIsCreating] = useState(false);
  const [selectedPackId, setSelectedPackId] = useState<number | null>(null);
  const [isAddingCards, setIsAddingCards] = useState(false);
  const [selectedCards, setSelectedCards] = useState<Set<number>>(new Set());
  const [listingPackId, setListingPackId] = useState<number | null>(null);
  const [listingPackName, setListingPackName] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: cardPacks,
    isLoading,
    error,
  } = useQuery<CardPack[]>({
    queryKey: ["/api/card-packs"],
    retry: false,
  });

  const {
    data: tradingCards,
    isLoading: isLoadingCards,
  } = useQuery<TradingCard[]>({
    queryKey: ["/api/trading-cards"],
    enabled: isAddingCards, // Only fetch when adding cards
  });

  const { mutate: createPack, isPending: isCreatePending } = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch("/api/card-packs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          description: formData.get("description"),
        }),
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/card-packs"] });
      toast({
        title: "Card pack created!",
        description: "Your new card pack is ready for cards.",
      });
      setIsCreating(false);
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error creating card pack",
        description: error.message,
      });
    },
  });

  const { mutate: addCardsToPack, isPending: isAddingCardsPending } = useMutation({
    mutationFn: async ({ packId, cardIds }: { packId: number; cardIds: number[] }) => {
      const targetPack = cardPacks?.find(p => p.id === packId);
      if (!targetPack) throw new Error("Pack not found");

      const currentCardCount = targetPack.cards.length;
      const availableSlots = 10 - currentCardCount;

      if (cardIds.length > availableSlots) {
        throw new Error(`This pack can only accept ${availableSlots} more cards`);
      }

      const duplicates = cardIds.filter(cardId =>
        targetPack.cards.some(card => card.id === cardId)
      );

      if (duplicates.length > 0) {
        throw new Error("Some selected cards are already in this pack");
      }

      const res = await fetch(`/api/card-packs/${packId}/cards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardIds }),
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/card-packs"] });
      toast({
        title: "Cards added!",
        description: "Cards have been added to your pack.",
      });
      setIsAddingCards(false);
      setSelectedCards(new Set());
      setSelectedPackId(null);
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error adding cards",
        description: error.message,
      });
    },
  });

  const handleCardSelect = (cardId: number, packId: number) => {
    const targetPack = cardPacks?.find(p => p.id === packId);
    if (!targetPack) return;

    const newSelected = new Set(selectedCards);

    if (selectedCards.has(cardId)) {
      newSelected.delete(cardId);
      setSelectedCards(newSelected);
      return;
    }

    const availableSlots = 10 - targetPack.cards.length;

    if (selectedCards.size >= availableSlots) {
      toast({
        variant: "destructive",
        title: "Pack limit reached",
        description: `This pack can only accept ${availableSlots} more cards`,
      });
      return;
    }

    if (targetPack.cards.some(card => card.id === cardId)) {
      toast({
        variant: "destructive",
        title: "Duplicate card",
        description: "This card is already in the pack",
      });
      return;
    }

    newSelected.add(cardId);
    setSelectedCards(newSelected);
  };

  const getPackCompletionStatus = (cardCount: number) => {
    if (cardCount === 0) return { status: 'empty', color: 'bg-gray-500' };
    if (cardCount < 5) return { status: 'starting', color: 'bg-red-500' };
    if (cardCount < 8) return { status: 'progressing', color: 'bg-yellow-500' };
    if (cardCount < 10) return { status: 'almost-complete', color: 'bg-blue-500' };
    return { status: 'complete', color: 'bg-green-500' };
  };

  const getPackStatusMessage = (cardCount: number) => {
    if (cardCount === 0) return "Start adding cards to your pack";
    if (cardCount < 5) return "Keep adding more cards";
    if (cardCount < 8) return "Getting there! Add more cards";
    if (cardCount < 10) return `Almost complete! Need ${10 - cardCount} more cards`;
    return "Pack complete! Ready to list";
  };

  if (isLoading) {
    return (
      <div className="flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="w-24 h-24 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
          <Package className="w-12 h-12 text-red-400" />
        </div>
        <h2 className="text-2xl font-semibold text-white mb-2">
          Error Loading Card Packs
        </h2>
        <p className="text-purple-300/70 mb-6 max-w-md">
          {error instanceof Error ? error.message : "Failed to load card packs"}
        </p>
      </div>
    );
  }

  if (!cardPacks?.length) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="w-24 h-24 rounded-full bg-purple-500/10 flex items-center justify-center mb-6">
          <Package className="w-12 h-12 text-purple-400" />
        </div>
        <h2 className="text-2xl font-semibold text-white mb-2">
          No card packs yet
        </h2>
        <p className="text-purple-300/70 mb-6 max-w-md">
          Create your first card pack to start organizing your collection!
        </p>
        <Button
          onClick={() => setIsCreating(true)}
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Card Pack
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Your Card Packs</h2>
        <Button
          onClick={() => setIsCreating(true)}
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Pack
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cardPacks.map((pack) => {
          const cardCount = pack.cards?.length || 0;
          const { status, color } = getPackCompletionStatus(cardCount);
          const statusMessage = getPackStatusMessage(cardCount);
          const previewCard = pack.cards.length > 0
            ? pack.cards[Math.floor(Math.random() * pack.cards.length)]
            : null;

          return (
            <Collapsible key={pack.id}>
              <Card className="p-6 bg-black/30 border-purple-500/20 backdrop-blur-sm">
                <CollapsibleTrigger className="w-full">
                  <div className="space-y-4">
                    {previewCard && (
                      <div className="relative w-full aspect-[16/9] overflow-hidden rounded-lg">
                        <img
                          src={previewCard.image.url}
                          alt={`Preview of ${pack.name}`}
                          className="w-full h-full object-cover transition-transform hover:scale-105 duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-white">
                          <span className="text-sm font-medium bg-black/40 px-2 py-1 rounded-md">
                            {previewCard.name}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded-md ${
                            previewCard.rarity === 'Legendary' ? 'bg-yellow-500/40' :
                              previewCard.rarity === 'Epic' ? 'bg-purple-500/40' :
                                previewCard.rarity === 'Rare' ? 'bg-blue-500/40' :
                                  'bg-gray-500/40'
                          }`}>
                            {previewCard.rarity}
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-white">{pack.name}</h3>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <div className={`px-2 py-1 rounded-full text-xs ${color} text-white`}>
                                {cardCount}/10
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{statusMessage}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>

                      <div className="w-full">
                        <Progress
                          value={(cardCount / 10) * 100}
                          className="h-2"
                          indicatorClassName={`${color}`}
                        />
                      </div>
                    </div>
                  </div>
                </CollapsibleTrigger>

                {pack.description && (
                  <p className="text-purple-300/70 text-sm mt-4">{pack.description}</p>
                )}

                <CollapsibleContent className="mt-4 space-y-4">
                  {pack.cards && pack.cards.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2">
                      {pack.cards.map((card) => (
                        <div
                          key={card.id}
                          className="relative group overflow-hidden rounded-lg"
                        >
                          <img
                            src={card.image.url}
                            alt={card.name}
                            className="w-full h-32 object-cover"
                          />
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-white text-sm font-medium">
                              {card.name}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-purple-300/70 text-sm italic">No cards in this pack</p>
                  )}

                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        setSelectedPackId(pack.id);
                        setIsAddingCards(true);
                        setSelectedCards(new Set());
                      }}
                      disabled={cardCount >= 10}
                      className="flex-1 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      {cardCount >= 10 ? "Pack Full" : "Add Cards"}
                    </Button>

                    {cardCount === 10 ? (
                      <Button
                        onClick={() => {
                          setListingPackId(pack.id);
                          setListingPackName(pack.name);
                        }}
                        className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                      >
                        <Package className="mr-2 h-4 w-4" />
                        List Pack
                      </Button>
                    ) : (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              disabled
                              className="flex-1 bg-purple-600/20 text-purple-300/50 cursor-not-allowed"
                            >
                              <Package className="mr-2 h-4 w-4" />
                              Need {10 - cardCount} More Cards
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Pack must have exactly 10 cards to be listed in the marketplace</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          );
        })}
      </div>

      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent className="sm:max-w-[425px] bg-black/80 border-purple-500/20 text-white">
          <DialogHeader>
            <DialogTitle>Create Card Pack</DialogTitle>
            <DialogDescription className="text-purple-300/70">
              Create a new pack to organize your trading cards. Each pack can
              hold up to 10 cards.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              createPack(new FormData(e.currentTarget));
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <label className="text-sm font-medium text-white">Pack Name</label>
              <Input
                name="name"
                required
                className="bg-purple-950/30 border-purple-500/30 text-white"
                placeholder="Enter pack name..."
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white">Description</label>
              <Textarea
                name="description"
                className="bg-purple-950/30 border-purple-500/30 text-white resize-none"
                placeholder="Enter pack description..."
                rows={3}
              />
            </div>

            <Button
              type="submit"
              disabled={isCreatePending}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              {isCreatePending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Create Pack
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddingCards} onOpenChange={setIsAddingCards}>
        <DialogContent className="sm:max-w-[800px] bg-black/80 border-purple-500/20 text-white">
          <DialogHeader>
            <DialogTitle>Add Cards to Pack</DialogTitle>
            <DialogDescription className="text-purple-300/70">
              Select cards to add to your pack. Cards already in the pack will be disabled.
              {selectedPackId && cardPacks && (
                <div className="mt-2">
                  <span className="font-medium">Available slots: </span>
                  {10 - (cardPacks.find(p => p.id === selectedPackId)?.cards.length || 0)}
                </div>
              )}
            </DialogDescription>
          </DialogHeader>

          {isLoadingCards ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
            </div>
          ) : tradingCards && tradingCards.length > 0 ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (selectedPackId && selectedCards.size > 0) {
                  addCardsToPack({
                    packId: selectedPackId,
                    cardIds: Array.from(selectedCards),
                  });
                }
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-[400px] overflow-y-auto p-4">
                {tradingCards.map((card) => {
                  const targetPack = cardPacks?.find(p => p.id === selectedPackId);
                  const isInPack = targetPack?.cards.some(c => c.id === card.id);
                  const isSelectable = targetPack &&
                    !isInPack &&
                    (targetPack.cards.length + selectedCards.size) < 10;

                  return (
                    <label
                      key={card.id}
                      className={`relative group cursor-pointer ${
                        !isSelectable && "opacity-50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedCards.has(card.id)}
                        onChange={() => selectedPackId && handleCardSelect(card.id, selectedPackId)}
                        disabled={!isSelectable}
                        className="peer sr-only"
                      />
                      <div className="relative overflow-hidden rounded-lg border-2 border-transparent peer-checked:border-purple-500 transition-all">
                        <img
                          src={card.image.url}
                          alt={card.name}
                          className="w-full h-32 object-cover"
                        />
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          {isInPack ? (
                            <span className="text-white text-sm font-medium px-3 py-1 bg-purple-500/50 rounded-full">
                              Already in pack
                            </span>
                          ) : !isSelectable ? (
                            <span className="text-white text-sm font-medium px-3 py-1 bg-red-500/50 rounded-full">
                              Pack is full
                            </span>
                          ) : (
                            <span className="text-white text-sm font-medium">
                              {card.name}
                            </span>
                          )}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>

              <Button
                type="submit"
                disabled={isAddingCardsPending || selectedCards.size === 0}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                {isAddingCardsPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}
                Add Selected Cards ({selectedCards.size})
              </Button>
            </form>
          ) : (
            <div className="text-center py-8">
              <p className="text-purple-300/70">No cards available to add.</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ListPackModal
        packId={listingPackId!}
        packName={listingPackName}
        open={!!listingPackId}
        onOpenChange={(open) => {
          if (!open) {
            setListingPackId(null);
            setListingPackName("");
          }
        }}
      />
    </div>
  );
}