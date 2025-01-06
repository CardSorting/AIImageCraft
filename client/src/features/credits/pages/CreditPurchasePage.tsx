import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useCredits } from "../hooks/use-credits";
import { Loader2, Sparkles, Package, Zap } from "lucide-react";
import Header from "@/components/Header";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe, Stripe } from "@stripe/stripe-js";
import PaymentForm from "../components/PaymentForm";

// Ensure the publishable key is available
const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
if (!STRIPE_PUBLISHABLE_KEY) {
  throw new Error("Missing Stripe publishable key in environment variables (VITE_STRIPE_PUBLIC_KEY)");
}

// Initialize Stripe with publishable key
let stripePromise: Promise<Stripe | null>;
try {
  stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);
} catch (error) {
  console.error("Failed to initialize Stripe:", error);
  stripePromise = Promise.reject(error);
}

export function CreditPurchasePage() {
  const { credits, packages, isLoading, purchaseCredits } = useCredits();
  const [selectedAmount, setSelectedAmount] = useState<number>(100);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const { toast } = useToast();

  const handlePurchase = async () => {
    try {
      setIsPurchasing(true);

      // Calculate price based on credit amount (1 credit = $0.05)
      const priceInCents = Math.round(selectedAmount * 5);

      const { clientSecret } = await purchaseCredits({ 
        packageId: 'custom',
        amount: selectedAmount,
        price: priceInCents 
      });

      setClientSecret(clientSecret);
    } catch (error) {
      toast({
        title: "Purchase failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsPurchasing(false);
    }
  };

  const handlePaymentSuccess = () => {
    setClientSecret(null);
    setSelectedAmount(100);
    toast({
      title: "Purchase Complete",
      description: "Your credits have been added to your account!",
    });
  };

  const handleQuickSelect = (amount: number) => {
    setSelectedAmount(amount);
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

          {/* Credit Purchase */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Purchase Credits</CardTitle>
              <CardDescription>
                Select the amount of credits you want to purchase
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Quick select buttons */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                {[100, 500, 1200].map((amount) => (
                  <Button
                    key={amount}
                    variant={selectedAmount === amount ? "default" : "outline"}
                    onClick={() => handleQuickSelect(amount)}
                    className="h-20"
                  >
                    <div className="text-center">
                      <div className="text-lg font-bold">{amount}</div>
                      <div className="text-sm">${(amount * 0.05).toFixed(2)}</div>
                    </div>
                  </Button>
                ))}
              </div>

              {/* Custom amount input */}
              <div className="flex items-center gap-4 mb-6">
                <input
                  type="number"
                  value={selectedAmount}
                  onChange={(e) => setSelectedAmount(Math.max(1, parseInt(e.target.value) || 0))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  min="1"
                  step="1"
                />
                <div className="text-sm text-muted-foreground w-24">
                  ${(selectedAmount * 0.05).toFixed(2)}
                </div>
              </div>

              {/* Purchase button */}
              <Button
                className="w-full"
                onClick={handlePurchase}
                disabled={isPurchasing || clientSecret !== null || selectedAmount < 1}
              >
                {isPurchasing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Purchase {selectedAmount} Credits
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Payment Form */}
          {clientSecret && (
            <Card>
              <CardHeader>
                <CardTitle>Complete Purchase</CardTitle>
                <CardDescription>
                  Enter your payment details to complete the purchase
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Elements 
                  stripe={stripePromise} 
                  options={{
                    clientSecret,
                    appearance: {
                      theme: 'night',
                      variables: {
                        colorPrimary: '#a855f7',
                        colorBackground: '#1a1a1a',
                        colorText: '#ffffff',
                        colorDanger: '#ef4444',
                        fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont',
                      },
                    },
                  }}
                >
                  <PaymentForm onSuccess={handlePaymentSuccess} />
                </Elements>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}