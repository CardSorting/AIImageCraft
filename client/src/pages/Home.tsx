import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import PromptForm from "@/components/PromptForm";
import ImageCard from "@/components/ImageCard";
import LoadingAnimation from "@/components/LoadingAnimation";

export default function Home() {
  const [images, setImages] = useState<string[]>([]);
  const { toast } = useToast();

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
      setImages((prev) => [data.imageUrl, ...prev]);
      toast({
        title: "Image generated successfully!",
        description: "Your AI artwork is ready to view.",
      });
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
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl md:text-6xl font-bold text-white text-center mb-8 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
          AI Image Generator
        </h1>

        <Card className="w-full max-w-2xl mx-auto backdrop-blur-sm bg-black/30 border-purple-500/20">
          <CardContent className="pt-6">
            <PromptForm onSubmit={(prompt) => generateImage(prompt)} />
          </CardContent>
        </Card>

        {isPending && <LoadingAnimation />}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
          {images.map((imageUrl, index) => (
            <ImageCard key={index} imageUrl={imageUrl} />
          ))}
        </div>
      </div>
    </div>
  );
}
