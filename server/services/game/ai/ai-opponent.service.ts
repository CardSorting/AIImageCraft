import { db } from "@db";
import { 
  tradingCards,
  type SelectTradingCard
} from "@db/schema";
import { sql } from "drizzle-orm";

export class AIOpponentService {
  static async buildDeck(): Promise<SelectTradingCard[]> {
    // Fetch a random selection of cards from the global pool
    const cards = await db.query.tradingCards.findMany({
      orderBy: sql`RANDOM()`,
      limit: 8, // AI needs 8 cards for a game
      with: {
        image: true
      }
    });

    if (cards.length < 8) {
      throw new Error("Not enough cards in the global pool to create an AI deck");
    }

    return cards;
  }

  static getAIDecision(playerCard: SelectTradingCard, aiCard: SelectTradingCard): string {
    // Implement basic AI decision making - can be expanded for more complex strategies
    const playerValue = this.calculateCardValue(playerCard);
    const aiValue = this.calculateCardValue(aiCard);
    
    if (aiValue > playerValue) {
      return "AI plays confidently with a stronger card";
    } else if (aiValue === playerValue) {
      return "AI prepares for war with an equal strength card";
    } else {
      return "AI plays cautiously with a weaker card";
    }
  }

  private static calculateCardValue(card: SelectTradingCard): number {
    const stats = card.powerStats as any;
    return (stats.attack * 2) + stats.defense + stats.speed + (stats.hp / 2);
  }
}
