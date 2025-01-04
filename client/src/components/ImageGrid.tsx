import { useState } from "react";
import ImageCard from "@/components/ImageCard";
import ImageDetails from "@/components/ImageDetails";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Image } from "@/pages/Gallery";

interface ImageGridProps {
  images: Image[];
  onTradingCardCreated?: () => void;
}

function Pagination({ currentPage, totalPages, onPageChange }: { 
  currentPage: number; 
  totalPages: number; 
  onPageChange: (page: number) => void;
}) {
  return (
    <div className="flex items-center justify-center mt-8 gap-2">
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="w-8 h-8 p-0"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <div className="flex items-center gap-1">
        {Array.from({ length: totalPages }, (_, i) => (
          <Button
            key={i + 1}
            variant={currentPage === i + 1 ? "default" : "outline"}
            size="icon"
            onClick={() => onPageChange(i + 1)}
            className={`w-8 h-8 p-0 ${
              currentPage === i + 1
                ? "bg-purple-600 hover:bg-purple-700"
                : ""
            }`}
          >
            {i + 1}
          </Button>
        ))}
      </div>
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="w-8 h-8 p-0"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

export default function ImageGrid({ images, onTradingCardCreated }: ImageGridProps) {
  const [selectedImage, setSelectedImage] = useState<Image | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const IMAGES_PER_PAGE = 12;

  const totalPages = Math.ceil(images.length / IMAGES_PER_PAGE);
  const paginatedImages = images.slice(
    (currentPage - 1) * IMAGES_PER_PAGE,
    currentPage * IMAGES_PER_PAGE
  );

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {paginatedImages.map((image) => (
          <div 
            key={image.id} 
            onClick={() => setSelectedImage(image)} 
            className="cursor-pointer transform transition-all duration-300 hover:scale-105"
          >
            <div className="relative aspect-square w-full rounded-xl overflow-hidden shadow-lg hover:shadow-xl bg-black/20">
              <div className="absolute inset-0 flex items-center justify-center">
                <ImageCard
                  imageId={image.id}
                  imageUrl={image.url}
                  tags={image.tags}
                  onTradingCardCreated={onTradingCardCreated}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}

      <ImageDetails
        image={selectedImage}
        open={!!selectedImage}
        onOpenChange={(open) => !open && setSelectedImage(null)}
      />
    </>
  );
}