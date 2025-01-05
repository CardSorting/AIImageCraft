import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Loader2, Library } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { FavoriteButton } from "../components/FavoriteButton";
import { getElementalTypeStyle, getRarityStyle, getRarityOverlayStyle, getElementalTypeBadgeStyle } from "../utils/styles";
import { StatDisplay } from "./StatDisplay";
import { Pagination } from "./Pagination";
import type { TradingCard } from "../types";

export function CardGallery() {
  const [currentPage, setCurrentPage] = useState(1);
  const [location] = useLocation();
  const isCardsRoute = location === "/cards";
  const CARDS_PER_PAGE = 12;

  const { data: cards, isLoading } = useQuery<TradingCard[]>({
    queryKey: ["/api/trading-cards"],
  });

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
          <Library className="w-12 h-12 text-purple-400" />
        </div>
        <h2 className="text-2xl font-semibold text-white mb-2">
          No cards yet
        </h2>
        <p className="text-purple-300/70 mb-6 max-w-md">
          Transform your AI-generated images into unique cards with special attributes and powers!
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
            className="relative group transform transition-all duration-300 hover:scale-105"
          >
            {/* Card Frame */}
            <div className={`
              relative w-full aspect-[3/4] rounded-[18px] overflow-hidden
              ${getElementalTypeStyle(card.elementalType)}
              ${getRarityOverlayStyle(card.rarity)}
              shadow-xl hover:shadow-2xl
              transition-all duration-500
              bg-gradient-to-br from-gray-900 to-gray-800
              border-2 border-purple-500/20
            `}>
              {/* Card Header - Name and Type */}
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

              {/* Card Image */}
              <div className="absolute inset-0 z-10">
                <img
                  src={card.image.url}
                  alt={card.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/90" />
              </div>

              {/* Card Description */}
              <div className="absolute bottom-28 left-0 right-0 p-4 z-20">
                <div className="bg-black/40 backdrop-blur-sm rounded-xl p-3 border border-white/10">
                  <p className="text-sm text-gray-200/95 leading-relaxed italic">
                    "{card.description}"
                  </p>
                </div>
              </div>

              {/* Card Stats */}
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

              {/* Rarity Badge */}
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

              {/* Favorite Button - Only show if not on /cards route */}
              {!isCardsRoute && <FavoriteButton itemId={card.id} itemType="card" />}
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
    </>
  );
}