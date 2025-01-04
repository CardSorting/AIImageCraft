import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import ImageCard from "@/components/ImageCard";
import { Loader2 } from "lucide-react";

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
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {images?.map((image: { url: string }, index: number) => (
              <ImageCard key={index} imageUrl={image.url} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
