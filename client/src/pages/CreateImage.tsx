import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { History, ImageIcon } from "lucide-react";
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
            title: "Image generated successfully!",
            description: "Your AI artwork has been created.",
          });
          refetchImages();
        } else if (data.status === "failed") {
          setCurrentTask(null);
          toast({
            variant: "destructive",
            title: "Error generating image",
            description: data.error || "Failed to generate image",
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
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error generating image",
        description: error.message,
      });
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black">
      <Header />
      <div className="container mx-auto px-4 py-8 space-y-8">
        <div className="flex flex-col items-center mb-8 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400 mb-4"
          >
            Create Your Vision
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-purple-300/70 max-w-2xl"
          >
            Transform your ideas into stunning AI-generated artwork. Perfect for creating unique trading cards and digital art.
          </motion.p>
        </div>

        <div className="relative">
          <Card className="w-full max-w-2xl mx-auto backdrop-blur-sm bg-black/30 border-purple-500/20 overflow-hidden">
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
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm rounded-lg"
              >
                <LoadingAnimation />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence mode="wait">
          {currentImage && !isPending && !currentTask && (
            <motion.div
              key={currentImage.url}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-2xl mx-auto"
            >
              <Card className="backdrop-blur-sm bg-black/30 border-purple-500/20 overflow-hidden">
                <CardContent className="pt-6 space-y-4">
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                    <div className="relative aspect-square rounded-lg overflow-hidden">
                      <img
                        src={currentImage.url}
                        alt={currentImage.prompt}
                        className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-105"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-white">Generated Artwork</h3>
                    <p className="text-sm text-purple-300/70">{currentImage.prompt}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex justify-center mt-8"
        >
          <Button
            onClick={() => setShowHistory(true)}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            <History className="mr-2 h-4 w-4" />
            View Past Generations
          </Button>
        </motion.div>

        <ImageHistory
          images={images.filter(img => img.url !== currentImage?.url)}
          open={showHistory}
          onOpenChange={setShowHistory}
        />
      </div>
    </div>
  );
}