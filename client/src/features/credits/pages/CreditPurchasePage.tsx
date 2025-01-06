import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useCredits } from "../hooks/use-credits";
import { Loader2, Sparkles, Zap, ChevronRight, Lock, Info, Check } from "lucide-react";
import Header from "@/components/Header";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe, Stripe } from "@stripe/stripe-js";
import PaymentForm from "../components/PaymentForm";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
if (!STRIPE_PUBLISHABLE_KEY) {
  throw new Error("Missing Stripe publishable key in environment variables (VITE_STRIPE_PUBLIC_KEY)");
}

let stripePromise: Promise<Stripe | null>;
try {
  stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);
} catch (error) {
  console.error("Failed to initialize Stripe:", error);
  stripePromise = Promise.reject(error);
}

const PRESET_AMOUNTS = [
  { 
    credits: 100, 
    label: "Starter", 
    price: 5,
    description: "Perfect for trying things out",
    features: ["Instant delivery", "No expiration", "Basic support"]
  },
  { 
    credits: 500, 
    label: "Plus", 
    price: 25,
    description: "Most popular for regular users",
    popular: true,
    features: ["Instant delivery", "No expiration", "Priority support", "5% bonus credits"]
  },
  { 
    credits: 1200, 
    label: "Pro", 
    price: 60,
    description: "Best value for power users",
    features: ["Instant delivery", "No expiration", "Premium support", "10% bonus credits"]
  },
];

export function CreditPurchasePage() {
  const { credits, isLoading, purchaseCredits } = useCredits();
  const [selectedAmount, setSelectedAmount] = useState<number>(500);
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
        <div className="max-w-5xl mx-auto">
          {/* Checkout Header */}
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold mb-3">Purchase Pulse Credits</h1>
            <p className="text-muted-foreground">Select a package or customize your amount</p>
          </div>

          {/* Checkout Progress */}
          <div className="mb-12">
            <div className="flex items-center justify-center text-sm max-w-md mx-auto">
              <div className="flex items-center">
                <span className="w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center font-medium">1</span>
                <span className="ml-2">Select Amount</span>
              </div>
              <div className="grow mx-4 h-0.5 bg-border relative">
                <div className={`absolute inset-0 bg-purple-500 transition-all ${clientSecret ? 'w-full' : 'w-0'}`} />
              </div>
              <div className="flex items-center">
                <span className={`w-8 h-8 rounded-full font-medium flex items-center justify-center ${clientSecret ? 'bg-purple-500 text-white' : 'bg-muted text-muted-foreground'}`}>2</span>
                <span className="ml-2">Payment</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {!clientSecret ? (
                <>
                  {/* Preset Packages */}
                  <div className="grid gap-6">
                    {PRESET_AMOUNTS.map(({ credits, label, price, description, features, popular }) => (
                      <div
                        key={credits}
                        className={`relative rounded-lg border-2 transition-all ${
                          selectedAmount === credits
                            ? 'border-purple-500 bg-purple-500/5 shadow-lg'
                            : 'border-border hover:border-purple-500/50'
                        } p-6 cursor-pointer`}
                        onClick={() => setSelectedAmount(credits)}
                      >
                        {popular && (
                          <span className="absolute -top-3 -right-3 bg-purple-500 text-white text-xs px-3 py-1 rounded-full font-medium">
                            Most Popular
                          </span>
                        )}

                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-xl font-semibold mb-1">{label}</h3>
                            <p className="text-muted-foreground text-sm">{description}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold">${price}</div>
                            <div className="text-sm text-muted-foreground">
                              ({credits} credits)
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          {features.map((feature, index) => (
                            <div key={index} className="flex items-center text-sm text-muted-foreground">
                              <Check className="w-4 h-4 mr-2 text-purple-500" />
                              {feature}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Custom Amount */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        Custom Amount
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Info className="w-4 h-4 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Enter any amount of credits you'd like to purchase</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4">
                        <div className="grow">
                          <label className="text-sm font-medium mb-2 block">
                            Number of Credits
                          </label>
                          <input
                            type="number"
                            value={selectedAmount}
                            onChange={(e) => setSelectedAmount(Math.max(1, parseInt(e.target.value) || 0))}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            min="1"
                            step="1"
                          />
                        </div>
                        <div className="w-32 text-right">
                          <label className="text-sm font-medium mb-2 block">
                            Price
                          </label>
                          <div className="text-2xl font-bold">
                            ${(selectedAmount * 0.05).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : (
                /* Payment Form */
                <Card className="border-2">
                  <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                      <Lock className="w-4 h-4 text-purple-500" />
                      <span className="text-sm font-medium text-purple-500">Secure Checkout</span>
                    </div>
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
              <div className="lg:sticky lg:top-24">
                <Card>
                  <CardHeader>
                    <CardTitle>Order Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Current Balance */}
                      <div className="bg-muted/50 rounded-lg p-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Current Balance</span>
                          <div className="flex items-center gap-1.5">
                            <Zap className="w-4 h-4 text-purple-500" />
                            <span className="font-medium">{credits} Credits</span>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* Purchase Details */}
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span>Credits to Purchase</span>
                          <span className="font-medium">{selectedAmount}</span>
                        </div>
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>Price per Credit</span>
                          <span>$0.05</span>
                        </div>

                        {selectedAmount >= 500 && (
                          <div className="flex justify-between text-sm text-green-500">
                            <span>Bonus Credits</span>
                            <span>+{selectedAmount >= 1200 ? '10%' : '5%'}</span>
                          </div>
                        )}
                      </div>

                      <Separator />

                      {/* Total */}
                      <div>
                        <div className="flex justify-between text-lg font-bold mb-1">
                          <span>Total</span>
                          <span>${(selectedAmount * 0.05).toFixed(2)}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Prices in USD. Tax included if applicable.
                        </div>
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
                              <Lock className="w-4 h-4 mr-2" />
                              Proceed to Payment
                            </>
                          )}
                        </Button>
                      )}

                      {/* Trust Indicators */}
                      <div className="pt-4 space-y-3">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Lock className="w-3 h-3" />
                          <span>Secure payment by Stripe</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Zap className="w-3 h-3" />
                          <span>Instant credit delivery</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Check className="w-3 h-3" />
                          <span>100% satisfaction guaranteed</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}