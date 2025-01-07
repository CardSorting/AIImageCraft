import { Switch, Route } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Loader2 } from "lucide-react";
import { useUser } from "@/hooks/use-user";
import AuthPage from "@/pages/AuthPage";
import CreateImage from "@/pages/CreateImage";
import Gallery from "@/pages/Gallery";
import Profile from "@/pages/Profile";
import GameQueue from "@/pages/GameQueue";
import LandingPage from "@/pages/LandingPage";
import TradingCardsPage from "@/features/trading-cards/pages/TradingCardsPage";
import CreateTradingCardPage from "@/features/trading-cards/pages/CreateTradingCardPage";
import { DailyChallengesPage } from "@/pages/DailyChallengesPage";
import { MarketplacePage } from "@/features/marketplace/pages/MarketplacePage";
import { UserListingsPage } from "@/features/marketplace/pages/UserListingsPage";
import { CreditPurchasePage } from "@/features/credits/pages/CreditPurchasePage";
import { NewListingPage } from "@/features/marketplace/pages/NewListingPage";

function App() {
  const { user, isLoading } = useUser();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1">
        <Switch>
          {/* Public routes */}
          <Route path="/" component={LandingPage} />
          <Route path="/auth">
            {user ? <Route path="/" /> : <AuthPage />}
          </Route>

          {/* Protected routes */}
          {user ? (
            <Switch>
              <Route path="/create" component={CreateImage} />
              <Route path="/gallery" component={Gallery} />
              <Route path="/profile" component={Profile} />
              <Route path="/cards" component={TradingCardsPage} />
              <Route path="/cards/create" component={CreateTradingCardPage} />
              <Route path="/marketplace" component={MarketplacePage} />
              <Route path="/marketplace/listings" component={UserListingsPage} />
              <Route path="/credits" component={CreditPurchasePage} />
              <Route path="/queue" component={GameQueue} />
              <Route path="/games/:id" component={GameQueue} />
              <Route path="/challenges" component={DailyChallengesPage} />
              <Route path="/marketplace/new-listing" component={NewListingPage} />
            </Switch>
          ) : (
            <Route component={NotFound} />
          )}

          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
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