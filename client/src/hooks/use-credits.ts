import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";

export type CreditPackage = {
  id: string;
  credits: number;
  price: number;
};

export function useCredits() {
  const { data, isLoading, error } = useQuery<{ credits: number }>({
    queryKey: ["/api/credits"],
  });

  const { data: packages } = useQuery<{ packages: CreditPackage[] }>({
    queryKey: ["/api/credits/packages"],
  });

  const queryClient = useQueryClient();

  const purchaseMutation = useMutation({
    mutationFn: async ({ packageId }: { packageId: string }) => {
      const res = await fetch("/api/credits/purchase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ packageId }),
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      return res.json();
    },
    onError: (error: Error) => {
      toast({
        title: "Purchase Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const completePurchaseMutation = useMutation({
    mutationFn: async ({ paymentIntentId }: { paymentIntentId: string }) => {
      const res = await fetch("/api/credits/purchase/complete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ paymentIntentId }),
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/credits"] });
      toast({
        title: "Purchase Successful",
        description: "Credits have been added to your account",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Purchase Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    credits: data?.credits ?? 0,
    packages: packages?.packages ?? [],
    isLoading,
    error,
    purchaseCredits: purchaseMutation.mutate,
    completePurchase: completePurchaseMutation.mutate,
  };
}