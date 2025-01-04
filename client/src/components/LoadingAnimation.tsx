import { Card } from "@/components/ui/card";

export default function LoadingAnimation() {
  return (
    <Card className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50">
      <div className="flex flex-col items-center space-y-4">
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 border-t-4 border-purple-500 rounded-full animate-spin"></div>
          <div className="absolute inset-2 border-t-4 border-blue-500 rounded-full animate-spin-reverse"></div>
        </div>
        <p className="text-white font-medium">Generating your image...</p>
      </div>
    </Card>
  );
}
