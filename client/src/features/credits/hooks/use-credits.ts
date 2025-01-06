import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchCredits } from "../api/credits";
import { useToast } from "@/hooks/use-toast";

export interface CreditPackage {
  id: string;
  credits: number;
  price: number;
}

interface PurchaseCreditsResponse {
  clientSecret: string;
  packageDetails: {
    credits: number;
    price: number;
  };
}

interface PurchaseCreditsParams {
  packageId: string;
  amount?: number;
  price?: number;
}

export function useCredits() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/credits"],
    queryFn: fetchCredits,
  });

  const purchaseMutation = useMutation({
    mutationFn: async ({ packageId, amount, price }: PurchaseCreditsParams): Promise<PurchaseCreditsResponse> => {
      const response = await fetch('/api/credits/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId, amount, price }),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return response.json();
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Purchase failed",
        description: error.message,
      });
    },
  });

  return {
    credits: data?.credits ?? 0,
    isLoading,
    error,
    purchaseCredits: purchaseMutation.mutateAsync,
    isPurchasing: purchaseMutation.isPending,
  };
}

export function useReferral() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: referralCode, isLoading: isLoadingCode } = useQuery({
    queryKey: ["/api/referral/code"],
    queryFn: getReferralCode,
  });

  const { data: referralStats, isLoading: isLoadingStats } = useQuery({
    queryKey: ["/api/referral/stats"],
    queryFn: getReferralStats,
  });

  const generateMutation = useMutation({
    mutationFn: generateReferralCode,
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/referral/code"], data);
      toast({
        title: "Referral Code Generated",
        description: `Your referral code is: ${data.code}`,
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Failed to generate referral code",
        description: error.message,
      });
    },
  });

  const useReferralMutation = useMutation({
    mutationFn: useReferralCode,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/credits"] });
      queryClient.invalidateQueries({ queryKey: ["/api/referral/stats"] });
      toast({
        title: "Success!",
        description: data.message,
        className: "bg-gradient-to-r from-purple-600 to-blue-600 text-white",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Failed to use referral code",
        description: error.message,
      });
    },
  });

  return {
    referralCode: referralCode?.code,
    referralStats,
    isLoadingCode,
    isLoadingStats,
    generateReferralCode: generateMutation.mutate,
    isGenerating: generateMutation.isPending,
    useReferralCode: useReferralMutation.mutate,
    isUsing: useReferralMutation.isPending,
  };
}

// Placeholder functions -  replace with actual implementations
function getReferralCode() {
  throw new Error("Function not implemented.");
}
function getReferralStats() {
  throw new Error("Function not implemented.");
}
function generateReferralCode() {
  throw new Error("Function not implemented.");
}
function useReferralCode() {
  throw new Error("Function not implemented.");
}