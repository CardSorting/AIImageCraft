import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { History } from "lucide-react";
import PromptForm from "@/components/PromptForm";
import LoadingAnimation from "@/components/LoadingAnimation";
import ImageHistory from "@/components/ImageHistory";
import Header from "@/components/Header";

interface GeneratedImage {
  url: string;
  prompt: string;
  createdAt: string;
}

export default function CreateImage() {
  const [showHistory, setShowHistory] = useState(false);
  const [currentImage, setCurrentImage] = useState<GeneratedImage | null>(null);
  const { toast } = useToast();

  const { data: images = [], refetch: refetchImages } = useQuery<GeneratedImage[]>({
    queryKey: ["/api/images"],
  });

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
    onSuccess: (data) => {
      const newImage = {
        url: data.imageUrl,
        prompt: data.prompt,
        createdAt: new Date().toISOString(),
      };
      setCurrentImage(newImage);
      toast({
        title: "Image generated successfully!",
        description: "Your AI artwork has been created.",
      });
      refetchImages();
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
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl md:text-6xl font-bold text-white bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
            Create New Image
          </h1>
          <Button
            onClick={() => setShowHistory(true)}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            <History className="mr-2 h-4 w-4" />
            View Past Generations
          </Button>
        </div>

        <Card className="w-full max-w-2xl mx-auto backdrop-blur-sm bg-black/30 border-purple-500/20">
          <CardContent className="pt-6">
            <PromptForm onSubmit={(prompt) => generateImage(prompt)} />
          </CardContent>
        </Card>

        {isPending && <LoadingAnimation />}

        {currentImage && !isPending && (
          <div className="mt-8 w-full max-w-2xl mx-auto">
            <Card className="backdrop-blur-sm bg-black/30 border-purple-500/20">
              <CardContent className="pt-6">
                <div className="aspect-square rounded-lg overflow-hidden">
                  <img
                    src={currentImage.url}
                    alt={currentImage.prompt}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="mt-4">
                  <p className="text-sm text-purple-300/70">{currentImage.prompt}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <ImageHistory
          images={images.filter(img => img.url !== currentImage?.url)}
          open={showHistory}
          onOpenChange={setShowHistory}
        />
      </div>
    </div>
  );
}