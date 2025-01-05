import { useState, useEffect as ReactuseEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Copy, RefreshCw, Sparkles, Trophy, Users, Lock, Star, Gift } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useReferral } from "../hooks/use-credits";
import { ReferralQRCode } from "./ReferralQRCode";
import { motion, AnimatePresence } from "framer-motion";

const TierBadge = ({ tier, isActive, isLocked, bonus }: { 
  tier: number; 
  isActive: boolean; 
  isLocked: boolean;
  bonus: number;
}) => (
  <motion.div
    initial={{ scale: 0.8, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    className={`relative rounded-lg p-4 ${
      isActive 
        ? "bg-gradient-to-br from-purple-600 to-blue-600 text-white" 
        : isLocked
          ? "bg-gray-800/50 text-gray-400"
          : "bg-purple-950/30 text-purple-300"
    }`}
  >
    <div className="flex items-center gap-2">
      {isLocked ? (
        <Lock className="w-5 h-5" />
      ) : (
        <Trophy className={`w-5 h-5 ${isActive ? "text-yellow-300" : ""}`} />
      )}
      <span className="font-bold">Tier {tier}</span>
    </div>
    <div className="mt-2 text-sm">
      {isLocked ? (
        "Locked"
      ) : (
        <>
          <Star className="inline-block w-4 h-4 mr-1 text-yellow-300" />
          {bonus} credits per referral
        </>
      )}
    </div>
    {isActive && (
      <motion.div
        className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-green-500"
        initial={{ scale: 0 }}
        animate={{ scale: [0, 1.2, 1] }}
        transition={{ duration: 0.3 }}
      />
    )}
  </motion.div>
);

const RewardAnimation = ({ show }: { show: boolean }) => (
  <AnimatePresence>
    {show && (
      <motion.div
        initial={{ scale: 0, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0, y: -50 }}
        className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
      >
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-8 rounded-2xl shadow-xl">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, ease: "linear" }}
          >
            <Gift className="w-16 h-16 text-white" />
          </motion.div>
          <p className="mt-4 text-xl font-bold text-white text-center">New Tier Unlocked!</p>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);

export function ReferralCode() {
  const [showInput, setShowInput] = useState(false);
  const [referralToUse, setReferralToUse] = useState("");
  const [showReward, setShowReward] = useState(false);
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

  const currentTier = referralStats ? Math.floor(referralStats.referralCount / 5) + 1 : 1;

  // Show reward animation when tier changes
  ReactuseEffect(() => {
    if (referralStats?.referralCount && referralStats.referralCount % 5 === 0) {
      setShowReward(true);
      setTimeout(() => setShowReward(false), 3000);
    }
  }, [referralStats?.referralCount]);

  return (
    <div className="space-y-6">
      <RewardAnimation show={showReward} />

      {/* Tier Badges */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((tier) => (
          <TierBadge
            key={tier}
            tier={tier}
            isActive={currentTier === tier}
            isLocked={currentTier < tier}
            bonus={
              tier === 1 ? 5 :
              tier === 2 ? 7 :
              tier === 3 ? 10 :
              15
            }
          />
        ))}
      </div>

      {/* Stats Cards */}
      {referralStats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-purple-950/30 rounded-lg p-4 flex items-center gap-3"
          >
            <Users className="w-5 h-5 text-purple-400" />
            <div>
              <p className="text-sm text-purple-300/70">Total Referrals</p>
              <motion.p
                key={referralStats.referralCount}
                initial={{ scale: 1.2, color: "#A855F7" }}
                animate={{ scale: 1, color: "#FFFFFF" }}
                className="text-2xl font-bold"
              >
                {referralStats.referralCount}
              </motion.p>
            </div>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-purple-950/30 rounded-lg p-4 flex items-center gap-3"
          >
            <Sparkles className="w-5 h-5 text-purple-400" />
            <div>
              <p className="text-sm text-purple-300/70">Credits Earned</p>
              <motion.p
                key={referralStats.creditsEarned}
                initial={{ scale: 1.2, color: "#A855F7" }}
                animate={{ scale: 1, color: "#FFFFFF" }}
                className="text-2xl font-bold"
              >
                {referralStats.creditsEarned}
              </motion.p>
            </div>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-purple-950/30 rounded-lg p-4 flex items-center gap-3"
          >
            <Trophy className="w-5 h-5 text-purple-400" />
            <div>
              <p className="text-sm text-purple-300/70">Current Tier</p>
              <motion.p
                key={currentTier}
                initial={{ scale: 1.2, color: "#A855F7" }}
                animate={{ scale: 1, color: "#FFFFFF" }}
                className="text-2xl font-bold"
              >
                {currentTier}
              </motion.p>
            </div>
          </motion.div>
        </div>
      )}

      {/* Progress to Next Tier */}
      {referralStats && (
        <motion.div 
          className="space-y-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex justify-between text-sm text-purple-300/70">
            <span>Progress to Tier {currentTier + 1}</span>
            <span>{referralStats.referralCount % 5}/5 referrals</span>
          </div>
          <div className="relative">
            <Progress value={nextTierProgress} className="h-2" />
            <motion.div
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-purple-500/20 to-blue-500/20"
              style={{ width: `${nextTierProgress}%` }}
              animate={{
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
              }}
            />
          </div>
        </motion.div>
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