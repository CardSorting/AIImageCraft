import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchCredits } from "../api/credits";
import { useToast } from "@/hooks/use-toast";

export interface CreditPackage {
  id: string;
  credits: number;
  price: number;
}

// Credit packages configuration
const creditPackages: CreditPackage[] = [
  { id: 'basic', credits: 100, price: 499 }, // $4.99
  { id: 'plus', credits: 500, price: 1999 }, // $19.99
  { id: 'pro', credits: 1200, price: 3999 }, // $39.99
];

interface PurchaseCreditsResponse {
  clientSecret: string;
  packageDetails: CreditPackage;
}

export function useCredits() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/credits"],
    queryFn: fetchCredits,
  });

  const purchaseMutation = useMutation({
    mutationFn: async ({ packageId }: { packageId: string }): Promise<PurchaseCreditsResponse> => {
      const response = await fetch('/api/credits/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId }),
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
    packages: creditPackages,
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