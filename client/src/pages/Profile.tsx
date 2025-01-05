import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUser } from "@/hooks/use-user";
import { ReferralCode } from "@/features/credits/components/ReferralCode";
import { DailyChallenges } from "@/features/daily-challenges/components/DailyChallenges";

export default function Profile() {
  const { user } = useUser();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl md:text-6xl font-bold text-white text-center mb-8 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
          Profile
        </h1>

        <div className="space-y-6 max-w-2xl mx-auto">
          <Card className="backdrop-blur-sm bg-black/30 border-purple-500/20">
            <CardHeader>
              <CardTitle className="text-2xl text-white">Account Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-purple-300/70">Username</label>
                  <p className="text-white text-lg">{user?.username}</p>
                </div>
                <div>
                  <label className="text-sm text-purple-300/70">Account ID</label>
                  <p className="text-white text-lg">#{user?.id}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-sm bg-black/30 border-purple-500/20">
            <CardHeader>
              <CardTitle className="text-2xl text-white">Daily Challenges</CardTitle>
            </CardHeader>
            <CardContent>
              <DailyChallenges />
            </CardContent>
          </Card>

          <Card className="backdrop-blur-sm bg-black/30 border-purple-500/20">
            <CardHeader>
              <CardTitle className="text-2xl text-white">Referral Program</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-purple-200/80">
                  Share your referral code with friends to earn Pulse credits! You'll receive 5 credits for each friend who joins,
                  and they'll get 3 bonus credits too.
                </p>
                <ReferralCode />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}