import { useState } from "react";
import ImageCard from "@/components/ImageCard";
import ImageDetails from "@/components/ImageDetails";
import type { Image } from "@/pages/Gallery";

interface ImageGridProps {
  images: Image[];
  onTradingCardCreated?: () => void;
}

export default function ImageGrid({ images, onTradingCardCreated }: ImageGridProps) {
  const [selectedImage, setSelectedImage] = useState<Image | null>(null);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {images.map((image) => (
          <div key={image.id} onClick={() => setSelectedImage(image)} className="cursor-pointer">
            <ImageCard
              imageId={image.id}
              imageUrl={image.url}
              tags={image.tags}
              onTradingCardCreated={onTradingCardCreated}
            />
          </div>
        ))}
      </div>

      <ImageDetails
        image={selectedImage}
        open={!!selectedImage}
        onOpenChange={(open) => !open && setSelectedImage(null)}
      />
    </>
  );
}
