import { useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import Header from "@/components/Header";
import { useToast } from "@/hooks/use-toast";

interface MatchmakingResponse {
  gameId: number | null;
}

export default function GameQueue() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Start matchmaking with AI
  const matchMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/matchmaking", {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      return res.json() as Promise<MatchmakingResponse>;
    },
    onSuccess: (data) => {
      if (data.gameId) {
        setLocation(`/games/${data.gameId}`);
      }
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Matchmaking failed",
        description: error.message,
      });
      setLocation("/gallery");
    },
  });

  // Check game status
  const { data: gameStatus } = useQuery<MatchmakingResponse>({
    queryKey: ["/api/matchmaking/status"],
    enabled: matchMutation.isSuccess && !matchMutation.data?.gameId,
    refetchInterval: (data) => {
      // Stop polling once we have a game ID
      return data?.gameId ? false : 1000;
    },
  });

  useEffect(() => {
    // Start matchmaking immediately
    matchMutation.mutate();
  }, []);

  useEffect(() => {
    if (gameStatus?.gameId) {
      setLocation(`/games/${gameStatus.gameId}`);
    }
  }, [gameStatus?.gameId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-8 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
            Starting AI Battle
          </h1>
          <div className="flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-purple-400" />
            <p className="text-lg text-purple-200">
              Preparing your deck and creating an AI opponent...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}