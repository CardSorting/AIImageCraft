import { Switch, Route, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Loader2 } from "lucide-react";
import { AuthProvider } from "@/features/auth/components/AuthProvider";
import { ProtectedRoute } from "@/features/auth/components/ProtectedRoute";
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
  return (
    <AuthProvider>
      <div className="min-h-screen flex flex-col">
        <main className="flex-1">
          <Switch>
            {/* Public routes */}
            <Route path="/" component={LandingPage} />
            <Route path="/auth" component={AuthPage} />

            {/* Protected routes */}
            <Route path="/create">
              <ProtectedRoute>
                <CreateImage />
              </ProtectedRoute>
            </Route>
            <Route path="/gallery">
              <ProtectedRoute>
                <Gallery />
              </ProtectedRoute>
            </Route>
            <Route path="/profile">
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            </Route>
            <Route path="/cards">
              <ProtectedRoute>
                <TradingCardsPage />
              </ProtectedRoute>
            </Route>
            <Route path="/cards/create">
              <ProtectedRoute>
                <CreateTradingCardPage />
              </ProtectedRoute>
            </Route>
            <Route path="/marketplace">
              <ProtectedRoute>
                <MarketplacePage />
              </ProtectedRoute>
            </Route>
            <Route path="/marketplace/listings">
              <ProtectedRoute>
                <UserListingsPage />
              </ProtectedRoute>
            </Route>
            <Route path="/credits">
              <ProtectedRoute>
                <CreditPurchasePage />
              </ProtectedRoute>
            </Route>
            <Route path="/queue">
              <ProtectedRoute>
                <GameQueue />
              </ProtectedRoute>
            </Route>
            <Route path="/games/:id">
              <ProtectedRoute>
                <GameQueue />
              </ProtectedRoute>
            </Route>
            <Route path="/challenges">
              <ProtectedRoute>
                <DailyChallengesPage />
              </ProtectedRoute>
            </Route>
            <Route path="/marketplace/new-listing">
              <ProtectedRoute>
                <NewListingPage />
              </ProtectedRoute>
            </Route>
            <Route component={NotFound} />
          </Switch>
        </main>
      </div>
    </AuthProvider>
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