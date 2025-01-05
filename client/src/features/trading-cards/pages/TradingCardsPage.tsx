import { useEffect } from "react";
import { useLocation } from "wouter";
import Header from "@/components/Header";
import { CardGallery } from "@/features/gallery/components/CardGallery";

export default function TradingCardsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl md:text-6xl font-bold text-white text-center mb-8 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
          Card Collection
        </h1>
        <CardGallery />
      </div>
    </div>
  );
}