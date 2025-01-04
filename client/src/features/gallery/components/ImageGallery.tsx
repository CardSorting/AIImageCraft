import { useQuery } from "@tanstack/react-query";
import { Loader2, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import ImageGrid from "@/components/ImageGrid";
import type { Image } from "../types";

export function ImageGallery() {
  const { data: images, isLoading, refetch } = useQuery<Image[]>({
    queryKey: ["/api/images"],
  });

  if (isLoading) {
    return (
      <div className="flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
      </div>
    );
  }

  if (!images?.length) {
    return (
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
    );
  }

  return <ImageGrid images={images} onTradingCardCreated={refetch} />;
}
