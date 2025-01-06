import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Sparkles } from "lucide-react";
import { ELEMENTAL_TYPES, RARITIES } from "../types";
import { queryClient } from "@/lib/queryClient";

const formSchema = z.object({
  name: z.string().min(1, "Card name is required"),
  description: z.string().min(10, "Story must be at least 10 characters long"),
});

interface CreateTradingCardProps {
  imageId: number;
  imageUrl: string;
  onSuccess?: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function generateRandomStats() {
  return {
    attack: Math.floor(Math.random() * 100) + 1,
    defense: Math.floor(Math.random() * 100) + 1,
    speed: Math.floor(Math.random() * 100) + 1,
    magic: Math.floor(Math.random() * 100) + 1,
  };
}

export default function CreateTradingCard({
  imageId,
  imageUrl,
  onSuccess,
  open,
  onOpenChange,
}: CreateTradingCardProps) {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const { mutate: createCard, isPending } = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      // Generate random attributes
      const elementalType = ELEMENTAL_TYPES[Math.floor(Math.random() * ELEMENTAL_TYPES.length)];
      const rarity = RARITIES[Math.floor(Math.random() * RARITIES.length)];
      const powerStats = generateRandomStats();

      const res = await fetch("/api/trading-cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageId,
          name: values.name,
          description: values.description,
          elementalType,
          rarity,
          powerStats,
        }),
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Trading card created!",
        description: "Your image has been transformed into a trading card.",
      });
      form.reset();
      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: ["/api/trading-cards"] });
      queryClient.invalidateQueries({
        queryKey: [`/api/trading-cards/check-image/${imageId}`],
      });
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error creating trading card",
        description: error.message,
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-black/80 border-purple-500/20 text-white">
        <DialogHeader>
          <DialogTitle>Create Trading Card</DialogTitle>
          <DialogDescription className="text-purple-300/70">
            Transform your AI-generated image into a unique trading card with random stats and attributes.
          </DialogDescription>
        </DialogHeader>

        <div className="mb-4">
          <img
            src={imageUrl}
            alt="Card preview"
            className="w-full h-48 object-cover rounded-lg"
          />
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit((values) => createCard(values))} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Card Name</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      className="bg-purple-950/30 border-purple-500/30 text-white"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Story / Flavor Text</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      className="bg-purple-950/30 border-purple-500/30 text-white resize-none"
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              disabled={isPending}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Create Trading Card
                </>
              )}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}