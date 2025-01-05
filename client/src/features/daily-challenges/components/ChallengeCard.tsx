import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, CheckCircle2, Clock, ArrowRight, Lock, Star } from "lucide-react";
import { DailyChallenge } from "../types";
import { useDailyChallenges } from "../hooks/use-daily-challenges";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface ChallengeCardProps {
  challenge: DailyChallenge;
}

export function ChallengeCard({ challenge }: ChallengeCardProps) {
  const { checkProgress, isChecking } = useDailyChallenges();
  const [isHovered, setIsHovered] = useState(false);
  const progress = (challenge.currentProgress / challenge.requiredCount) * 100;

  const timeLeft = new Date(challenge.expiresAt).getTime() - Date.now();
  const hoursLeft = Math.max(0, Math.floor(timeLeft / (1000 * 60 * 60)));

  const getStatusIcon = () => {
    if (challenge.completed) {
      return (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="relative w-8 h-8"
        >
          <div className="absolute inset-0 bg-green-500/20 rounded-full" />
          <div className="absolute inset-0 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-green-400" />
          </div>
          <motion.div
            animate={{ scale: [1, 1.5], opacity: [1, 0] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="absolute inset-0 bg-green-500/20 rounded-full"
          />
        </motion.div>
      );
    }
    if (hoursLeft === 0) {
      return (
        <div className="relative w-8 h-8">
          <div className="absolute inset-0 bg-red-500/20 rounded-full" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Lock className="w-5 h-5 text-red-400" />
          </div>
        </div>
      );
    }
    return (
      <div className="relative w-8 h-8">
        <div className="absolute inset-0 bg-purple-500/20 rounded-full" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Clock className="w-5 h-5 text-purple-400" />
        </div>
      </div>
    );
  };

  return (
    <motion.div
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ scale: 1.01 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <Card className={cn(
        "backdrop-blur-sm border-purple-500/20 overflow-hidden transition-all duration-300",
        challenge.completed ? "bg-gradient-to-r from-green-500/10 to-emerald-500/10" : "bg-black/30",
        isHovered && !challenge.completed && "bg-gradient-to-r from-purple-500/10 to-blue-500/10"
      )}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 bg-[url('/patterns/grid.svg')] opacity-5"
        />
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-3">
                {getStatusIcon()}
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-white group-hover:text-purple-300 transition-colors">
                    {challenge.title}
                  </h3>
                  {!challenge.completed && hoursLeft > 0 && (
                    <div className="flex items-center gap-1 text-purple-200/60 text-sm mt-0.5">
                      <Clock className="w-4 h-4" />
                      <span>{hoursLeft}h left</span>
                    </div>
                  )}
                </div>
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
                  <Progress 
                    value={progress} 
                    className={cn(
                      "h-2",
                      challenge.completed ? "bg-green-950/50" : "bg-purple-950/50"
                    )} 
                  />
                  {progress > 0 && (
                    <motion.div
                      className="absolute top-0 left-0 h-full overflow-hidden"
                      initial={{ width: "0%" }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                    >
                      <motion.div 
                        animate={{ x: ["-100%", "100%"] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent w-1/2"
                      />
                    </motion.div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-3">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className={cn(
                  "flex items-center gap-1 px-3 py-1.5 rounded-md relative group",
                  challenge.completed ? "bg-green-500/20 text-green-300" : "bg-purple-500/20 text-purple-300"
                )}
              >
                <Sparkles className="w-4 h-4 group-hover:animate-spin" />
                <span className="font-medium">{challenge.creditReward}</span>
                {challenge.completed && (
                  <Star className="w-3 h-3 absolute -top-1 -right-1 text-yellow-400" />
                )}
              </motion.div>

              <AnimatePresence>
                {!challenge.completed && challenge.currentProgress > 0 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => checkProgress(challenge.id)}
                      disabled={isChecking || challenge.completed}
                      className={cn(
                        "relative group overflow-hidden",
                        "text-purple-200 border-purple-500/30 hover:bg-purple-500/20",
                        "transition-all duration-300"
                      )}
                    >
                      {isChecking ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <span>Verify Progress</span>
                          <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                        </>
                      )}
                      <motion.div
                        initial={{ x: "-100%" }}
                        animate={{ x: "100%" }}
                        transition={{ duration: 1, repeat: Infinity }}
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                      />
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}