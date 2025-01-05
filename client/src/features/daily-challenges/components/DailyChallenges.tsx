import { Loader2, Trophy, Flame, Sparkles } from "lucide-react";
import { useDailyChallenges } from "../hooks/use-daily-challenges";
import { ChallengeCard } from "./ChallengeCard";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      {/* Header Section */}
      <div className="flex flex-col items-center text-center space-y-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center"
        >
          <Trophy className="w-10 h-10 text-white" />
        </motion.div>
        <h1 className="text-3xl font-bold text-white">Daily Art Challenge</h1>
        <p className="text-purple-200/70 max-w-md">
          Complete today's challenge to earn rewards and maintain your creative streak!
        </p>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard
          icon={<Flame className="w-5 h-5 text-orange-400" />}
          title="Current Streak"
          value="3 days"
          color="from-orange-500 to-red-500"
        />
        <StatsCard
          icon={<Trophy className="w-5 h-5 text-yellow-400" />}
          title="Credits Earned"
          value={`${totalEarnedToday}/${maxDailyEarnings}`}
          color="from-yellow-500 to-orange-500"
        />
        <StatsCard
          icon={<Sparkles className="w-5 h-5 text-blue-400" />}
          title="Completion Rate"
          value="85%"
          color="from-blue-500 to-purple-500"
        />
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-purple-200">Daily Progress</span>
          <span className="text-purple-200">{Math.round(progressPercentage)}%</span>
        </div>
        <Progress value={progressPercentage} className="h-2" />
      </div>

      {/* Challenge Cards */}
      <div className="space-y-4">
        {challenges.map((challenge) => (
          <motion.div
            key={challenge.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <ChallengeCard challenge={challenge} />
          </motion.div>
        ))}
        {challenges.length === 0 && (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-500/10 mb-4">
              <Trophy className="w-8 h-8 text-purple-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              All Caught Up!
            </h3>
            <p className="text-purple-200/70">
              You've completed all challenges for today. Check back tomorrow for new challenges!
            </p>
          </div>
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
    <Card className="relative overflow-hidden">
      <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-10`} />
      <div className="relative p-4">
        <div className="flex items-center gap-2 mb-2">
          {icon}
          <span className="text-sm font-medium text-purple-200/70">{title}</span>
        </div>
        <p className="text-2xl font-bold text-white">{value}</p>
      </div>
    </Card>
  );
}