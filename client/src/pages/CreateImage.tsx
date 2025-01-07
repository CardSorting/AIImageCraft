import { useState, useEffect, useCallback } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { History, Sparkles } from "lucide-react";
import PromptForm from "@/components/PromptForm";
import LoadingAnimation from "@/components/LoadingAnimation";
import ImageHistory from "@/components/ImageHistory";
import Header from "@/components/Header";
import { motion, AnimatePresence } from "framer-motion";

interface TaskResponse {
  taskId: string;
  status: 'completed' | 'processing' | 'pending' | 'failed';
  imageUrls?: string[];
  error?: string;
  prompt?: string;
  nextPoll?: number; // Added nextPoll property
}

interface GeneratedImage {
  id: number;
  url: string;
  prompt: string;
  createdAt: string;
  variationIndex?: number;
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
  const [currentImages, setCurrentImages] = useState<GeneratedImage[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [currentTask, setCurrentTask] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: images = [], refetch: refetchImages } = useQuery<GeneratedImage[]>({
    queryKey: ["/api/images"],
  });

  // Poll task status when there's an active task
  const checkTaskStatus = useCallback(async (taskId: string, attempt = 1) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}?attempt=${attempt}`);
      if (!res.ok) throw new Error(await res.text());

      const data: TaskResponse = await res.json();

      if (data.status === "completed" && data.imageUrls) {
        const newImages = data.imageUrls.map((url, index) => ({
          id: index,
          url,
          prompt: data.prompt || "",
          createdAt: new Date().toISOString(),
          variationIndex: index
        }));

        setCurrentImages(newImages);
        setSelectedImageIndex(0);
        setCurrentTask(null);
        toast({
          title: "✨ Creation Complete!",
          description: "Select your favorite variation from the generated options.",
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
      } else if (data.nextPoll) {
        // Schedule next poll with the server-recommended interval
        setTimeout(() => {
          checkTaskStatus(taskId, attempt + 1);
        }, data.nextPoll);
      }
    } catch (error) {
      console.error("Error checking task status:", error);
      // Stop polling on error
      setCurrentTask(null);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to check generation status",
      });
    }
  }, [toast, refetchImages]);

  useEffect(() => {
    if (!currentTask) return;

    // Start polling with attempt 1
    checkTaskStatus(currentTask, 1);

    // Cleanup is not needed anymore since we're using setTimeout
    return () => {};
  }, [currentTask, checkTaskStatus]);

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

        {/* Generated Images Display */}
        <AnimatePresence mode="wait">
          {currentImages.length > 0 && !isPending && !currentTask && (
            <motion.div
              key="image-variations"
              variants={itemVariants}
              className="max-w-4xl mx-auto"
            >
              <Card className="backdrop-blur-sm bg-black/30 border-purple-500/20 overflow-hidden">
                <CardContent className="pt-6 space-y-6">
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-semibold text-white mb-2">Choose Your Favorite Variation</h3>
                    <p className="text-sm text-purple-300/70">Click on an image to select it</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {currentImages.map((image, index) => (
                      <div
                        key={image.id}
                        className={`
                          relative group cursor-pointer rounded-lg overflow-hidden
                          transition-all duration-300 transform hover:scale-[1.02]
                          ${selectedImageIndex === index ? 'ring-2 ring-purple-500 scale-[1.02]' : ''}
                        `}
                        onClick={() => setSelectedImageIndex(index)}
                      >
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <motion.img
                          initial={{ scale: 1.1, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ duration: 0.5, delay: index * 0.1 }}
                          src={image.url}
                          alt={`Variation ${index + 1}`}
                          className="w-full aspect-square object-cover"
                        />
                        <div className="absolute bottom-2 left-2 right-2 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-sm font-medium bg-black/50 px-2 py-1 rounded">
                            Variation {index + 1}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-purple-400" />
                      <h3 className="text-lg font-semibold text-white">Your Creation</h3>
                    </div>
                    <p className="text-sm text-purple-300/70 italic">"{currentImages[selectedImageIndex]?.prompt}"</p>
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
          images={images.filter(img => !currentImages.some(current => current.url === img.url))}
          open={showHistory}
          onOpenChange={setShowHistory}
        />
      </motion.div>
    </div>
  );
}