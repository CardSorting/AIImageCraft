import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, RefreshCw, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useReferral } from "../hooks/use-credits";

export function ReferralCode() {
  const [showInput, setShowInput] = useState(false);
  const [referralToUse, setReferralToUse] = useState("");
  const { toast } = useToast();
  const {
    referralCode,
    isLoadingCode,
    generateReferralCode,
    isGenerating,
    useReferralCode,
    isUsing,
  } = useReferral();

  const copyToClipboard = async () => {
    if (referralCode) {
      try {
        await navigator.clipboard.writeText(referralCode);
        toast({
          title: "Copied!",
          description: "Referral code copied to clipboard",
        });
      } catch (err) {
        toast({
          variant: "destructive",
          title: "Failed to copy",
          description: "Please try copying manually",
        });
      }
    }
  };

  const handleUseReferral = async () => {
    if (!referralToUse.trim()) {
      toast({
        variant: "destructive",
        title: "Invalid code",
        description: "Please enter a referral code",
      });
      return;
    }

    useReferralCode(referralToUse.trim());
    setReferralToUse("");
    setShowInput(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        {referralCode ? (
          <>
            <div className="flex items-center gap-2 flex-1">
              <Input
                value={referralCode}
                readOnly
                className="font-mono bg-purple-950/30 border-purple-500/30 text-purple-200"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={copyToClipboard}
                className="shrink-0"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <Button
              variant="outline"
              onClick={() => generateReferralCode()}
              disabled={isGenerating}
              className="shrink-0"
            >
              {isGenerating ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Generate New
            </Button>
          </>
        ) : (
          <Button
            onClick={() => generateReferralCode()}
            disabled={isGenerating}
            className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            {isGenerating ? (
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            Generate Referral Code
          </Button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        {showInput ? (
          <>
            <Input
              value={referralToUse}
              onChange={(e) => setReferralToUse(e.target.value)}
              placeholder="Enter referral code"
              className="flex-1 bg-purple-950/30 border-purple-500/30 text-purple-200"
            />
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                onClick={handleUseReferral}
                disabled={isUsing}
                className="flex-1 sm:flex-none bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                {isUsing ? (
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-2" />
                )}
                Use Code
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowInput(false)}
                className="flex-1 sm:flex-none"
              >
                Cancel
              </Button>
            </div>
          </>
        ) : (
          <Button
            variant="outline"
            onClick={() => setShowInput(true)}
            className="w-full sm:w-auto"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Use a Referral Code
          </Button>
        )}
      </div>
    </div>
  );
}
