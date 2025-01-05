export const ELEMENTAL_TYPES = [
  "Fire", "Water", "Earth", "Air", 
  "Light", "Dark", "Nature", "Electric",
  "Ice", "Psychic", "Metal", "Dragon"
] as const;

export const RARITIES = [
  "Common", "Uncommon", "Rare", 
  "Epic", "Legendary", "Mythic"
] as const;

export type ElementalType = typeof ELEMENTAL_TYPES[number];
export type Rarity = typeof RARITIES[number];
