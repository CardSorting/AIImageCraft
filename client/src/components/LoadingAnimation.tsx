import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";

export default function LoadingAnimation() {
  return (
    <Card className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50">
      <div className="flex flex-col items-center space-y-6">
        <div className="relative">
          {/* Outer spinning ring */}
          <motion.div 
            className="absolute inset-0 w-24 h-24 rounded-full border-4 border-purple-500/30"
            animate={{
              rotate: 360,
              scale: [1, 1.1, 1],
            }}
            transition={{
              rotate: {
                duration: 3,
                ease: "linear",
                repeat: Infinity,
              },
              scale: {
                duration: 2,
                ease: "easeInOut",
                repeat: Infinity,
              }
            }}
          />

          {/* Middle pulsing ring */}
          <motion.div 
            className="absolute inset-2 w-20 h-20 rounded-full border-4 border-blue-500/40"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 2,
              ease: "easeInOut",
              repeat: Infinity,
            }}
          />

          {/* Inner spinning ring */}
          <motion.div 
            className="absolute inset-4 w-16 h-16 rounded-full border-4 border-purple-400/50"
            animate={{
              rotate: -360,
            }}
            transition={{
              duration: 2,
              ease: "linear",
              repeat: Infinity,
            }}
          />

          {/* Center dot */}
          <motion.div 
            className="absolute inset-7 w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500"
            animate={{
              scale: [0.8, 1.1, 0.8],
            }}
            transition={{
              duration: 1.5,
              ease: "easeInOut",
              repeat: Infinity,
            }}
          />
        </div>

        {/* Loading text with gradient */}
        <div className="text-center space-y-2">
          <motion.h3 
            className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400"
            animate={{
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 2,
              ease: "easeInOut",
              repeat: Infinity,
            }}
          >
            Creating Your Vision
          </motion.h3>
          <p className="text-sm text-purple-300/70">
            Generating stunning AI artwork...
          </p>
        </div>
      </div>
    </Card>
  );
}