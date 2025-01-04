import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImagePlus, Library, History, Star } from "lucide-react";
import Header from "@/components/Header";
import { ImageGallery } from "@/features/gallery/components/ImageGallery";
import { CardGallery } from "@/features/gallery/components/CardGallery";
import { TradeHistory } from "@/features/gallery/components/TradeHistory";
import { FavoritesGallery } from "@/features/gallery/components/FavoritesGallery";
import { useToast } from "@/hooks/use-toast";

export default function Gallery() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl md:text-6xl font-bold text-white text-center mb-8 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
          Your Collection
        </h1>
        <Tabs defaultValue="images" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-4 mb-8">
            <TabsTrigger value="images" className="text-white">
              <ImagePlus className="w-4 h-4 mr-2" />
              Images
            </TabsTrigger>
            <TabsTrigger value="cards" className="text-white">
              <Library className="w-4 h-4 mr-2" />
              Cards
            </TabsTrigger>
            <TabsTrigger value="favorites" className="text-white">
              <Star className="w-4 h-4 mr-2" />
              Favorites
            </TabsTrigger>
            <TabsTrigger value="trades" className="text-white">
              <History className="w-4 h-4 mr-2" />
              Trades
            </TabsTrigger>
          </TabsList>
          <TabsContent value="images" className="mt-0">
            <ImageGallery />
          </TabsContent>
          <TabsContent value="cards" className="mt-0">
            <CardGallery />
          </TabsContent>
          <TabsContent value="favorites" className="mt-0">
            <FavoritesGallery />
          </TabsContent>
          <TabsContent value="trades" className="mt-0">
            <TradeHistory />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}