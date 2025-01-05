import { Loader2, Trophy } from "lucide-react";
import { useDailyChallenges } from "../hooks/use-daily-challenges";
import { ChallengeCard } from "./ChallengeCard";

export function DailyChallenges() {
  const { challenges, totalEarnedToday, maxDailyEarnings, isLoading } = useDailyChallenges();

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-purple-400" />
          <h2 className="text-lg font-semibold text-white">Daily Challenges</h2>
        </div>
        <div className="text-sm text-purple-200">
          <span className="text-purple-400 font-medium">{totalEarnedToday}</span>
          <span className="text-purple-200/70"> / {maxDailyEarnings} credits earned today</span>
        </div>
      </div>

      <div className="space-y-4">
        {challenges.map((challenge) => (
          <ChallengeCard key={challenge.id} challenge={challenge} />
        ))}
        {challenges.length === 0 && (
          <p className="text-center text-purple-200/70 py-8">
            No active challenges available. Check back tomorrow!
          </p>
        )}
      </div>
    </div>
  );
}
