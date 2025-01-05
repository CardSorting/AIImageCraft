import { motion } from "framer-motion";
import { Trophy, Gift, Star, Lock } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface MilestoneProps {
  position: number;
  referralCount: number;
  currentCount: number;
  reward: number;
  description: string;
}

const Milestone = ({ position, referralCount, currentCount, reward, description }: MilestoneProps) => {
  const isCompleted = currentCount >= referralCount;
  const isCurrent = currentCount < referralCount && currentCount >= (referralCount - 5);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <motion.div
            className={`relative ${position % 2 === 0 ? 'mt-8' : 'mb-8'}`}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: position * 0.1 }}
          >
            <motion.div
              className={`w-12 h-12 rounded-full flex items-center justify-center ${
                isCompleted
                  ? "bg-gradient-to-br from-purple-500 to-blue-500"
                  : isCurrent
                  ? "bg-gradient-to-br from-purple-600/50 to-blue-600/50"
                  : "bg-gray-800/50"
              }`}
              whileHover={{ scale: 1.1 }}
            >
              {isCompleted ? (
                <Trophy className="w-6 h-6 text-yellow-300" />
              ) : isCurrent ? (
                <Star className="w-6 h-6 text-purple-300" />
              ) : (
                <Lock className="w-6 h-6 text-gray-400" />
              )}
            </motion.div>
            {isCurrent && (
              <motion.div
                className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-green-500"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
            )}
          </motion.div>
        </TooltipTrigger>
        <TooltipContent 
          side={position % 2 === 0 ? "bottom" : "top"}
          className="bg-black/90 border-purple-500/20"
        >
          <div className="p-2 space-y-1">
            <p className="font-semibold text-purple-300">{description}</p>
            <div className="flex items-center gap-2 text-sm">
              <Gift className="w-4 h-4 text-purple-400" />
              <span>{reward} credits reward</span>
            </div>
            <div className="text-xs text-gray-400">
              {isCompleted ? "Completed!" : `${referralCount} referrals needed`}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export function ReferralProgressMap({ currentCount }: { currentCount: number }) {
  const milestones = [
    { referralCount: 5, reward: 25, description: "Referral Pioneer" },
    { referralCount: 10, reward: 35, description: "Community Builder" },
    { referralCount: 15, reward: 50, description: "Network Champion" },
    { referralCount: 20, reward: 75, description: "Influence Master" },
    { referralCount: 25, reward: 100, description: "Legendary Connector" },
  ];

  return (
    <div className="relative py-16">
      {/* Progress Path */}
      <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-800 -translate-y-1/2">
        <motion.div
          className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
          initial={{ width: 0 }}
          animate={{ width: `${Math.min((currentCount / 25) * 100, 100)}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </div>

      {/* Milestones */}
      <div className="relative grid grid-cols-5 gap-4">
        {milestones.map((milestone, index) => (
          <Milestone
            key={milestone.referralCount}
            position={index}
            currentCount={currentCount}
            {...milestone}
          />
        ))}
      </div>
    </div>
  );
}
