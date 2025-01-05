import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import Header from "@/components/Header";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Sparkles, Wand2 } from "lucide-react";

export default function CreateTradingCardPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const searchParams = new URLSearchParams(window.location.search);
  const imageId = searchParams.get("imageId");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchImage = async () => {
      if (!imageId) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "No image ID provided",
        });
        setLocation("/cards");
        return;
      }

      try {
        const res = await fetch(`/api/images/${imageId}`, {
          credentials: 'include',
        });

        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(errorText || "Failed to fetch image");
        }

        const data = await res.json();
        setImageUrl(data.url);
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message || "Failed to load image details",
        });
        setLocation("/cards");
      }
    };

    fetchImage();
  }, [imageId, setLocation, toast]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!imageId || !imageUrl) return;

    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);

    try {
      const cardData = {
        imageId: parseInt(imageId),
        name: formData.get("name")?.toString(),
        description: formData.get("description")?.toString(),
        elementalType: formData.get("elementalType")?.toString(),
      };

      // Validate required fields
      if (!cardData.name || !cardData.description || !cardData.elementalType) {
        throw new Error("All fields are required");
      }

      const res = await fetch("/api/trading-cards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: 'include',
        body: JSON.stringify(cardData),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Failed to create trading card");
      }

      await queryClient.invalidateQueries({ queryKey: ["/api/trading-cards"] });

      toast({
        title: "✨ Card Created Successfully",
        description: "Your magical trading card has been forged!",
        className: "bg-gradient-to-r from-purple-600 to-blue-600 text-white",
      });

      setLocation("/cards");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error creating card",
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <Wand2 className="h-8 w-8 text-purple-400" />
            <h1 className="text-4xl font-bold text-white">Forge Your Trading Card</h1>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Card Preview Section */}
            <Card className="p-6 bg-black/30 border-purple-500/20 backdrop-blur-sm">
              <div className="aspect-[3/4] relative overflow-hidden rounded-lg border-2 border-purple-500/30">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt="Card artwork"
                    className="w-full h-full object-cover transition-transform hover:scale-105 duration-300"
                  />
                ) : (
                  <div className="w-full h-full bg-purple-500/10 rounded-lg flex items-center justify-center">
                    <Loader2 className="h-8 w-8 text-purple-300/70 animate-spin" />
                  </div>
                )}
              </div>
              <div className="mt-4">
                <p className="text-purple-300/70 text-sm">
                  The card's rarity, elemental type, and power stats will be randomly generated upon creation, making each card unique!
                </p>
              </div>
            </Card>

            {/* Form Section */}
            <Card className="p-6 bg-black/30 border-purple-500/20 backdrop-blur-sm">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-white text-lg">Card Name</Label>
                  <Input
                    id="name"
                    name="name"
                    required
                    placeholder="Enter a mystical name..."
                    className="bg-white/10 border-purple-500/20 text-white placeholder:text-purple-300/50 focus:border-purple-400/50 transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-white text-lg">Card Lore</Label>
                  <Textarea
                    id="description"
                    name="description"
                    required
                    placeholder="Write the mystical story behind your card..."
                    className="bg-white/10 border-purple-500/20 text-white placeholder:text-purple-300/50 focus:border-purple-400/50 transition-colors min-h-[120px] resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="elementalType" className="text-white text-lg">Elemental Affinity</Label>
                  <select
                    id="elementalType"
                    name="elementalType"
                    required
                    className="w-full h-10 rounded-md border border-purple-500/20 bg-white/10 px-3 py-2 text-white focus:border-purple-400/50 transition-colors"
                  >
                    <option value="Fire">Fire</option>
                    <option value="Water">Water</option>
                    <option value="Earth">Earth</option>
                    <option value="Air">Air</option>
                    <option value="Light">Light</option>
                    <option value="Dark">Dark</option>
                  </select>
                </div>

                <div className="flex justify-end gap-4 pt-4">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setLocation("/cards")}
                    className="text-white hover:bg-purple-500/20"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 transition-all duration-300 transform hover:-translate-y-1"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Forging...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Forge Card
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}