import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Copy, RefreshCw, Sparkles, Trophy, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useReferral } from "../hooks/use-credits";
import { ReferralQRCode } from "./ReferralQRCode";

export function ReferralCode() {
  const [showInput, setShowInput] = useState(false);
  const [referralToUse, setReferralToUse] = useState("");
  const { toast } = useToast();
  const {
    referralCode,
    referralStats,
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

  const nextTierProgress = referralStats ? 
    (referralStats.referralCount % 5) / 5 * 100 : 0;
  const currentTier = referralStats ? 
    Math.floor(referralStats.referralCount / 5) + 1 : 1;

  return (
    <div className="space-y-6">
      {/* Referral Stats */}
      {referralStats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-purple-950/30 rounded-lg p-4 flex items-center gap-3">
            <Users className="w-5 h-5 text-purple-400" />
            <div>
              <p className="text-sm text-purple-300/70">Total Referrals</p>
              <p className="text-2xl font-bold text-white">{referralStats.referralCount}</p>
            </div>
          </div>
          <div className="bg-purple-950/30 rounded-lg p-4 flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <div>
              <p className="text-sm text-purple-300/70">Credits Earned</p>
              <p className="text-2xl font-bold text-white">{referralStats.creditsEarned}</p>
            </div>
          </div>
          <div className="bg-purple-950/30 rounded-lg p-4 flex items-center gap-3">
            <Trophy className="w-5 h-5 text-purple-400" />
            <div>
              <p className="text-sm text-purple-300/70">Current Tier</p>
              <p className="text-2xl font-bold text-white">{currentTier}</p>
            </div>
          </div>
        </div>
      )}

      {/* Progress to Next Tier */}
      {referralStats && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-purple-300/70">
            <span>Progress to Tier {currentTier + 1}</span>
            <span>{referralStats.referralCount % 5}/5 referrals</span>
          </div>
          <Progress value={nextTierProgress} className="h-2" />
        </div>
      )}

      {/* Referral Code Management */}
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

        {/* QR Code */}
        {referralCode && <ReferralQRCode code={referralCode} />}

        {/* Use Referral Code */}
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
    </div>
  );
}