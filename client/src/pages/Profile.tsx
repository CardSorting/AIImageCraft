import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUser } from "@/hooks/use-user";

export default function Profile() {
  const { user } = useUser();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl md:text-6xl font-bold text-white text-center mb-8 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
          Profile
        </h1>

        <Card className="w-full max-w-2xl mx-auto backdrop-blur-sm bg-black/30 border-purple-500/20">
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
      </div>
    </div>
  );
}
