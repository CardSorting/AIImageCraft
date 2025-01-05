import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import { useQueryClient } from "@tanstack/react-query";

export default function CreateTradingCardPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const searchParams = new URLSearchParams(window.location.search);
  const imageId = searchParams.get("imageId");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Fetch image details when component mounts
    const fetchImage = async () => {
      try {
        const res = await fetch(`/api/images/${imageId}`);
        if (!res.ok) throw new Error("Failed to fetch image");
        const data = await res.json();
        setImageUrl(data.url);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load image details",
        });
        setLocation("/cards");
      }
    };

    if (imageId) {
      fetchImage();
    }
  }, [imageId, setLocation, toast]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!imageId || !imageUrl) return;

    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    
    try {
      const res = await fetch("/api/trading-cards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageId: parseInt(imageId),
          name: formData.get("name"),
          description: formData.get("description"),
          elementalType: formData.get("elementalType"),
          rarity: formData.get("rarity"),
        }),
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      await queryClient.invalidateQueries({ queryKey: ["/api/trading-cards"] });
      
      toast({
        title: "Success",
        description: "Trading card created successfully",
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

  if (!imageId || !imageUrl) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-white mb-8">Create Trading Card</h1>
        
        <div className="grid md:grid-cols-2 gap-8">
          <Card className="p-6 bg-black/30 border-purple-500/20">
            <img
              src={imageUrl}
              alt="Card artwork"
              className="w-full aspect-square object-cover rounded-lg"
            />
          </Card>

          <Card className="p-6 bg-black/30 border-purple-500/20">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-white">Card Name</Label>
                <Input
                  id="name"
                  name="name"
                  required
                  className="bg-white/10 border-purple-500/20 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-white">Description</Label>
                <Input
                  id="description"
                  name="description"
                  required
                  className="bg-white/10 border-purple-500/20 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="elementalType" className="text-white">Elemental Type</Label>
                <select
                  id="elementalType"
                  name="elementalType"
                  required
                  className="w-full h-10 rounded-md border border-purple-500/20 bg-white/10 px-3 py-2 text-white"
                >
                  <option value="Fire">Fire</option>
                  <option value="Water">Water</option>
                  <option value="Earth">Earth</option>
                  <option value="Air">Air</option>
                  <option value="Light">Light</option>
                  <option value="Dark">Dark</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="rarity" className="text-white">Rarity</Label>
                <select
                  id="rarity"
                  name="rarity"
                  required
                  className="w-full h-10 rounded-md border border-purple-500/20 bg-white/10 px-3 py-2 text-white"
                >
                  <option value="Common">Common</option>
                  <option value="Uncommon">Uncommon</option>
                  <option value="Rare">Rare</option>
                  <option value="Epic">Epic</option>
                  <option value="Legendary">Legendary</option>
                </select>
              </div>

              <div className="flex justify-end gap-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setLocation("/cards")}
                  className="text-white"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  Create Card
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
