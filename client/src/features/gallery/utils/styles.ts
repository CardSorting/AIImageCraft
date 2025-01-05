export function getElementalTypeStyle(type: string): string {
  const styles = {
    Fire: "bg-gradient-to-br from-red-600/20 to-orange-500/20 border-2 border-red-500/30",
    Water: "bg-gradient-to-br from-blue-600/20 to-cyan-500/20 border-2 border-blue-500/30",
    Earth: "bg-gradient-to-br from-green-600/20 to-emerald-500/20 border-2 border-green-500/30",
    Air: "bg-gradient-to-br from-sky-600/20 to-indigo-500/20 border-2 border-sky-500/30",
    Light: "bg-gradient-to-br from-yellow-400/20 to-amber-500/20 border-2 border-yellow-400/30",
    Dark: "bg-gradient-to-br from-purple-600/20 to-violet-500/20 border-2 border-purple-500/30",
    Nature: "bg-gradient-to-br from-lime-600/20 to-green-500/20 border-2 border-lime-500/30",
    Electric: "bg-gradient-to-br from-yellow-400/20 to-amber-500/20 border-2 border-yellow-400/30",
    Ice: "bg-gradient-to-br from-cyan-400/20 to-blue-500/20 border-2 border-cyan-400/30",
    Psychic: "bg-gradient-to-br from-pink-600/20 to-purple-500/20 border-2 border-pink-500/30",
    Metal: "bg-gradient-to-br from-gray-600/20 to-slate-500/20 border-2 border-gray-500/30",
    Dragon: "bg-gradient-to-br from-red-600/20 to-purple-500/20 border-2 border-red-500/30",
  };
  return styles[type as keyof typeof styles] || styles.Nature;
}

export function getElementalTypeBadgeStyle(type: string): string {
  const styles = {
    Fire: "bg-red-500/20 text-red-300",
    Water: "bg-blue-500/20 text-blue-300",
    Earth: "bg-green-500/20 text-green-300",
    Air: "bg-sky-500/20 text-sky-300",
    Light: "bg-yellow-400/20 text-yellow-300",
    Dark: "bg-purple-500/20 text-purple-300",
    Nature: "bg-lime-500/20 text-lime-300",
    Electric: "bg-yellow-400/20 text-yellow-300",
    Ice: "bg-cyan-400/20 text-cyan-300",
    Psychic: "bg-pink-500/20 text-pink-300",
    Metal: "bg-gray-500/20 text-gray-300",
    Dragon: "bg-red-500/20 text-red-300",
  };
  return styles[type as keyof typeof styles] || styles.Nature;
}

export function getRarityStyle(rarity: string): string {
  const styles = {
    Common: "bg-gray-500/20 text-gray-300 animate-common",
    Uncommon: "bg-green-500/20 text-green-300 animate-uncommon",
    Rare: "bg-blue-500/20 text-blue-300 animate-rare",
    Epic: "bg-purple-500/20 text-purple-300 animate-epic",
    Legendary: "bg-orange-500/20 text-orange-300 animate-legendary",
    Mythic: "bg-red-500/20 text-red-300 animate-mythic",
  };
  return styles[rarity as keyof typeof styles] || styles.Common;
}

export function getRarityOverlayStyle(rarity: string): string {
  const styles = {
    Common: "",
    Uncommon: "after:absolute after:inset-0 after:bg-gradient-to-t after:from-green-500/10 after:via-transparent after:to-transparent after:animate-uncommon",
    Rare: "after:absolute after:inset-0 after:bg-gradient-to-tr after:from-blue-500/20 after:via-blue-300/10 after:to-transparent after:animate-rare",
    Epic: "after:absolute after:inset-0 after:bg-gradient-to-r after:from-purple-500/20 after:via-pink-500/10 after:to-purple-500/20 after:animate-epic",
    Legendary: "after:absolute after:inset-0 after:bg-gradient-to-tr after:from-orange-500/30 after:via-yellow-500/20 after:to-transparent after:animate-legendary",
    Mythic: "after:absolute after:inset-0 after:bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] after:from-red-500/30 after:via-purple-500/20 after:to-transparent after:animate-mythic",
  };
  return styles[rarity as keyof typeof styles] || styles.Common;
}