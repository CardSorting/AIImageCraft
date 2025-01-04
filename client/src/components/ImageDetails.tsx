import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import type { Image } from "@/pages/Gallery";

interface ImageDetailsProps {
  image: Image | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ImageDetails({ image, open, onOpenChange }: ImageDetailsProps) {
  if (!image) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl bg-black/80 border-purple-500/20">
        <DialogHeader>
          <DialogTitle className="text-white">Image Details</DialogTitle>
        </DialogHeader>
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <img
              src={image.url}
              alt="Generated artwork"
              className="w-full rounded-lg"
            />
          </div>
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-purple-300/70 mb-1">
                Prompt
              </h3>
              <p className="text-white">{image.prompt}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-purple-300/70 mb-1">
                Created
              </h3>
              <p className="text-white">
                {format(new Date(image.createdAt), "PPpp")}
              </p>
            </div>
            {image.tags && image.tags.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-purple-300/70 mb-2">
                  Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {image.tags.map((tag, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="bg-purple-500/20 text-purple-200 hover:bg-purple-500/30"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
