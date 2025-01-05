import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchCredits, generateReferralCode, getReferralCode, useReferralCode } from "../api/credits";
import { useToast } from "@/hooks/use-toast";

export function useCredits() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/credits"],
    queryFn: fetchCredits,
  });

  return {
    credits: data?.credits ?? 0,
    isLoading,
    error,
  };
}

export function useReferral() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: referralCode, isLoading: isLoadingCode } = useQuery({
    queryKey: ["/api/referral/code"],
    queryFn: getReferralCode,
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

  const useMutation = useMutation({
    mutationFn: useReferralCode,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/credits"] });
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
    isLoadingCode,
    generateReferralCode: generateMutation.mutate,
    isGenerating: generateMutation.isPending,
    useReferralCode: useMutation.mutate,
    isUsing: useMutation.isPending,
  };
}
