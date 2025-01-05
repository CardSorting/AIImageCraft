import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, Trophy, CheckCircle2 } from "lucide-react";
import { useDailyChallenges } from "../hooks/use-daily-challenges";
import { DailyChallenge } from "../types";

function ChallengeCard({ challenge }: { challenge: DailyChallenge }) {
  const { checkProgress, isChecking } = useDailyChallenges();
  const progress = (challenge.currentProgress / challenge.requiredCount) * 100;

  return (
    <Card className="backdrop-blur-sm bg-black/30 border-purple-500/20">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-lg text-white">
                {challenge.title}
              </h3>
              {challenge.completed && (
                <CheckCircle2 className="w-5 h-5 text-green-400" />
              )}
            </div>
            <p className="text-sm text-purple-200/80">{challenge.description}</p>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-purple-200">Progress</span>
                <span className="text-purple-200">
                  {challenge.currentProgress}/{challenge.requiredCount}
                </span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-1 text-purple-300 bg-purple-500/10 px-2 py-1 rounded-md">
              <Sparkles className="w-4 h-4" />
              <span>{challenge.creditReward}</span>
            </div>
            {!challenge.completed && challenge.currentProgress > 0 && !challenge.isChecking && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => checkProgress(challenge.id)}
                disabled={isChecking || challenge.completed}
                className="text-purple-200 border-purple-500/30 hover:bg-purple-500/20"
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
  );
}

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