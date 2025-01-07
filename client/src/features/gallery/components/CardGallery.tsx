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

  const { data, isLoading } = useQuery<CardsResponse>({
    queryKey: ["/api/trading-cards", currentPage],
  });

  if (isLoading) {
    return (
      <div className="flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
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
        {/* Background gradient effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-blue-500/5 to-purple-500/5 rounded-3xl" />

        {/* Icon container with animation */}
        <motion.div
          className="relative w-32 h-32 mb-8"
          animate={{
            scale: [1, 1.05, 1],
            rotate: [0, 5, -5, 0],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-full blur-xl" />
          <div className="relative w-full h-full rounded-full bg-black/30 border border-purple-500/30 backdrop-blur-sm flex items-center justify-center">
            <Wand2 className="w-12 h-12 text-purple-400" />
          </div>
        </motion.div>

        <h2 className="text-3xl font-bold text-white mb-4 relative">
          Begin Your Collection
          <motion.span
            className="absolute -right-6 -top-6"
            animate={{
              rotate: [0, 15, -15, 0],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            ✨
          </motion.span>
        </h2>

        <p className="text-purple-300/70 mb-8 max-w-md text-lg leading-relaxed">
          Transform your AI-generated artwork into powerful trading cards. Each card is unique,
          with special attributes and powers waiting to be discovered!
        </p>

        <div className="flex gap-4">
          <Button
            onClick={() => navigate("/create")}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700
                    transform transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-purple-500/20
                    px-6 py-6 text-lg"
          >
            <Sparkles className="mr-2 h-5 w-5" />
            Create Your First Card
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {data.cards.map((card) => (
          <CardItem key={card.id} card={card} isCardsRoute={isCardsRoute} />
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