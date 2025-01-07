import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useCredits } from "../hooks/use-credits";
import { Loader2, Zap, ChevronRight, Lock, Info, Check } from "lucide-react";
import Header from "@/components/Header";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const PRESET_AMOUNTS = [
  { 
    credits: 100, 
    label: "Starter", 
    description: "Perfect for trying things out",
    features: ["Basic support", "No expiration"]
  },
  { 
    credits: 500, 
    label: "Plus", 
    description: "Most popular for regular users",
    popular: true,
    features: ["Priority support", "No expiration", "5% bonus credits"]
  },
  { 
    credits: 1200, 
    label: "Pro", 
    description: "Best value for power users",
    features: ["Premium support", "No expiration", "10% bonus credits"]
  },
];

export function CreditPurchasePage() {
  const { credits, isLoading, addCredits } = useCredits();
  const [selectedAmount, setSelectedAmount] = useState<number>(500);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleAddCredits = async () => {
    try {
      setIsProcessing(true);
      await addCredits(selectedAmount);
      toast({
        title: "Credits Added",
        description: `Successfully added ${selectedAmount} credits to your account!`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add credits",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
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

      <main className="container mx-auto py-12 px-4">
        <div className="max-w-5xl mx-auto">
          {/* Credits Header */}
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold mb-3">Pulse Credits</h1>
            <p className="text-muted-foreground">Select a credit package or customize your amount</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Preset Packages */}
              <div className="grid gap-6">
                {PRESET_AMOUNTS.map(({ credits, label, description, features, popular }) => (
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
                        <div className="text-2xl font-bold">{credits}</div>
                        <div className="text-sm text-muted-foreground">
                          credits
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
                          <p>Enter any amount of credits you'd like to add</p>
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
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="lg:sticky lg:top-24">
                <Card>
                  <CardHeader>
                    <CardTitle>Summary</CardTitle>
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
                          <span>Credits to Add</span>
                          <span className="font-medium">{selectedAmount}</span>
                        </div>

                        {selectedAmount >= 500 && (
                          <div className="flex justify-between text-sm text-green-500">
                            <span>Bonus Credits</span>
                            <span>+{selectedAmount >= 1200 ? '10%' : '5%'}</span>
                          </div>
                        )}
                      </div>

                      {/* Add Credits Button */}
                      <Button
                        className="w-full mt-4"
                        size="lg"
                        onClick={handleAddCredits}
                        disabled={isProcessing || selectedAmount < 1}
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Zap className="w-4 h-4 mr-2" />
                            Add Credits
                          </>
                        )}
                      </Button>

                      {/* Trust Indicators */}
                      <div className="pt-4 space-y-3">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Zap className="w-3 h-3" />
                          <span>Instant credit delivery</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Check className="w-3 h-3" />
                          <span>No expiration</span>
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