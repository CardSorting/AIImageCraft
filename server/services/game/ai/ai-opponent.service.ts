import { db } from "@db";
import { 
  tradingCards,
  cardTemplates,
  type SelectTradingCard,
  type SelectCardTemplate
} from "@db/schema";
import { sql, eq } from "drizzle-orm";
import { PowerStats } from "../types";

export class AIOpponentService {
  static async buildDeck(): Promise<SelectTradingCard[]> {
    const aiId = -1; // AI's user ID

    // Get random card templates from the global pool
    const templates = await db.query.cardTemplates.findMany({
      orderBy: sql`RANDOM()`,
      limit: 8, // AI needs 8 cards for a game
      with: {
        image: true,
      }
    });

    if (templates.length < 8) {
      throw new Error("Not enough card templates in the global pool");
    }

    // Create temporary trading cards for the AI based on the templates
    const aiCards = await Promise.all(templates.map(async (template) => {
      const [card] = await db.insert(tradingCards)
        .values({
          templateId: template.id,
          userId: aiId,
        })
        .returning();

      return {
        ...card,
        template,
      };
    }));

    return aiCards;
  }

  static async getAIDecision(playerCard: SelectTradingCard, aiCard: SelectTradingCard): Promise<string> {
    const [playerTemplate] = await db.select().from(cardTemplates).where(eq(cardTemplates.id, playerCard.templateId));
    const [aiTemplate] = await db.select().from(cardTemplates).where(eq(cardTemplates.id, aiCard.templateId));

    if (!playerTemplate || !aiTemplate) {
      return "AI makes a move";
    }

    const playerValue = this.calculateCardValue(playerTemplate);
    const aiValue = this.calculateCardValue(aiTemplate);

    if (aiValue > playerValue) {
      return "AI plays confidently with a stronger card";
    } else if (aiValue === playerValue) {
      return "AI prepares for war with an equal strength card";
    } else {
      return "AI plays cautiously with a weaker card";
    }
  }

  private static calculateCardValue(template: SelectCardTemplate): number {
    const stats = template.powerStats as PowerStats;
    return (stats.attack * 2) + stats.defense + stats.speed + (stats.hp / 2);
  }
}