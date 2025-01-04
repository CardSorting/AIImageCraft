import { Switch, Route, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Loader2 } from "lucide-react";
import { useUser } from "@/hooks/use-user";
import AuthPage from "@/pages/AuthPage";
import CreateImage from "@/pages/CreateImage";
import Gallery from "@/pages/Gallery";
import Profile from "@/pages/Profile";
import GameQueue from "@/pages/GameQueue";
import LandingPage from "@/pages/LandingPage";

function App() {
  const { user, isLoading } = useUser();
  const [location, setLocation] = useLocation();

  // Redirect to gallery if user is logged in and trying to access auth page
  if (user && location === "/auth") {
    setLocation("/gallery");
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
          <p className="text-white">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      {/* Public routes */}
      <Route path="/" component={LandingPage} />
      <Route path="/auth">
        {user ? <Gallery /> : <AuthPage />}
      </Route>

      {/* Protected routes - redirect to auth if not logged in */}
      <Route path="/create">
        {user ? <CreateImage /> : <AuthPage />}
      </Route>
      <Route path="/gallery">
        {user ? <Gallery /> : <AuthPage />}
      </Route>
      <Route path="/profile">
        {user ? <Profile /> : <AuthPage />}
      </Route>
      <Route path="/queue">
        {user ? <GameQueue /> : <AuthPage />}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

// fallback 404 not found page
function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-black">
      <Card className="w-full max-w-md mx-4 backdrop-blur-sm bg-black/30 border-purple-500/20">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <h1 className="text-2xl font-bold text-white">404 Page Not Found</h1>
          </div>
          <p className="mt-4 text-sm text-purple-300/70">
            The page you're looking for doesn't exist.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default App;