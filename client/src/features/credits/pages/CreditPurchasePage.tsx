import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useCredits } from "../hooks/use-credits";
import { Loader2, Sparkles, Package, Zap } from "lucide-react";
import Header from "@/components/Header";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

export function CreditPurchasePage() {
  const { credits, packages, isLoading, purchaseCredits, completePurchase } = useCredits();
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);

  const handlePurchase = async (packageId: string) => {
    try {
      setIsPurchasing(true);
      setSelectedPackage(packageId);
      
      const { clientSecret } = await purchaseCredits({ packageId });
      
      // TODO: Handle Stripe payment flow
      // For now, we'll just complete the purchase directly
      await completePurchase({ paymentIntentId: clientSecret });
      
      toast({
        title: "Purchase successful!",
        description: "Credits have been added to your account.",
      });
    } catch (error) {
      toast({
        title: "Purchase failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsPurchasing(false);
      setSelectedPackage(null);
    }
  };

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
                  <p className="text-muted-foreground">Your available credits</p>
                </div>
                <div className="flex items-center gap-2 text-3xl font-bold">
                  <Zap className="w-8 h-8 text-purple-500" />
                  {isLoading ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <span>{credits} Credits</span>
                  )}
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
                    {pkg.credits} Credits
                  </CardTitle>
                  <CardDescription>
                    ${(pkg.price / 100).toFixed(2)} USD
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  <Button 
                    className="w-full"
                    onClick={() => handlePurchase(pkg.id)}
                    disabled={isPurchasing}
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
        </div>
      </main>
    </div>
  );
}
