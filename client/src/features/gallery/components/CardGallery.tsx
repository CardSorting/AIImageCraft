import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Loader2, Library, Sparkles, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CardItem } from "./CardItem";
import { Pagination } from "./Pagination";
import { motion } from "framer-motion";
import type { TradingCard } from "@/features/trading-cards/types";

interface CardsResponse {
  cards: TradingCard[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

export function CardGallery() {
  const [currentPage, setCurrentPage] = useState(1);
  const [location, navigate] = useLocation();
  const isCardsRoute = location === "/cards";

  const { data, isLoading, error } = useQuery<CardsResponse>({
    queryKey: ["/api/trading-cards", { page: currentPage }],
  });

  if (isLoading) {
    return (
      <div className="flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-400">Error loading cards. Please try again.</p>
      </div>
    );
  }

  if (!data?.cards?.length) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative flex flex-col items-center justify-center p-12 text-center"
      >
        <div className="w-24 h-24 rounded-full bg-purple-500/10 flex items-center justify-center mb-6">
          <Wand2 className="w-12 h-12 text-purple-400" />
        </div>

        <h2 className="text-3xl font-bold text-white mb-4">
          Begin Your Collection
        </h2>

        <p className="text-purple-300/70 mb-8 max-w-md text-lg leading-relaxed">
          Transform your AI-generated artwork into powerful trading cards. Each card is unique,
          with special attributes and powers waiting to be discovered!
        </p>

        <Button
          onClick={() => navigate("/create")}
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700
                    transform transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-purple-500/20
                    px-6 py-6 text-lg"
        >
          <Sparkles className="mr-2 h-5 w-5" />
          Create Your First Card
        </Button>
      </motion.div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {data.cards.map((card) => (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="h-full"
          >
            <CardItem card={card} isCardsRoute={isCardsRoute} />
          </motion.div>
        ))}
      </div>

      {data.pagination.totalPages > 1 && (
        <div className="mt-8">
          <Pagination
            currentPage={data.pagination.currentPage}
            totalPages={data.pagination.totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </>
  );
}