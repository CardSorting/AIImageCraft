import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import Header from "@/components/Header";
import ImageCard from "@/components/ImageCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, ImagePlus, Library } from "lucide-react";

interface Image {
  id: number;
  url: string;
  prompt: string;
  tags: string[];
  createdAt: string;
}

interface TradingCard {
  id: number;
  name: string;
  description: string;
  elementalType: string;
  rarity: string;
  powerStats: {
    attack: number;
    defense: number;
    speed: number;
    magic: number;
  };
  image: {
    url: string;
  };
  createdAt: string;
}

function ImageGallery() {
  const { data: images, isLoading } = useQuery<Image[]>({
    queryKey: ["/api/images"],
  });

  if (isLoading) {
    return (
      <div className="flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
      </div>
    );
  }

  if (!images?.length) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="w-24 h-24 rounded-full bg-purple-500/10 flex items-center justify-center mb-6">
          <ImagePlus className="w-12 h-12 text-purple-400" />
        </div>
        <h2 className="text-2xl font-semibold text-white mb-2">
          Your gallery is empty
        </h2>
        <p className="text-purple-300/70 mb-6 max-w-md">
          Start creating amazing AI-generated images with just a text prompt!
        </p>
        <Link href="/create">
          <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
            <ImagePlus className="mr-2 h-4 w-4" />
            Create Your First Image
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {images.map((image) => (
        <ImageCard 
          key={image.id}
          imageId={image.id}
          imageUrl={image.url}
          tags={image.tags}
        />
      ))}
    </div>
  );
}

function TradingCardGallery() {
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
          No trading cards yet
        </h2>
        <p className="text-purple-300/70 mb-6 max-w-md">
          Transform your AI-generated images into unique trading cards with special attributes and powers!
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {cards.map((card) => (
        <div key={card.id} className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-lg transform -rotate-1 group-hover:rotate-0 transition-all duration-300" />
          <div className="card-container relative bg-black/40 backdrop-blur-sm border border-purple-500/20 rounded-lg p-4 transform rotate-1 group-hover:rotate-0 transition-all duration-300">
            <img
              src={card.image.url}
              alt={card.name}
              className="w-full h-48 object-cover rounded-lg mb-4"
            />
            <h3 className="text-xl font-bold text-white mb-2">{card.name}</h3>
            <p className="text-purple-300/70 text-sm italic mb-4">
              {card.description}
            </p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="bg-purple-500/10 p-2 rounded">
                <span className="text-purple-300">Type:</span>
                <span className="text-white ml-2">{card.elementalType}</span>
              </div>
              <div className="bg-purple-500/10 p-2 rounded">
                <span className="text-purple-300">Rarity:</span>
                <span className="text-white ml-2">{card.rarity}</span>
              </div>
              <div className="col-span-2">
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className="text-purple-300">ATK: {card.powerStats.attack}</div>
                  <div className="text-purple-300">DEF: {card.powerStats.defense}</div>
                  <div className="text-purple-300">SPD: {card.powerStats.speed}</div>
                  <div className="text-purple-300">MAG: {card.powerStats.magic}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Gallery() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl md:text-6xl font-bold text-white text-center mb-8 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
          Your Collection
        </h1>

        <Tabs defaultValue="images" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
            <TabsTrigger value="images" className="text-white">
              <ImagePlus className="w-4 h-4 mr-2" />
              Images
            </TabsTrigger>
            <TabsTrigger value="cards" className="text-white">
              <Library className="w-4 h-4 mr-2" />
              Trading Cards
            </TabsTrigger>
          </TabsList>
          <TabsContent value="images" className="mt-0">
            <ImageGallery />
          </TabsContent>
          <TabsContent value="cards" className="mt-0">
            <TradingCardGallery />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}