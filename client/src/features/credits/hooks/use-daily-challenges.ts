import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchDailyChallenges, completeChallenge, checkChallengeProgress } from "../api/credits";
import { useToast } from "@/hooks/use-toast";

export function useDailyChallenges() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { 
    data: challengesData,
    isLoading,
    error
  } = useQuery({
    queryKey: ["/api/challenges/daily"],
    queryFn: fetchDailyChallenges,
    refetchInterval: 60000, // Refresh every minute to update progress
  });

  const completeMutation = useMutation({
    mutationFn: completeChallenge,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/challenges/daily"] });
      queryClient.invalidateQueries({ queryKey: ["/api/credits"] });
      
      toast({
        title: "Challenge Completed!",
        description: `${data.message} (+${data.creditsAwarded} Pulse)`,
        className: "bg-gradient-to-r from-purple-600 to-blue-600 text-white",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Failed to complete challenge",
        description: error.message,
      });
    },
  });

  const checkProgressMutation = useMutation({
    mutationFn: checkChallengeProgress,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/challenges/daily"] });
      
      if (data.completed) {
        completeMutation.mutate(data.id);
      }
    },
  });

  return {
    challenges: challengesData?.challenges ?? [],
    totalEarnedToday: challengesData?.totalEarnedToday ?? 0,
    maxDailyEarnings: challengesData?.maxDailyEarnings ?? 0,
    isLoading,
    error,
    completeChallenge: completeMutation.mutate,
    checkProgress: checkProgressMutation.mutate,
    isCompleting: completeMutation.isPending,
    isChecking: checkProgressMutation.isPending,
  };
}
