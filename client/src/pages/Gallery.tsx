import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, ImagePlus, Library } from "lucide-react";
import ImageGrid from "@/components/ImageGrid";
import { Shield, Swords, Zap, Sparkles } from "lucide-react";

export interface Image {
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
  const { data: images, isLoading, refetch } = useQuery<Image[]>({
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

  return <ImageGrid images={images} onTradingCardCreated={refetch} />;
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
      {cards.map((card) => (
        <div key={card.id} className="relative group perspective-1000">
          {/* Card container with enhanced 3D hover effect */}
          <div className="relative preserve-3d transition-all duration-500 group-hover:rotate-y-10">
            {/* Card frame with improved styling */}
            <div className={`
              relative rounded-xl w-full max-w-[300px] mx-auto aspect-[2.5/3.5] overflow-hidden
              ${getElementalTypeStyle(card.elementalType)}
              transform transition-all duration-300 group-hover:scale-105
              shadow-[0_0_15px_rgba(0,0,0,0.3)] hover:shadow-[0_0_25px_rgba(0,0,0,0.4)]
              before:absolute before:inset-[1px] before:rounded-[10px] before:bg-gradient-to-b before:from-white/10 before:to-transparent before:z-10
            `}>
              {/* Holographic effect overlay */}
              <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              {/* Card content container */}
              <div className="relative h-full bg-gradient-to-b from-black/40 via-black/50 to-black/60 backdrop-blur-sm">
                {/* Card header */}
                <div className="absolute top-0 left-0 right-0 p-3 z-20">
                  <div className="flex justify-between items-start">
                    {/* Card name with decorative underline */}
                    <div className="relative">
                      <h3 className="text-lg font-bold text-white leading-tight tracking-tight">
                        {card.name}
                      </h3>
                      <div className="absolute -bottom-1 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                    </div>
                    {/* Element type badge */}
                    <span className={`
                      px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider
                      ${getElementalTypeBadgeStyle(card.elementalType)}
                      shadow-sm backdrop-blur-sm
                    `}>
                      {card.elementalType}
                    </span>
                  </div>
                </div>

                {/* Card image section with improved framing */}
                <div className="relative h-[60%] mt-12 mx-4">
                  {/* Decorative corner frames with enhanced styling */}
                  <div className="absolute top-0 left-0 w-8 h-8">
                    <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-white/60 to-transparent" />
                    <div className="absolute top-0 left-0 h-full w-[2px] bg-gradient-to-b from-white/60 to-transparent" />
                  </div>
                  <div className="absolute top-0 right-0 w-8 h-8">
                    <div className="absolute top-0 right-0 w-full h-[2px] bg-gradient-to-l from-white/60 to-transparent" />
                    <div className="absolute top-0 right-0 h-full w-[2px] bg-gradient-to-b from-white/60 to-transparent" />
                  </div>
                  <div className="absolute bottom-0 left-0 w-8 h-8">
                    <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-white/60 to-transparent" />
                    <div className="absolute bottom-0 left-0 h-full w-[2px] bg-gradient-to-t from-white/60 to-transparent" />
                  </div>
                  <div className="absolute bottom-0 right-0 w-8 h-8">
                    <div className="absolute bottom-0 right-0 w-full h-[2px] bg-gradient-to-l from-white/60 to-transparent" />
                    <div className="absolute bottom-0 right-0 h-full w-[2px] bg-gradient-to-t from-white/60 to-transparent" />
                  </div>

                  {/* Image with enhanced container */}
                  <div className="relative h-full rounded-lg overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10" />
                    <img
                      src={card.image.url}
                      alt={card.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                {/* Card info section with improved layout */}
                <div className="absolute bottom-0 left-0 right-0 p-4 space-y-3">
                  {/* Rarity indicator with enhanced styling */}
                  <div className={`
                    absolute -top-3 right-4 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider
                    ${getRarityStyle(card.rarity)}
                    shadow-lg backdrop-blur-sm border border-white/10
                  `}>
                    {card.rarity}
                  </div>

                  {/* Description box with improved styling */}
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-white/5 via-white/10 to-white/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="relative border border-white/10 rounded-lg bg-black/40 backdrop-blur-sm p-2.5">
                      <p className="text-purple-200/90 text-xs italic line-clamp-2 leading-relaxed">
                        {card.description}
                      </p>
                    </div>
                  </div>

                  {/* Stats grid with improved visual hierarchy */}
                  <div className="grid grid-cols-2 gap-2">
                    <StatDisplay
                      icon={<Swords className="w-4 h-4" />}
                      label="ATK"
                      value={card.powerStats.attack}
                      color="red"
                    />
                    <StatDisplay
                      icon={<Shield className="w-4 h-4" />}
                      label="DEF"
                      value={card.powerStats.defense}
                      color="blue"
                    />
                    <StatDisplay
                      icon={<Zap className="w-4 h-4" />}
                      label="SPD"
                      value={card.powerStats.speed}
                      color="yellow"
                    />
                    <StatDisplay
                      icon={<Sparkles className="w-4 h-4" />}
                      label="MAG"
                      value={card.powerStats.magic}
                      color="purple"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Helper components with enhanced styling
function StatDisplay({ 
  icon, 
  label, 
  value, 
  color 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: number;
  color: 'red' | 'blue' | 'yellow' | 'purple';
}) {
  const colorStyles = {
    red: "from-red-500/20 to-red-500/10 border-red-500/30",
    blue: "from-blue-500/20 to-blue-500/10 border-blue-500/30",
    yellow: "from-yellow-500/20 to-yellow-500/10 border-yellow-500/30",
    purple: "from-purple-500/20 to-purple-500/10 border-purple-500/30",
  };

  return (
    <div className={`
      flex items-center gap-1.5 rounded-lg p-1.5
      bg-gradient-to-r ${colorStyles[color]}
      border border-white/10 backdrop-blur-sm
      transition-colors duration-300 hover:bg-opacity-75
    `}>
      {icon}
      <span className="text-white/70 text-xs font-medium">{label}</span>
      <span className="text-white font-bold text-xs ml-auto">{value}</span>
    </div>
  );
}

function getElementalTypeStyle(type: string): string {
  const styles = {
    Fire: "bg-gradient-to-br from-red-600/20 to-orange-500/20 border-2 border-red-500/30",
    Water: "bg-gradient-to-br from-blue-600/20 to-cyan-500/20 border-2 border-blue-500/30",
    Earth: "bg-gradient-to-br from-green-600/20 to-emerald-500/20 border-2 border-green-500/30",
    Air: "bg-gradient-to-br from-sky-600/20 to-indigo-500/20 border-2 border-sky-500/30",
    Light: "bg-gradient-to-br from-yellow-400/20 to-amber-500/20 border-2 border-yellow-400/30",
    Dark: "bg-gradient-to-br from-purple-600/20 to-violet-500/20 border-2 border-purple-500/30",
    Nature: "bg-gradient-to-br from-lime-600/20 to-green-500/20 border-2 border-lime-500/30",
    Electric: "bg-gradient-to-br from-yellow-400/20 to-amber-500/20 border-2 border-yellow-400/30",
    Ice: "bg-gradient-to-br from-cyan-400/20 to-blue-500/20 border-2 border-cyan-400/30",
    Psychic: "bg-gradient-to-br from-pink-600/20 to-purple-500/20 border-2 border-pink-500/30",
    Metal: "bg-gradient-to-br from-gray-600/20 to-slate-500/20 border-2 border-gray-500/30",
    Dragon: "bg-gradient-to-br from-red-600/20 to-purple-500/20 border-2 border-red-500/30",
  };
  return styles[type as keyof typeof styles] || styles.Nature;
}

function getElementalTypeBadgeStyle(type: string): string {
  const styles = {
    Fire: "bg-red-500/20 text-red-300",
    Water: "bg-blue-500/20 text-blue-300",
    Earth: "bg-green-500/20 text-green-300",
    Air: "bg-sky-500/20 text-sky-300",
    Light: "bg-yellow-400/20 text-yellow-300",
    Dark: "bg-purple-500/20 text-purple-300",
    Nature: "bg-lime-500/20 text-lime-300",
    Electric: "bg-yellow-400/20 text-yellow-300",
    Ice: "bg-cyan-400/20 text-cyan-300",
    Psychic: "bg-pink-500/20 text-pink-300",
    Metal: "bg-gray-500/20 text-gray-300",
    Dragon: "bg-red-500/20 text-red-300",
  };
  return styles[type as keyof typeof styles] || styles.Nature;
}

function getRarityStyle(rarity: string): string {
  const styles = {
    Common: "bg-gray-500/20 text-gray-300",
    Uncommon: "bg-green-500/20 text-green-300",
    Rare: "bg-blue-500/20 text-blue-300",
    Epic: "bg-purple-500/20 text-purple-300",
    Legendary: "bg-orange-500/20 text-orange-300",
    Mythic: "bg-red-500/20 text-red-300",
  };
  return styles[rarity as keyof typeof styles] || styles.Common;
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