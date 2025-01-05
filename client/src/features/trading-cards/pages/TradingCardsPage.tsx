import { useEffect } from "react";
import { useLocation } from "wouter";
import Header from "@/components/Header";
import { CardGallery } from "@/features/gallery/components/CardGallery";
import { CardPacks } from "@/features/trading-cards/components/CardPacks";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, Library } from "lucide-react";

export default function TradingCardsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl md:text-6xl font-bold text-white text-center mb-8 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
          Card Collection
        </h1>

        <Tabs defaultValue="collection" className="space-y-8">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
            <TabsTrigger value="collection" className="flex items-center gap-2">
              <Library className="h-4 w-4" />
              Collection
            </TabsTrigger>
            <TabsTrigger value="packs" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Card Packs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="collection">
            <CardGallery />
          </TabsContent>

          <TabsContent value="packs">
            <CardPacks />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}