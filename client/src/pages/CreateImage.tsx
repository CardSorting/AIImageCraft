import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { History, ImageIcon, Sparkles } from "lucide-react";
import PromptForm from "@/components/PromptForm";
import LoadingAnimation from "@/components/LoadingAnimation";
import ImageHistory from "@/components/ImageHistory";
import Header from "@/components/Header";
import { motion, AnimatePresence } from "framer-motion";

interface GeneratedImage {
  url: string;
  prompt: string;
  createdAt: string;
}

interface TaskResponse {
  taskId: string;
  status: "pending" | "completed" | "failed";
  imageUrl?: string;
  error?: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100
    }
  }
};

export default function CreateImage() {
  const [showHistory, setShowHistory] = useState(false);
  const [currentImage, setCurrentImage] = useState<GeneratedImage | null>(null);
  const [currentTask, setCurrentTask] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: images = [], refetch: refetchImages } = useQuery<GeneratedImage[]>({
    queryKey: ["/api/images"],
  });

  // Poll task status when there's an active task
  useEffect(() => {
    if (!currentTask) return;

    const checkStatus = async () => {
      try {
        const res = await fetch(`/api/tasks/${currentTask}`);
        if (!res.ok) throw new Error(await res.text());

        const data: TaskResponse = await res.json();

        if (data.status === "completed" && data.imageUrl) {
          setCurrentImage({
            url: data.imageUrl,
            prompt: data.prompt,
            createdAt: new Date().toISOString(),
          });
          setCurrentTask(null);
          toast({
            title: "✨ Creation Complete!",
            description: "Your AI masterpiece has been brought to life.",
            className: "bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-purple-500/20",
          });
          refetchImages();
        } else if (data.status === "failed") {
          setCurrentTask(null);
          toast({
            variant: "destructive",
            title: "Generation Failed",
            description: data.error || "Unable to create your image",
            className: "border-red-500/20",
          });
        }
      } catch (error) {
        console.error("Error checking task status:", error);
      }
    };

    const interval = setInterval(checkStatus, 2000);
    return () => clearInterval(interval);
  }, [currentTask, toast, refetchImages]);

  const { mutate: generateImage, isPending } = useMutation({
    mutationFn: async (prompt: string) => {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      return res.json();
    },
    onSuccess: (data: TaskResponse) => {
      setCurrentTask(data.taskId);
      toast({
        title: "🎨 Starting Creation",
        description: "Your vision is being transformed into art...",
        className: "bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-purple-500/20",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
        className: "border-red-500/20",
      });
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black overflow-hidden">
      <Header />

      <motion.div 
        className="container mx-auto px-4 py-12 space-y-12"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Hero Section */}
        <motion.div 
          className="flex flex-col items-center text-center space-y-6"
          variants={itemVariants}
        >
          <div className="relative">
            <motion.div
              className="absolute -inset-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full blur opacity-25"
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.2, 0.3, 0.2],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
              }}
            />
            <h1 className="relative text-5xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
              Dream it.
              <br />
              Create it.
            </h1>
          </div>
          <p className="text-xl text-purple-300/70 max-w-2xl">
            Transform your imagination into stunning AI-generated artwork.
            Perfect for creating unique trading cards and digital masterpieces.
          </p>
        </motion.div>

        {/* Creation Form */}
        <motion.div 
          className="relative max-w-2xl mx-auto"
          variants={itemVariants}
        >
          <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl blur opacity-25"></div>
          <Card className="relative backdrop-blur-sm bg-black/30 border-purple-500/20">
            <CardContent className="pt-6">
              <PromptForm 
                onSubmit={(prompt) => generateImage(prompt)} 
                isSubmitting={isPending || !!currentTask}
              />
            </CardContent>
          </Card>

          <AnimatePresence>
            {(isPending || currentTask) && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="absolute inset-0 rounded-xl overflow-hidden"
              >
                <LoadingAnimation />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Generated Image Display */}
        <AnimatePresence mode="wait">
          {currentImage && !isPending && !currentTask && (
            <motion.div
              key={currentImage.url}
              variants={itemVariants}
              className="max-w-2xl mx-auto"
            >
              <Card className="backdrop-blur-sm bg-black/30 border-purple-500/20 overflow-hidden">
                <CardContent className="pt-6 space-y-6">
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                    <div className="relative aspect-square rounded-lg overflow-hidden">
                      <motion.img
                        initial={{ scale: 1.1, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.5 }}
                        src={currentImage.url}
                        alt={currentImage.prompt}
                        className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-105"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-purple-400" />
                      <h3 className="text-lg font-semibold text-white">Your Creation</h3>
                    </div>
                    <p className="text-sm text-purple-300/70 italic">"{currentImage.prompt}"</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* History Button */}
        <motion.div 
          variants={itemVariants}
          className="flex justify-center"
        >
          <Button
            onClick={() => setShowHistory(true)}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700
                     transform transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-purple-500/20"
            size="lg"
          >
            <History className="mr-2 h-5 w-5" />
            View Creation History
          </Button>
        </motion.div>

        {/* History Modal */}
        <ImageHistory
          images={images.filter(img => img.url !== currentImage?.url)}
          open={showHistory}
          onOpenChange={setShowHistory}
        />
      </motion.div>
    </div>
  );
}