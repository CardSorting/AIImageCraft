import { Shield, Swords, Zap, Sparkles } from "lucide-react";

interface StatDisplayProps {
  icon: 'swords' | 'shield' | 'zap' | 'sparkles';
  label: string;
  value: number;
  color: 'red' | 'blue' | 'yellow' | 'purple';
}

const iconComponents = {
  swords: Swords,
  shield: Shield,
  zap: Zap,
  sparkles: Sparkles,
};

export function StatDisplay({ icon, label, value, color }: StatDisplayProps) {
  const Icon = iconComponents[icon];
  const colorStyles = {
    red: "from-red-500/20 to-red-500/10 border-red-500/30",
    blue: "from-blue-500/20 to-blue-500/10 border-blue-500/30",
    yellow: "from-yellow-500/20 to-yellow-500/10 border-yellow-500/30",
    purple: "from-purple-500/20 to-purple-500/10 border-purple-500/30",
  };

  return (
    <div className={`
      flex items-center gap-1.5 rounded-lg p-1.5
      bg-gradient-to-r ${colorStyles[color]}
      border border-white/10 backdrop-blur-sm
      transition-colors duration-300 hover:bg-opacity-75
    `}>
      <Icon className="h-3 w-3" />
      <span className="text-white/70 text-xs font-medium">{label}</span>
      <span className="text-white font-bold text-xs ml-auto">{value}</span>
    </div>
  );
}
