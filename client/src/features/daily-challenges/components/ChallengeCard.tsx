import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, CheckCircle2, Clock } from "lucide-react";
import { DailyChallenge } from "../types";
import { useDailyChallenges } from "../hooks/use-daily-challenges";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ChallengeCardProps {
  challenge: DailyChallenge;
}

export function ChallengeCard({ challenge }: ChallengeCardProps) {
  const { checkProgress, isChecking } = useDailyChallenges();
  const progress = (challenge.currentProgress / challenge.requiredCount) * 100;

  const timeLeft = new Date(challenge.expiresAt).getTime() - Date.now();
  const hoursLeft = Math.max(0, Math.floor(timeLeft / (1000 * 60 * 60)));

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <Card className={cn(
        "backdrop-blur-sm border-purple-500/20 overflow-hidden transition-colors",
        challenge.completed ? "bg-gradient-to-r from-green-500/10 to-emerald-500/10" : "bg-black/30",
      )}>
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg text-white">
                  {challenge.title}
                </h3>
                {challenge.completed ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 10 }}
                  >
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                  </motion.div>
                ) : (
                  <div className="flex items-center gap-1 text-purple-200/60 text-sm">
                    <Clock className="w-4 h-4" />
                    <span>{hoursLeft}h left</span>
                  </div>
                )}
              </div>

              <p className="text-sm text-purple-200/80">{challenge.description}</p>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-purple-200">Progress</span>
                  <span className="text-purple-200">
                    {challenge.currentProgress}/{challenge.requiredCount}
                  </span>
                </div>
                <div className="relative">
                  <Progress value={progress} className="h-2" />
                  {progress > 0 && progress < 100 && (
                    <motion.div
                      className="absolute top-0 left-0 w-full h-full overflow-hidden"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0.2, 0.5, 0.2] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <div className="h-full bg-white/20 w-1" style={{ marginLeft: `${progress}%` }} />
                    </motion.div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-3">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="flex items-center gap-1 text-purple-300 bg-purple-500/10 px-3 py-1.5 rounded-md"
              >
                <Sparkles className="w-4 h-4" />
                <span className="font-medium">{challenge.creditReward}</span>
              </motion.div>

              {!challenge.completed && challenge.currentProgress > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => checkProgress(challenge.id)}
                  disabled={isChecking || challenge.completed}
                  className={cn(
                    "relative overflow-hidden",
                    "text-purple-200 border-purple-500/30 hover:bg-purple-500/20",
                    "after:absolute after:inset-0 after:bg-gradient-to-r after:from-transparent after:via-white/20 after:to-transparent after:-translate-x-full",
                    "hover:after:animate-shimmer"
                  )}
                >
                  {isChecking ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Verify Progress"
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}