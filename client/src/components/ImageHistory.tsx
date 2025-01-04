import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ImageHistoryProps {
  images: Array<{ url: string; prompt: string; createdAt: string }>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ImageHistory({ images, open, onOpenChange }: ImageHistoryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images.length) return null;

  const currentImage = images[currentIndex];
  
  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : prev));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : prev));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl bg-black/80 border-purple-500/20">
        <DialogHeader>
          <DialogTitle className="text-white">Generated Image History</DialogTitle>
          <DialogDescription className="text-purple-300/70">
            Your recently generated AI artwork ({currentIndex + 1} of {images.length})
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <div className="w-full aspect-square rounded-lg overflow-hidden">
            <img
              src={currentImage.url}
              alt={currentImage.prompt}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="absolute inset-0 flex items-center justify-between p-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={goToPrevious}
              disabled={currentIndex === 0}
              className="h-10 w-10 rounded-full bg-black/50 hover:bg-black/70 text-white"
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={goToNext}
              disabled={currentIndex === images.length - 1}
              className="h-10 w-10 rounded-full bg-black/50 hover:bg-black/70 text-white"
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <p className="text-sm text-white font-medium">Prompt</p>
          <p className="text-sm text-purple-300/70">{currentImage.prompt}</p>
          <p className="text-xs text-purple-300/50">
            Generated on {new Date(currentImage.createdAt).toLocaleDateString()}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
