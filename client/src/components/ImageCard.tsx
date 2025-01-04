import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Sparkles } from "lucide-react";
import CreateTradingCard from "@/components/CreateTradingCard";

interface ImageCardProps {
  imageId: number;
  imageUrl: string;
  tags?: string[];
  onTradingCardCreated?: () => void;
}

export default function ImageCard({ 
  imageId, 
  imageUrl, 
  tags = [], 
  onTradingCardCreated 
}: ImageCardProps) {
  const [isCreateCardOpen, setIsCreateCardOpen] = useState(false);

  const handleDownload = async () => {
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ai-generated-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <>
      <Card className="group relative overflow-hidden backdrop-blur-sm bg-black/30 border-purple-500/20">
        <img
          src={imageUrl}
          alt="AI generated"
          className="w-full h-64 object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="absolute bottom-4 left-4 right-4">
            <div className="flex flex-wrap gap-2 mb-4">
              {tags.map((tag, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="bg-purple-500/20 text-purple-200 hover:bg-purple-500/30"
                >
                  {tag}
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="icon"
                onClick={handleDownload}
                className="bg-white/10 hover:bg-white/20 backdrop-blur-sm"
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                variant="secondary"
                onClick={() => setIsCreateCardOpen(true)}
                className="flex-1 bg-purple-500/20 hover:bg-purple-500/30 backdrop-blur-sm"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Create Card
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <CreateTradingCard
        imageId={imageId}
        imageUrl={imageUrl}
        open={isCreateCardOpen}
        onOpenChange={setIsCreateCardOpen}
        onSuccess={onTradingCardCreated}
      />
    </>
  );
}