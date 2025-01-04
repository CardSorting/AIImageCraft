import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import Header from "@/components/Header";
import ImageCard from "@/components/ImageCard";
import { Button } from "@/components/ui/button";
import { Loader2, ImagePlus } from "lucide-react";

export default function Gallery() {
  const { data: images, isLoading } = useQuery({
    queryKey: ["/api/images"],
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl md:text-6xl font-bold text-white text-center mb-8 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
          Your Gallery
        </h1>

        {isLoading ? (
          <div className="flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
          </div>
        ) : !images?.length ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <div className="w-24 h-24 rounded-full bg-purple-500/10 flex items-center justify-center mb-6">
              <ImagePlus className="w-12 h-12 text-purple-400" />
            </div>
            <h2 className="text-2xl font-semibold text-white mb-2">
              Your gallery is empty
            </h2>
            <p className="text-purple-300/70 mb-6 max-w-md">
              Start creating amazing AI-generated images with just a text prompt!
            </p>
            <Link href="/create">
              <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                <ImagePlus className="mr-2 h-4 w-4" />
                Create Your First Image
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {images.map((image: { url: string }, index: number) => (
              <ImageCard key={index} imageUrl={image.url} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}