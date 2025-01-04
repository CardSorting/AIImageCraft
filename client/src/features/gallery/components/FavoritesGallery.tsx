import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Star } from "lucide-react";
import TradeModal from "@/components/TradeModal";
import { FavoriteButton } from "./FavoriteButton";
import { Pagination } from "./Pagination";
import { StatDisplay } from "./StatDisplay";
import { getElementalTypeStyle, getElementalTypeBadgeStyle, getRarityStyle, getRarityOverlayStyle } from "../utils/styles";
import type { TradingCard } from "../types";

export function FavoritesGallery() {
  const [selectedCard, setSelectedCard] = useState<TradingCard | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const CARDS_PER_PAGE = 12;

  const { data: cards, isLoading } = useQuery<TradingCard[]>({
    queryKey: ["/api/favorites"],
  });
  const queryClient = useQueryClient();

  if (isLoading) {
    return (
      <div className="flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
      </div>
    );
  }

  if (!cards?.length) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="w-24 h-24 rounded-full bg-purple-500/10 flex items-center justify-center mb-6">
          <Star className="w-12 h-12 text-purple-400" />
        </div>
        <h2 className="text-2xl font-semibold text-white mb-2">
          No favorite cards yet
        </h2>
        <p className="text-purple-300/70 mb-6 max-w-md">
          Click the star icon on any card to add it to your favorites!
        </p>
      </div>
    );
  }

  const totalPages = Math.ceil(cards.length / CARDS_PER_PAGE);
  const paginatedCards = cards.slice(
    (currentPage - 1) * CARDS_PER_PAGE,
    currentPage * CARDS_PER_PAGE
  );

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {paginatedCards.map((card) => (
          <div
            key={card.id}
            className="relative group cursor-pointer transform transition-all duration-300 hover:scale-105"
            onClick={() => setSelectedCard(card)}
          >
            <div className={`
              relative aspect-square rounded-xl overflow-hidden
              ${getElementalTypeStyle(card.elementalType)}
              ${getRarityOverlayStyle(card.rarity)}
              shadow-lg hover:shadow-xl
            `}>
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10" />
              <div className="absolute top-0 left-0 right-0 z-20 p-3">
                <div className="flex justify-between items-start">
                  <div className="flex flex-col">
                    <h3 className="text-lg font-bold text-white leading-tight tracking-tight">{card.name}</h3>
                    <span className="text-purple-300/70 text-xs">by {card.creator?.username || 'Unknown'}</span>
                  </div>
                  <span className={`
                    px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wider
                    ${getElementalTypeBadgeStyle(card.elementalType)}
                    shadow-sm backdrop-blur-sm
                  `}>
                    {card.elementalType}
                  </span>
                </div>
              </div>

              <img
                src={card.image.url}
                alt={card.name}
                className="w-full h-full object-cover"
              />

              <div className="absolute bottom-0 left-0 right-0 p-3 z-20">
                <div className="grid grid-cols-2 gap-1.5">
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
                absolute top-2 right-2 z-20 px-2 py-1
                rounded-full text-xs font-bold uppercase tracking-wider
                ${getRarityStyle(card.rarity)}
                shadow-lg backdrop-blur-sm border border-white/10
                transform transition-all duration-300
                group-hover:scale-110 group-hover:rotate-3
              `}>
                {card.rarity}
              </div>
              <FavoriteButton itemId={card.id} itemType="card" />
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}

      <TradeModal
        open={!!selectedCard}
        onOpenChange={(open) => !open && setSelectedCard(null)}
        card={selectedCard!}
        onTrade={() => {
          queryClient.invalidateQueries({ queryKey: ["/api/trading-cards"] });
          queryClient.invalidateQueries({ queryKey: ["/api/favorites"] });
        }}
      />
    </>
  );
}
