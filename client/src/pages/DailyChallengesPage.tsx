import { DailyChallenges } from "@/features/daily-challenges/components/DailyChallenges";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

export function DailyChallengesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-purple-950">
      {/* Hero Section */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative h-48 bg-gradient-to-r from-purple-600 to-blue-600 overflow-hidden"
      >
        <div className="absolute inset-0 bg-[url('/patterns/grid.svg')] opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50" />
        <div className="container mx-auto h-full flex items-end px-4 pb-8">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-6 h-6 text-yellow-400" />
              <h1 className="text-3xl font-bold text-white">Daily Challenges</h1>
            </div>
            <p className="text-purple-200/80">Complete challenges, earn rewards, and level up your creative journey!</p>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="container mx-auto px-4 -mt-8 pb-16">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-black/50 backdrop-blur-xl rounded-xl border border-purple-500/20 p-6"
        >
          <DailyChallenges />
        </motion.div>
      </div>
    </div>
  );
}