import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
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
import { useToast } from "@/hooks/use-toast";
import { Loader2, Package } from "lucide-react";

const formSchema = z.object({
  price: z.string().refine((val) => {
    const num = parseInt(val);
    return !isNaN(num) && num > 0;
  }, "Price must be a positive number"),
});

interface ListPackModalProps {
  packId: number;
  packName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ListPackModal({
  packId,
  packName,
  open,
  onOpenChange,
}: ListPackModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      price: "",
    },
  });

  const { mutate: listPack, isPending } = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      const res = await fetch("/api/marketplace/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packId,
          price: parseInt(values.price),
        }),
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Pack listed successfully!",
        description: "Your pack is now available in the marketplace.",
      });
      form.reset();
      onOpenChange(false);
      // Invalidate both card packs and marketplace listings queries
      queryClient.invalidateQueries({ queryKey: ["/api/card-packs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/marketplace/listings"] });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error listing pack",
        description: error.message,
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-black/80 border-purple-500/20 text-white">
        <DialogHeader>
          <DialogTitle>List Pack for Sale</DialogTitle>
          <DialogDescription className="text-purple-300/70">
            Set a price for your card pack "{packName}" to list it in the marketplace.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit((values) => listPack(values))} className="space-y-4">
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price (in Pulse credits)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      min="1"
                      placeholder="Enter price"
                      className="bg-purple-950/30 border-purple-500/30 text-white"
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
                  Listing...
                </>
              ) : (
                <>
                  <Package className="mr-2 h-4 w-4" />
                  List Pack
                </>
              )}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
