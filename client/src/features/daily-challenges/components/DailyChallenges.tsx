import { Loader2, Trophy, Flame, Sparkles, Star, Gift, Crown } from "lucide-react";
import { useDailyChallenges } from "../hooks/use-daily-challenges";
import { ChallengeCard } from "./ChallengeCard";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export function DailyChallenges() {
  const { challenges, totalEarnedToday, maxDailyEarnings, isLoading } = useDailyChallenges();

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
      </div>
    );
  }

  const progressPercentage = (totalEarnedToday / maxDailyEarnings) * 100;
  const streakDays = 3; // TODO: Get from backend
  const currentLevel = Math.floor(totalEarnedToday / 100) + 1;
  const xpToNextLevel = 100 - (totalEarnedToday % 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 relative"
    >
      {/* Floating Streak Badge */}
      <motion.div 
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.05 }}
        className="fixed top-24 right-8 z-50"
      >
        <div className="relative group">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 bg-gradient-to-br from-orange-500 to-red-500 rounded-full blur-lg opacity-40"
          />
          <Card className="relative p-4 flex flex-col items-center bg-gradient-to-br from-orange-500/20 to-red-500/20 border-orange-500/30 group-hover:from-orange-500/30 group-hover:to-red-500/30 transition-all duration-300">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 bg-[url('/patterns/grid.svg')] opacity-10"
            />
            <Flame className="w-8 h-8 text-orange-400 mb-1 group-hover:animate-bounce" />
            <span className="text-2xl font-bold text-white">{streakDays}</span>
            <span className="text-xs text-orange-200/80">day streak</span>
          </Card>
        </div>
      </motion.div>

      {/* Header Section */}
      <div className="flex flex-col items-center text-center space-y-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="relative"
        >
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="absolute inset-0 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full blur-lg opacity-40"
          />
          <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center overflow-hidden">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 bg-[url('/patterns/grid.svg')] opacity-10"
            />
            <Trophy className="w-12 h-12 text-white" />
          </div>
        </motion.div>
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400"
        >
          Daily Art Challenge
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-purple-200/70 max-w-md"
        >
          Complete today's challenges to earn rewards and maintain your creative streak!
        </motion.p>
      </div>

      {/* Level Progress */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="relative p-6 rounded-xl bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20 group hover:from-purple-500/20 hover:to-blue-500/20 transition-all duration-300"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 bg-[url('/patterns/grid.svg')] opacity-5"
        />
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Star className="w-5 h-5 text-yellow-400 group-hover:animate-spin" />
              <Crown className="w-3 h-3 text-yellow-500 absolute -top-1 -right-1" />
            </div>
            <span className="text-white font-semibold">Level {currentLevel}</span>
          </div>
          <span className="text-sm text-purple-200/70">{xpToNextLevel} XP to next level</span>
        </div>
        <div className="relative">
          <Progress 
            value={(100 - xpToNextLevel)} 
            className="h-3 bg-purple-950/50"
          />
          <motion.div
            initial={{ width: "0%" }}
            animate={{ width: `${100 - xpToNextLevel}%` }}
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
      </motion.div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard
          icon={<Flame className="w-5 h-5 text-orange-400" />}
          title="Current Streak"
          value={`${streakDays} days`}
          color="from-orange-500 to-red-500"
        />
        <StatsCard
          icon={<Trophy className="w-5 h-5 text-yellow-400" />}
          title="Credits Earned"
          value={`${totalEarnedToday}/${maxDailyEarnings}`}
          color="from-yellow-500 to-orange-500"
        />
        <StatsCard
          icon={<Gift className="w-5 h-5 text-blue-400" />}
          title="Completion Rate"
          value="85%"
          color="from-blue-500 to-purple-500"
        />
      </div>

      {/* Daily Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-purple-200">Daily Progress</span>
          <span className="text-purple-200">{Math.round(progressPercentage)}%</span>
        </div>
        <div className="relative">
          <Progress value={progressPercentage} className="h-2" />
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
      </div>

      {/* Challenge Cards */}
      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {challenges.map((challenge, index) => (
            <motion.div
              key={challenge.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: index * 0.1 }}
            >
              <ChallengeCard challenge={challenge} />
            </motion.div>
          ))}
        </AnimatePresence>

        {challenges.length === 0 && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-12"
          >
            <motion.div 
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-500/10 mb-4"
            >
              <Trophy className="w-8 h-8 text-purple-400" />
            </motion.div>
            <h3 className="text-xl font-semibold text-white mb-2">
              All Caught Up!
            </h3>
            <p className="text-purple-200/70">
              You've completed all challenges for today. Check back tomorrow for new challenges!
            </p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

function StatsCard({ icon, title, value, color }: { 
  icon: React.ReactNode;
  title: string;
  value: string;
  color: string;
}) {
  return (
    <motion.div 
      whileHover={{ scale: 1.02 }} 
      whileTap={{ scale: 0.98 }}
    >
      <Card className={cn(
        "relative overflow-hidden transition-all duration-300",
        "hover:bg-gradient-to-br hover:from-purple-500/20 hover:to-blue-500/20"
      )}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 bg-[url('/patterns/grid.svg')] opacity-5"
        />
        <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-10`} />
        <div className="relative p-4">
          <div className="flex items-center gap-2 mb-2">
            {icon}
            <span className="text-sm font-medium text-purple-200/70">{title}</span>
          </div>
          <p className="text-2xl font-bold text-white">{value}</p>
        </div>
      </Card>
    </motion.div>
  );
}