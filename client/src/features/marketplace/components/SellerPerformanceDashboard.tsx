import { SellerPerformance, Achievement } from "../types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Trophy,
  Flame,
  TrendingUp,
  Medal,
  Target,
  Star,
  Calendar,
  Award,
  Shield
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SellerPerformanceDashboardProps {
  performance: SellerPerformance;
}

function AchievementCard({ achievement }: { achievement: Achievement }) {
  const progress = (achievement.progress / achievement.maxProgress) * 100;
  
  return (
    <Card className={cn(
      "relative overflow-hidden transition-all duration-300",
      achievement.unlockedAt && "bg-gradient-to-br",
      achievement.rarity === 'LEGENDARY' && achievement.unlockedAt && "from-yellow-500/10 to-amber-500/10 border-yellow-500/50",
      achievement.rarity === 'EPIC' && achievement.unlockedAt && "from-purple-500/10 to-pink-500/10 border-purple-500/50",
      achievement.rarity === 'RARE' && achievement.unlockedAt && "from-blue-500/10 to-cyan-500/10 border-blue-500/50",
      achievement.rarity === 'COMMON' && achievement.unlockedAt && "from-gray-500/10 to-slate-500/10 border-gray-500/50"
    )}>
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <div className={cn(
            "p-2 rounded-lg",
            achievement.unlockedAt ? "bg-primary" : "bg-muted"
          )}>
            <Award className={cn(
              "w-6 h-6",
              achievement.unlockedAt ? "text-primary-foreground" : "text-muted-foreground"
            )} />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold">{achievement.name}</h4>
            <p className="text-sm text-muted-foreground">{achievement.description}</p>
            <div className="mt-2">
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {achievement.progress} / {achievement.maxProgress}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function SellerPerformanceDashboard({ performance }: SellerPerformanceDashboardProps) {
  const expProgress = (performance.experience / performance.experienceToNextLevel) * 100;
  
  return (
    <div className="space-y-6">
      {/* Level and Experience */}
      <Card>
        <CardHeader>
          <CardTitle>Seller Level {performance.level}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Progress value={expProgress} className="h-3" />
            <span className="absolute top-4 left-0 text-xs text-muted-foreground">
              {performance.experience} / {performance.experienceToNextLevel} XP
            </span>
          </div>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-yellow-500" />
                  <p className="text-sm font-medium">Ranking</p>
                </div>
                <p className="mt-2 text-2xl font-bold">
                  #{performance.ranking.position}
                </p>
                <p className="text-xs text-muted-foreground">
                  Top {((performance.ranking.position / performance.ranking.totalSellers) * 100).toFixed(1)}%
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-orange-500" />
                  <p className="text-sm font-medium">Activity Streak</p>
                </div>
                <p className="mt-2 text-2xl font-bold">
                  {performance.activityStreak.current} days
                </p>
                <p className="text-xs text-muted-foreground">
                  Longest: {performance.activityStreak.longest} days
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <Medal className="w-4 h-4 text-blue-500" />
                  <p className="text-sm font-medium">Seller Tier</p>
                </div>
                <p className="mt-2 text-2xl font-bold">
                  {performance.ranking.tier}
                </p>
                <p className="text-xs text-muted-foreground">
                  Keep selling to rank up!
                </p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Goals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Weekly Goals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <p className="text-sm font-medium">Sales Target</p>
                <p className="text-sm text-muted-foreground">
                  {performance.weeklyGoals.sales.current} / {performance.weeklyGoals.sales.target}
                </p>
              </div>
              <Progress 
                value={(performance.weeklyGoals.sales.current / performance.weeklyGoals.sales.target) * 100} 
                className="h-2"
              />
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <p className="text-sm font-medium">Revenue Target</p>
                <p className="text-sm text-muted-foreground">
                  {performance.weeklyGoals.revenue.current} / {performance.weeklyGoals.revenue.target}
                </p>
              </div>
              <Progress 
                value={(performance.weeklyGoals.revenue.current / performance.weeklyGoals.revenue.target) * 100}
                className="h-2"
              />
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <p className="text-sm font-medium">New Listings</p>
                <p className="text-sm text-muted-foreground">
                  {performance.weeklyGoals.listings.current} / {performance.weeklyGoals.listings.target}
                </p>
              </div>
              <Progress 
                value={(performance.weeklyGoals.listings.current / performance.weeklyGoals.listings.target) * 100}
                className="h-2"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <p className="text-sm font-medium">Total Sales</p>
            </div>
            <p className="mt-2 text-2xl font-bold">
              {performance.stats.totalSales}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-500" />
              <p className="text-sm font-medium">Average Rating</p>
            </div>
            <p className="mt-2 text-2xl font-bold">
              {performance.stats.averageRating.toFixed(1)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-500" />
              <p className="text-sm font-medium">Response Rate</p>
            </div>
            <p className="mt-2 text-2xl font-bold">
              {performance.stats.responseRate}%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-purple-500" />
              <p className="text-sm font-medium">Listing Quality</p>
            </div>
            <p className="mt-2 text-2xl font-bold">
              {performance.stats.listingQuality}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Achievements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5" />
            Achievements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {performance.achievements.map((achievement) => (
              <AchievementCard key={achievement.id} achievement={achievement} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
