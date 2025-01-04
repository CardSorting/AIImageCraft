import { z } from "zod";

export const tradingCardSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string(),
  elementalType: z.string(),
  rarity: z.string(),
  powerStats: z.object({
    attack: z.number(),
    defense: z.number(),
    speed: z.number(),
    magic: z.number(),
  }),
  image: z.object({
    url: z.string(),
  }),
  createdAt: z.string(),
  creator: z.object({
    id: z.number(),
    username: z.string(),
  }).optional(),
});

export type TradingCard = z.infer<typeof tradingCardSchema>;

// Available options for card attributes
export const ELEMENTAL_TYPES = [
  "Fire", "Water", "Earth", "Air", 
  "Light", "Dark", "Nature", "Electric",
  "Ice", "Psychic", "Metal", "Dragon"
] as const;

export const RARITIES = [
  "Common", "Uncommon", "Rare", 
  "Epic", "Legendary", "Mythic"
] as const;

export type ElementalType = (typeof ELEMENTAL_TYPES)[number];
export type Rarity = (typeof RARITIES)[number];
