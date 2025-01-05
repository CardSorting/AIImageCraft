import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Package, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface CardPack {
  id: number;
  name: string;
  description: string | null;
  createdAt: string;
  cards: Array<{
    id: number;
    name: string;
    image: { url: string };
    elementalType: string;
    rarity: string;
  }>;
}

export function CardPacks() {
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const { data: cardPacks, isLoading, error } = useQuery<CardPack[]>({
    queryKey: ["/api/card-packs"],
    retry: false
  });

  const { mutate: createPack, isPending: isCreatePending } = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch("/api/card-packs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          description: formData.get("description"),
        }),
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Card pack created!",
        description: "Your new card pack is ready for cards.",
      });
      setIsCreating(false);
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error creating card pack",
        description: error.message,
      });
    },
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
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="w-24 h-24 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
          <Package className="w-12 h-12 text-red-400" />
        </div>
        <h2 className="text-2xl font-semibold text-white mb-2">
          Error Loading Card Packs
        </h2>
        <p className="text-purple-300/70 mb-6 max-w-md">
          {error instanceof Error ? error.message : "Failed to load card packs"}
        </p>
      </div>
    );
  }

  if (!cardPacks?.length) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="w-24 h-24 rounded-full bg-purple-500/10 flex items-center justify-center mb-6">
          <Package className="w-12 h-12 text-purple-400" />
        </div>
        <h2 className="text-2xl font-semibold text-white mb-2">
          No card packs yet
        </h2>
        <p className="text-purple-300/70 mb-6 max-w-md">
          Create your first card pack to start organizing your collection!
        </p>
        <Button
          onClick={() => setIsCreating(true)}
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Card Pack
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Your Card Packs</h2>
        <Button
          onClick={() => setIsCreating(true)}
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Pack
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cardPacks.map((pack) => (
          <Card
            key={pack.id}
            className="p-6 bg-black/30 border-purple-500/20 backdrop-blur-sm"
          >
            <h3 className="text-lg font-semibold text-white mb-2">{pack.name}</h3>
            {pack.description && (
              <p className="text-purple-300/70 text-sm mb-4">{pack.description}</p>
            )}
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-purple-400" />
              <span className="text-purple-300/70 text-sm">
                {pack.cards?.length || 0} / 10 cards
              </span>
            </div>
          </Card>
        ))}
      </div>

      {/* Create Pack Dialog */}
      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent className="sm:max-w-[425px] bg-black/80 border-purple-500/20 text-white">
          <DialogHeader>
            <DialogTitle>Create Card Pack</DialogTitle>
            <DialogDescription className="text-purple-300/70">
              Create a new pack to organize your trading cards. Each pack can hold up to 10 cards.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              createPack(new FormData(e.currentTarget));
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <label className="text-sm font-medium text-white">Pack Name</label>
              <Input
                name="name"
                required
                className="bg-purple-950/30 border-purple-500/30 text-white"
                placeholder="Enter pack name..."
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white">Description</label>
              <Textarea
                name="description"
                className="bg-purple-950/30 border-purple-500/30 text-white resize-none"
                placeholder="Enter pack description..."
                rows={3}
              />
            </div>

            <Button
              type="submit"
              disabled={isCreatePending}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              {isCreatePending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Create Pack
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}