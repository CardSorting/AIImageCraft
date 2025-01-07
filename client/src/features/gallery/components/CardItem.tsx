import { useState } from "react";
import { use3DCardEffect } from "@/features/trading-cards/hooks/use3DCardEffect";
import { FavoriteButton } from "./FavoriteButton";
import { StatDisplay } from "./StatDisplay";
import { getElementalTypeStyle, getRarityStyle, getRarityOverlayStyle, getElementalTypeBadgeStyle } from "../utils/styles";
import type { TradingCard } from "@/features/trading-cards/types";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Package, Plus, Loader2, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface CardItemProps {
  card: TradingCard;
  isCardsRoute: boolean;
  isSelected?: boolean;
  onSelect?: () => void;
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

export function CardItem({ card, isCardsRoute, isSelected = false, onSelect }: CardItemProps) {
  const [isAddingToPack, setIsAddingToPack] = useState(false);
  const [selectedPackId, setSelectedPackId] = useState<string>("");
  const { toast } = useToast();
  const shouldUse3DEffect = ['Rare', 'Epic', 'Legendary', 'Mythic'].includes(card.rarity);
  const { cardRef, shineRef, rainbowShineRef } = shouldUse3DEffect ? use3DCardEffect() : { cardRef: null, shineRef: null, rainbowShineRef: null };

  const { data: cardPacks, isLoading: isLoadingPacks } = useQuery<CardPack[]>({
    queryKey: ["/api/card-packs"],
    enabled: isAddingToPack,
  });

  const { mutate: addCardToPack, isPending: isAddingCard } = useMutation({
    mutationFn: async ({ packId }: { packId: number }) => {
      const res = await fetch(`/api/card-packs/${packId}/cards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardIds: [card.id] }),
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Card added to pack!",
        description: "The card has been added to your selected pack.",
      });
      setIsAddingToPack(false);
      setSelectedPackId("");
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error adding card to pack",
        description: error.message,
      });
    },
  });

  const handlePackSelect = (packId: string) => {
    setSelectedPackId(packId);
    if (packId) {
      addCardToPack({ packId: parseInt(packId) });
    }
  };

  return (
    <>
      <div className="space-y-4">
        <div
          className={cn(
            "relative group transform transition-all duration-300 hover:scale-105",
            isSelected && "ring-4 ring-purple-500 rounded-[18px]"
          )}
          onClick={onSelect}
        >
          <div
            ref={cardRef}
            className={`
              relative w-full aspect-[3/4] rounded-[18px] overflow-hidden
              ${getElementalTypeStyle(card.elementalType)}
              ${getRarityOverlayStyle(card.rarity)}
              shadow-xl hover:shadow-2xl
              transition-all duration-500
              bg-gradient-to-br from-gray-900 to-gray-800
              border-2 border-purple-500/20
              ${shouldUse3DEffect ? 'card-3d' : ''}
              ${isSelected ? 'opacity-90' : ''}
            `}
          >
            {isCardsRoute && isSelected && (
              <div className="absolute top-2 left-2 z-50 w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center">
                <Check className="w-5 h-5 text-white" />
              </div>
            )}

            <div className="absolute top-0 left-0 right-0 z-20 p-4 bg-gradient-to-b from-black/90 via-black/60 to-transparent">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-white leading-tight tracking-tight mb-1">{card.name}</h3>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center">
                      <span className="text-xs font-medium text-purple-300">👤</span>
                    </div>
                    <span className="text-sm font-medium text-purple-300/90">
                      {card.creator?.username || 'Unknown Creator'}
                    </span>
                  </div>
                </div>
                <span className={`
                  px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider
                  ${getElementalTypeBadgeStyle(card.elementalType)}
                  shadow-lg backdrop-blur-sm border border-white/10
                  ml-3
                `}>
                  {card.elementalType}
                </span>
              </div>
            </div>

            <div className="absolute inset-0 z-10">
              <img
                src={card.image.url}
                alt={card.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/90" />
            </div>

            {shouldUse3DEffect && (
              <>
                <div ref={shineRef} className="shine-effect" />
                <div className="rainbow-shine-container">
                  <div ref={rainbowShineRef} className="rainbow-shine-effect" />
                </div>
              </>
            )}

            <div className="absolute bottom-28 left-0 right-0 p-4 z-20">
              <div className="bg-black/40 backdrop-blur-sm rounded-xl p-3 border border-white/10">
                <p className="text-sm text-gray-200/95 leading-relaxed italic">
                  "{card.description}"
                </p>
              </div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-4 z-20 bg-black/60 backdrop-blur-sm border-t border-white/10">
              <div className="grid grid-cols-2 gap-2">
                <StatDisplay
                  icon="swords"
                  label="ATK"
                  value={card.powerStats.attack}
                  color="red"
                />
                <StatDisplay
                  icon="shield"
                  label="DEF"
                  value={card.powerStats.defense}
                  color="blue"
                />
                <StatDisplay
                  icon="zap"
                  label="SPD"
                  value={card.powerStats.speed}
                  color="yellow"
                />
                <StatDisplay
                  icon="sparkles"
                  label="MAG"
                  value={card.powerStats.magic}
                  color="purple"
                />
              </div>
            </div>

            <div className={`
              absolute top-4 right-4 z-30 px-3 py-1.5
              rounded-full text-xs font-bold uppercase tracking-wider
              ${getRarityStyle(card.rarity)}
              shadow-lg backdrop-blur-sm border border-white/10
              transform transition-all duration-300
              group-hover:scale-110 group-hover:rotate-3
            `}>
              {card.rarity}
            </div>

            {!isCardsRoute && <FavoriteButton itemId={card.id} itemType="card" />}
          </div>
        </div>

        {isCardsRoute && (
          <Button
            onClick={() => setIsAddingToPack(true)}
            className="w-full bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/20"
            size="sm"
          >
            <Package className="w-4 h-4 mr-2" />
            Add to Pack
          </Button>
        )}
      </div>

      <Dialog open={isAddingToPack} onOpenChange={setIsAddingToPack}>
        <DialogContent className="sm:max-w-[425px] bg-black/80 border-purple-500/20 text-white">
          <DialogHeader>
            <DialogTitle>Add to Card Pack</DialogTitle>
            <div className="text-sm text-purple-300/70">
              Add this card to an existing pack or create a new one.
            </div>
          </DialogHeader>

          {isLoadingPacks ? (
            <div className="flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
            </div>
          ) : (
            <div className="space-y-6">
              {cardPacks && cardPacks.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-white">Select Existing Pack</h3>
                  <Select
                    value={selectedPackId}
                    onValueChange={handlePackSelect}
                  >
                    <SelectTrigger className="w-full bg-purple-950/30 border-purple-500/30 text-white">
                      <SelectValue placeholder="Choose a pack" />
                    </SelectTrigger>
                    <SelectContent className="bg-black/90 border-purple-500/20">
                      {cardPacks.map((pack) => (
                        <SelectItem
                          key={pack.id}
                          value={pack.id.toString()}
                          disabled={(pack.cards?.length || 0) >= 10}
                          className="text-white hover:bg-purple-500/20 focus:bg-purple-500/20 focus:text-white"
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="font-medium">{pack.name}</span>
                            <span className="text-sm text-purple-300/70 bg-purple-500/10 px-2 py-0.5 rounded">
                              {pack.cards?.length || 0}/10 cards
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <Separator className="bg-purple-500/20" />

              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-white">Create New Pack</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-purple-300">Pack Name</label>
                    <input
                      type="text"
                      name="name"
                      placeholder="Enter pack name"
                      required
                      className="w-full px-3 py-2 bg-purple-950/30 border border-purple-500/30 rounded-md text-white placeholder:text-purple-300/50 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-purple-300">Description (optional)</label>
                    <textarea
                      name="description"
                      placeholder="Describe your pack"
                      className="w-full px-3 py-2 bg-purple-950/30 border border-purple-500/30 rounded-md text-white placeholder:text-purple-300/50 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors resize-none"
                      rows={3}
                    />
                  </div>
                  <Button
                    onClick={(e) => {
                      e.preventDefault();
                      // Implementation will be added later
                    }}
                    disabled={isAddingCard}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 transition-all duration-300"
                  >
                    {isAddingCard ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Pack...
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Pack & Add Card
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}