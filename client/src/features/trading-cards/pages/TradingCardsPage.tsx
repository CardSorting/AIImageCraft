import { useEffect } from "react";
import { useLocation } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Library, History } from "lucide-react";
import Header from "@/components/Header";
import { CardGallery } from "@/features/gallery/components/CardGallery";
import { TradeHistory } from "@/features/gallery/components/TradeHistory";
import { CreateTradingCard } from "@/features/trading-cards/components/CreateTradingCard";

export default function TradingCardsPage() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const action = searchParams.get("action");
  const imageId = searchParams.get("imageId");

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl md:text-6xl font-bold text-white text-center mb-8 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
          Trading Cards
        </h1>
        <Tabs defaultValue="collection" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
            <TabsTrigger value="collection" className="text-white">
              <Library className="w-4 h-4 mr-2" />
              Collection
            </TabsTrigger>
            <TabsTrigger value="trades" className="text-white">
              <History className="w-4 h-4 mr-2" />
              Trades
            </TabsTrigger>
          </TabsList>
          <TabsContent value="collection" className="mt-0">
            <CardGallery />
          </TabsContent>
          <TabsContent value="trades" className="mt-0">
            <TradeHistory />
          </TabsContent>
        </Tabs>
      </div>

      {action === "create" && imageId && (
        <CreateTradingCard
          imageId={parseInt(imageId)}
          open={true}
          onOpenChange={() => {
            // Remove the query parameters when closing the modal
            window.history.replaceState({}, '', '/cards');
          }}
        />
      )}
    </div>
  );
}