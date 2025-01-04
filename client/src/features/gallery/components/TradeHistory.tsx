import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { Trade } from "../types";

export function TradeHistory() {
  const { data: trades, isLoading } = useQuery<Trade[]>({
    queryKey: ["/api/trades"],
  });
  const queryClient = useQueryClient();
  const { toast } = useToast();

  if (isLoading) {
    return (
      <div className="flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
      </div>
    );
  }

  if (!trades?.length) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="w-24 h-24 rounded-full bg-purple-500/10 flex items-center justify-center mb-6">
          <History className="w-12 h-12 text-purple-400" />
        </div>
        <h2 className="text-2xl font-semibold text-white mb-2">
          No trade history yet
        </h2>
        <p className="text-purple-300/70 mb-6 max-w-md">
          Start trading cards with other users to see your trade history here!
        </p>
      </div>
    );
  }

  async function handleTradeResponse(tradeId: number, action: 'accept' | 'reject' | 'cancel') {
    try {
      const res = await fetch(`/api/trades/${tradeId}/respond`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action }),
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      queryClient.invalidateQueries({ queryKey: ["/api/trades"] });
      queryClient.invalidateQueries({ queryKey: ["/api/trading-cards"] });

      toast({
        title: `Trade ${action}ed`,
        description: action === 'accept' ? "Cards have been exchanged!" :
          action === 'reject' ? "Trade offer rejected" :
            "Trade cancelled",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: `Failed to ${action} trade`,
        description: error.message,
      });
    }
  }

  return (
    <div className="space-y-6">
      {trades.map((trade) => (
        <div
          key={trade.id}
          className="p-6 rounded-lg border border-purple-500/20 bg-black/30 backdrop-blur-sm"
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="text-white">
                <span className="text-purple-300/70">From: </span>
                {trade.initiator.username}
                <span className="text-purple-300/70"> To: </span>
                {trade.receiver.username}
              </div>
              {trade.message && (
                <p className="text-purple-300/70 text-sm mt-1">
                  "{trade.message}"
                </p>
              )}
            </div>
            <div className={`
              px-3 py-1 rounded-full text-xs font-bold uppercase
              ${trade.status === 'pending' ? 'bg-yellow-500/20 text-yellow-300' :
                trade.status === 'accepted' ? 'bg-green-500/20 text-green-300' :
                  trade.status === 'rejected' ? 'bg-red-500/20 text-red-300' :
                    'bg-gray-500/20 text-gray-300'}
            `}>
              {trade.status}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            {trade.items.map((item) => (
              <div key={item.card.id} className="flex items-center space-x-4">
                <img
                  src={item.card.image.url}
                  alt={item.card.name}
                  className="w-16 h-16 object-cover rounded-md"
                />
                <div>
                  <div className="text-white font-medium">{item.card.name}</div>
                  <div className="text-purple-300/70 text-sm">
                    Offered by: {item.offerer.username}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {trade.status === 'pending' && (
            <div className="flex justify-end space-x-3">
              <Button
                variant="ghost"
                onClick={() => handleTradeResponse(trade.id, 'cancel')}
                className="text-purple-300/70 hover:text-purple-300"
              >
                Cancel
              </Button>
              <Button
                variant="ghost"
                onClick={() => handleTradeResponse(trade.id, 'reject')}
                className="text-red-300/70 hover:text-red-300"
              >
                Reject
              </Button>
              <Button
                onClick={() => handleTradeResponse(trade.id, 'accept')}
                className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700"
              >
                Accept
              </Button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
