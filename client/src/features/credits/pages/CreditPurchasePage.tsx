import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useCredits } from "../hooks/use-credits";
import { Loader2, Sparkles, Package, Zap, ChevronRight } from "lucide-react";
import Header from "@/components/Header";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe, Stripe } from "@stripe/stripe-js";
import PaymentForm from "../components/PaymentForm";
import { Separator } from "@/components/ui/separator";

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

const PRESET_AMOUNTS = [
  { credits: 100, label: "Starter", description: "Perfect for trying things out" },
  { credits: 500, label: "Plus", description: "Most popular for regular users", popular: true },
  { credits: 1200, label: "Pro", description: "Best value for power users" },
];

export function CreditPurchasePage() {
  const { credits, isLoading, purchaseCredits } = useCredits();
  const [selectedAmount, setSelectedAmount] = useState<number>(500); // Default to most popular
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const { toast } = useToast();

  const handlePurchase = async () => {
    try {
      setIsPurchasing(true);
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
    setSelectedAmount(500);
    toast({
      title: "Purchase Complete",
      description: "Your credits have been added to your account!",
    });
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

      <main className="container mx-auto py-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Checkout Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-center text-sm">
              <div className="flex items-center">
                <span className="w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center">1</span>
                <span className="ml-2">Select Amount</span>
              </div>
              <ChevronRight className="mx-4 text-muted-foreground" />
              <div className="flex items-center">
                <span className={`w-8 h-8 rounded-full ${clientSecret ? 'bg-purple-500 text-white' : 'bg-muted text-muted-foreground'} flex items-center justify-center`}>2</span>
                <span className="ml-2">Payment</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {!clientSecret ? (
                <>
                  {/* Credit Selection */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Select Credit Amount</CardTitle>
                      <CardDescription>
                        Choose a preset package or enter a custom amount
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Preset amounts */}
                      <div className="grid gap-4">
                        {PRESET_AMOUNTS.map(({ credits, label, description, popular }) => (
                          <div
                            key={credits}
                            className={`relative rounded-lg border ${
                              selectedAmount === credits
                                ? 'border-purple-500 bg-purple-500/5'
                                : 'border-border hover:border-purple-500/50'
                            } p-4 cursor-pointer transition-colors`}
                            onClick={() => setSelectedAmount(credits)}
                          >
                            {popular && (
                              <span className="absolute -top-2 -right-2 bg-purple-500 text-white text-xs px-2 py-1 rounded-full">
                                Popular
                              </span>
                            )}
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="font-medium">{label}</h3>
                                <p className="text-sm text-muted-foreground">{description}</p>
                              </div>
                              <div className="text-right">
                                <div className="font-bold">{credits} Credits</div>
                                <div className="text-sm text-muted-foreground">
                                  ${(credits * 0.05).toFixed(2)}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Custom amount */}
                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          Or enter a custom amount
                        </label>
                        <div className="flex items-center gap-4">
                          <input
                            type="number"
                            value={selectedAmount}
                            onChange={(e) => setSelectedAmount(Math.max(1, parseInt(e.target.value) || 0))}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            min="1"
                            step="1"
                          />
                          <div className="text-sm text-muted-foreground whitespace-nowrap">
                            ${(selectedAmount * 0.05).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : (
                /* Payment Form */
                <Card>
                  <CardHeader>
                    <CardTitle>Payment Details</CardTitle>
                    <CardDescription>
                      Complete your purchase securely with Stripe
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

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Current Balance */}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Current Balance</span>
                      <div className="flex items-center gap-1">
                        <Zap className="w-4 h-4 text-purple-500" />
                        <span>{credits}</span>
                      </div>
                    </div>

                    <Separator />

                    {/* Purchase Details */}
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Credits to Purchase</span>
                        <span className="font-medium">{selectedAmount}</span>
                      </div>
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Price per Credit</span>
                        <span>$0.05</span>
                      </div>
                    </div>

                    <Separator />

                    {/* Total */}
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span>${(selectedAmount * 0.05).toFixed(2)}</span>
                    </div>

                    {/* Purchase Button */}
                    {!clientSecret && (
                      <Button
                        className="w-full mt-4"
                        size="lg"
                        onClick={handlePurchase}
                        disabled={isPurchasing || selectedAmount < 1}
                      >
                        {isPurchasing ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 mr-2" />
                            Proceed to Payment
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}