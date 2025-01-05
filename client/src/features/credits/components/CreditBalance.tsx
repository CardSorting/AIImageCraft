import { Zap } from "lucide-react";
import { useCredits } from "../hooks/use-credits";

interface CreditBalanceProps {
  className?: string;
}

export function CreditBalance({ className }: CreditBalanceProps) {
  const { credits, isLoading } = useCredits();

  return (
    <div className={`flex items-center px-3 py-1.5 rounded-md bg-purple-500/10 border border-purple-500/20 ${className}`}>
      <Zap className="w-4 h-4 text-purple-400 mr-2" />
      <span className="text-purple-200">
        {isLoading ? "..." : `${credits} Pulse`}
      </span>
    </div>
  );
}
