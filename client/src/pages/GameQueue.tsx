import { useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import Header from "@/components/Header";
import { useToast } from "@/hooks/use-toast";

export default function GameQueue() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Start matchmaking
  const matchMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/matchmaking", {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      return res.json();
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
  const { data: game, error } = useQuery({
    queryKey: ["/api/matchmaking/status"],
    enabled: matchMutation.isSuccess,
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
    if (game?.gameId) {
      setLocation(`/games/${game.gameId}`);
    }
  }, [game?.gameId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-8 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
            Finding a Match
          </h1>
          <div className="flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-purple-400" />
            <p className="text-lg text-purple-200">
              Looking for another player with enough cards...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
