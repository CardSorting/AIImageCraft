import {
  FacebookShareButton,
  TwitterShareButton,
  LinkedinShareButton,
  WhatsappShareButton,
  TelegramShareButton,
  FacebookIcon,
  TwitterIcon,
  LinkedinIcon,
  WhatsappIcon,
  TelegramIcon,
} from "react-share";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Share2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

interface ReferralShareProps {
  referralCode: string;
}

export function ReferralShare({ referralCode }: ReferralShareProps) {
  const [showShare, setShowShare] = useState(false);
  const { toast } = useToast();
  const shareUrl = `${window.location.origin}/join?ref=${referralCode}`;
  const title = "Join me on our digital card battle platform! Use my referral code for bonus credits! 🎮✨";

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Copied!",
        description: "Referral link copied to clipboard",
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Failed to copy",
        description: "Please try copying manually",
      });
    }
  };

  return (
    <div className="space-y-4">
      <Button
        variant="outline"
        onClick={() => setShowShare(!showShare)}
        className="w-full sm:w-auto"
      >
        <Share2 className="w-4 h-4 mr-2" />
        Share Referral Link
      </Button>

      <AnimatePresence>
        {showShare && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            <div className="flex gap-2">
              <Input
                value={shareUrl}
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

            <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
              <FacebookShareButton url={shareUrl} quote={title}>
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                  <FacebookIcon size={32} round />
                </motion.div>
              </FacebookShareButton>

              <TwitterShareButton url={shareUrl} title={title}>
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                  <TwitterIcon size={32} round />
                </motion.div>
              </TwitterShareButton>

              <LinkedinShareButton url={shareUrl} title={title}>
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                  <LinkedinIcon size={32} round />
                </motion.div>
              </LinkedinShareButton>

              <WhatsappShareButton url={shareUrl} title={title}>
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                  <WhatsappIcon size={32} round />
                </motion.div>
              </WhatsappShareButton>

              <TelegramShareButton url={shareUrl} title={title}>
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                  <TelegramIcon size={32} round />
                </motion.div>
              </TelegramShareButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
