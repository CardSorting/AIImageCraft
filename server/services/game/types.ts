import { type SelectGame, type SelectGameCard, type SelectTradingCard } from "@db/schema";

export type GameState = {
  warActive: boolean;
  cardsInWar: number;
  lastAction: string;
  player1Cards: number;
  player2Cards: number;
  isAIGame?: boolean;
};

export type PowerStats = {
  attack: number;
  defense: number;
  speed: number;
  hp: number;
};

export type GameServiceTransaction = any; // TODO: Type this properly when we have the proper type