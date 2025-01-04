import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Star } from "lucide-react";
import TradeModal from "@/components/TradeModal";
import { FavoriteButton } from "./FavoriteButton";
import { Pagination } from "./Pagination";
import { StatDisplay } from "./StatDisplay";
import { getElementalTypeStyle, getElementalTypeBadgeStyle, getRarityStyle, getRarityOverlayStyle } from "../utils/styles";
import type { TradingCard } from "../types";

interface FavoriteItem {
  id: number;
  itemId: number;
  type: 'card' | 'image';
  name?: string;
  description?: string;
  elementalType?: string;
  rarity?: string;
  powerStats?: {
    attack: number;
    defense: number;
    speed: number;
    magic: number;
  };
  image?: {
    url: string;
  };
  url?: string;
  prompt?: string;
  createdAt: string;
  creator?: {
    username: string;
  };
  owner?: {
    username: string;
  };
}

export function FavoritesGallery() {
  const [selectedCard, setSelectedCard] = useState<TradingCard | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 12;

  const { data: favorites, isLoading } = useQuery<FavoriteItem[]>({
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

  if (!favorites?.length) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="w-24 h-24 rounded-full bg-purple-500/10 flex items-center justify-center mb-6">
          <Star className="w-12 h-12 text-purple-400" />
        </div>
        <h2 className="text-2xl font-semibold text-white mb-2">
          No favorites yet
        </h2>
        <p className="text-purple-300/70 mb-6 max-w-md">
          Click the star icon on any card or image to add it to your favorites!
        </p>
      </div>
    );
  }

  const totalPages = Math.ceil(favorites.length / ITEMS_PER_PAGE);
  const paginatedItems = favorites.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {paginatedItems.map((item) => (
          <div
            key={item.id}
            className="relative group cursor-pointer transform transition-all duration-300 hover:scale-105"
            onClick={() => item.type === 'card' && setSelectedCard(item as TradingCard)}
          >
            <div className={`
              relative aspect-square rounded-xl overflow-hidden
              ${item.type === 'card' ? getElementalTypeStyle(item.elementalType!) : 'border-purple-500/20'}
              ${item.type === 'card' ? getRarityOverlayStyle(item.rarity!) : ''}
              shadow-lg hover:shadow-xl
              ${item.type === 'image' ? 'backdrop-blur-sm bg-black/30' : ''}
            `}>
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10" />

              {item.type === 'card' && (
                <>
                  <div className="absolute top-0 left-0 right-0 z-20 p-3">
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col">
                        <h3 className="text-lg font-bold text-white leading-tight tracking-tight">{item.name}</h3>
                        <span className="text-purple-300/70 text-xs">by {item.creator?.username || 'Unknown'}</span>
                      </div>
                      <span className={`
                        px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wider
                        ${getElementalTypeBadgeStyle(item.elementalType!)}
                        shadow-sm backdrop-blur-sm
                      `}>
                        {item.elementalType}
                      </span>
                    </div>
                  </div>

                  <img
                    src={item.image!.url}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />

                  <div className="absolute bottom-0 left-0 right-0 p-3 z-20">
                    <div className="grid grid-cols-2 gap-1.5">
                      <StatDisplay
                        icon="swords"
                        label="ATK"
                        value={item.powerStats!.attack}
                        color="red"
                      />
                      <StatDisplay
                        icon="shield"
                        label="DEF"
                        value={item.powerStats!.defense}
                        color="blue"
                      />
                      <StatDisplay
                        icon="zap"
                        label="SPD"
                        value={item.powerStats!.speed}
                        color="yellow"
                      />
                      <StatDisplay
                        icon="sparkles"
                        label="MAG"
                        value={item.powerStats!.magic}
                        color="purple"
                      />
                    </div>
                  </div>

                  <div className={`
                    absolute top-2 right-2 z-20 px-2 py-1
                    rounded-full text-xs font-bold uppercase tracking-wider
                    ${getRarityStyle(item.rarity!)}
                    shadow-lg backdrop-blur-sm border border-white/10
                    transform transition-all duration-300
                    group-hover:scale-110 group-hover:rotate-3
                  `}>
                    {item.rarity}
                  </div>
                </>
              )}

              {item.type === 'image' && (
                <>
                  <img
                    src={item.url}
                    alt={item.prompt}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-4 left-4 right-4">
                    <p className="text-white text-sm">{item.prompt}</p>
                    <span className="text-purple-300/70 text-xs">by {item.creator?.username || 'Unknown'}</span>
                  </div>
                </>
              )}

              <FavoriteButton
                itemId={item.itemId}
                itemType={item.type}
                initialFavorited={true}
              />
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

      {selectedCard && (
        <TradeModal
          open={!!selectedCard}
          onOpenChange={(open) => !open && setSelectedCard(null)}
          card={selectedCard}
          onTrade={() => {
            queryClient.invalidateQueries({ queryKey: ["/api/trading-cards"] });
            queryClient.invalidateQueries({ queryKey: ["/api/favorites"] });
          }}
        />
      )}
    </>
  );
}