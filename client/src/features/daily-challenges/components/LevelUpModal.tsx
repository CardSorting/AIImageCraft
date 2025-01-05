import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trophy, Star, Gift, Crown, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";

interface Reward {
  id: number;
  milestone: {
    level: number;
    rewardType: string;
    rewardValue: any;
    description: string;
  };
  claimed: boolean;
  claimedAt: string | null;
}

interface RewardResponse {
  success: boolean;
  reward: Reward;
}

export function LevelUpModal() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: rewards = [], isLoading } = useQuery<Reward[]>({
    queryKey: ["/api/rewards"],
    onSettled: (data) => {
      if (data && data.length > 0) {
        setOpen(true);
      }
    },
  });

  const { mutate: claimReward } = useMutation<RewardResponse, Error, number>({
    mutationFn: async (rewardId: number) => {
      const res = await fetch(`/api/rewards/${rewardId}/claim`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rewards"] });
      queryClient.invalidateQueries({ queryKey: ["/api/xp/progress"] });
      toast({
        title: "Reward Claimed!",
        description: "Your reward has been added to your account.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error claiming reward",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading || rewards.length === 0) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            <motion.div className="flex flex-col items-center">
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  rotate: [0, 15, -15, 0],
                }}
                transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1 }}
                className="relative mb-4"
              >
                <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                  <Trophy className="w-8 h-8 text-white" />
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 rounded-full border-2 border-yellow-400/30"
                  />
                </div>
                <Crown className="w-6 h-6 text-yellow-400 absolute -top-2 -right-2" />
              </motion.div>
              <h2 className="text-2xl font-bold text-white">Level Up!</h2>
              <p className="text-sm text-purple-200/70 mt-1">
                You've reached Level {rewards[0].milestone.level}
              </p>
            </motion.div>
          </DialogTitle>
        </DialogHeader>

        <div className="py-6">
          <div className="space-y-4">
            {rewards.map((reward) => (
              <motion.div
                key={reward.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative p-4 rounded-lg bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 bg-[url('/patterns/grid.svg')] opacity-5 rounded-lg"
                />
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                      <Gift className="w-5 h-5 text-yellow-400" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-white">
                      {reward.milestone.description}
                    </h3>
                    <div className="flex items-center gap-1 mt-1 text-sm text-yellow-300">
                      <Sparkles className="w-4 h-4" />
                      <span>
                        {reward.milestone.rewardType === "CREDITS" &&
                          `${reward.milestone.rewardValue} credits`}
                      </span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => claimReward(reward.id)}
                    className="flex-shrink-0"
                  >
                    <Star className="w-4 h-4 mr-1" />
                    Claim
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}