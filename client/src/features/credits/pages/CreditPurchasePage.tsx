import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useCredits } from "../hooks/use-credits";
import { Loader2, Sparkles, Package, Zap } from "lucide-react";
import Header from "@/components/Header";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import PaymentForm from "../components/PaymentForm";

if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error("Missing Stripe publishable key");
}

// Initialize Stripe with publishable key
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

export function CreditPurchasePage() {
  const { credits, packages, isLoading, purchaseCredits } = useCredits();
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const { toast } = useToast();

  const handlePurchase = async (packageId: string) => {
    try {
      setIsPurchasing(true);
      setSelectedPackage(packageId);

      const { clientSecret } = await purchaseCredits({ packageId });
      setClientSecret(clientSecret);
    } catch (error) {
      toast({
        title: "Purchase failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
      setSelectedPackage(null);
    } finally {
      setIsPurchasing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto py-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto py-8">
        <div className="max-w-4xl mx-auto">
          {/* Current Balance */}
          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Current Balance</h2>
                  <p className="text-muted-foreground">Your available Pulse credits</p>
                </div>
                <div className="flex items-center gap-2 text-3xl font-bold">
                  <Zap className="w-8 h-8 text-purple-500" />
                  <span>{credits} Pulse</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Credit Packages */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {packages.map((pkg) => (
              <Card key={pkg.id} className="relative overflow-hidden">
                {/* Decorative gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-transparent" />

                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    {pkg.credits} Pulse
                  </CardTitle>
                  <CardDescription>
                    ${(pkg.price / 100).toFixed(2)} USD
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <Button 
                    className="w-full"
                    onClick={() => handlePurchase(pkg.id)}
                    disabled={isPurchasing || clientSecret !== null}
                  >
                    {isPurchasing && selectedPackage === pkg.id ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4 mr-2" />
                    )}
                    Purchase
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Payment Form */}
          {clientSecret && (
            <Card className="mt-8">
              <CardHeader>
                <CardTitle>Complete Purchase</CardTitle>
                <CardDescription>
                  Enter your payment details to complete the purchase
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Elements stripe={stripePromise} options={{ clientSecret }}>
                  <PaymentForm 
                    onSuccess={() => {
                      setClientSecret(null);
                      setSelectedPackage(null);
                    }} 
                  />
                </Elements>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}