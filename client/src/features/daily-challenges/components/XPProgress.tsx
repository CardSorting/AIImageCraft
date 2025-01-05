import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { Trophy, Star, Crown, Gift } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

interface XPProgressData {
  currentXp: number;
  currentLevel: number;
  totalXpEarned: number;
  xpProgress: number;
  xpRequired: number;
  progressPercentage: number;
  hasLevelUpNotification: boolean;
}

export function XPProgress() {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const { data: xpData, isLoading } = useQuery<XPProgressData>({
    queryKey: ["/api/xp/progress"],
  });

  if (isLoading || !xpData) {
    return null;
  }

  const {
    currentLevel,
    xpProgress,
    xpRequired,
    progressPercentage,
    hasLevelUpNotification,
  } = xpData;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative"
    >
      <Card
        className={cn(
          "relative p-6 backdrop-blur-sm border-purple-500/20 overflow-hidden transition-all duration-300",
          "bg-gradient-to-br from-purple-500/10 to-blue-500/10",
          "hover:from-purple-500/20 hover:to-blue-500/20",
          "cursor-pointer",
          isExpanded && "ring-2 ring-purple-500/30"
        )}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 bg-[url('/patterns/grid.svg')] opacity-5"
        />

        {/* Level Badge */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <motion.div
              className="relative"
              animate={hasLevelUpNotification ? {
                scale: [1, 1.2, 1],
                rotate: [0, 15, -15, 0],
              } : {}}
              transition={{ 
                duration: 0.5,
                repeat: hasLevelUpNotification ? Infinity : 0,
                repeatDelay: 1,
              }}
            >
              <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                <Trophy className="w-6 h-6 text-white" />
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 rounded-full border-2 border-yellow-400/30"
                />
              </div>
              <Crown className="w-4 h-4 text-yellow-400 absolute -top-1 -right-1" />
            </motion.div>
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                Level {currentLevel}
                {hasLevelUpNotification && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex items-center gap-1 text-sm font-normal bg-yellow-500/20 text-yellow-300 px-2 py-0.5 rounded-full"
                  >
                    <Star className="w-3 h-3" />
                    <span>Level Up!</span>
                  </motion.div>
                )}
              </h3>
              <p className="text-sm text-purple-200/70">
                {xpProgress}/{xpRequired} XP to next level
              </p>
            </div>
          </div>
          {hasLevelUpNotification && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-2 text-yellow-300"
            >
              <Gift className="w-5 h-5" />
              <span className="text-sm">Rewards Available!</span>
            </motion.div>
          )}
        </div>

        {/* XP Progress Bar */}
        <div className="relative">
          <Progress 
            value={progressPercentage} 
            className="h-3 bg-purple-950/50"
          />
          <motion.div
            initial={{ width: "0%" }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="absolute top-0 left-0 h-full overflow-hidden"
          >
            <motion.div 
              animate={{ x: ["-100%", "100%"] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent w-1/2"
            />
          </motion.div>
        </div>

        {/* Expanded Stats */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-4 mt-4 border-t border-purple-500/20">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-purple-200/70">Total XP Earned</p>
                    <p className="text-lg font-semibold text-white">{xpData.totalXpEarned}</p>
                  </div>
                  <div>
                    <p className="text-sm text-purple-200/70">Current XP</p>
                    <p className="text-lg font-semibold text-white">{xpData.currentXp}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}
