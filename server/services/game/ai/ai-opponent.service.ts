import { db } from "@db";
import { 
  tradingCards,
  cardTemplates,
  users,
  type SelectTradingCard,
  type SelectCardTemplate,
  type SelectUser
} from "@db/schema";
import { sql, eq } from "drizzle-orm";
import { PowerStats } from "../types";

export class AIOpponentService {
  static async getAIUser(): Promise<SelectUser> {
    try {
      // First try to find existing AI user
      const [existingAiUser] = await db
        .select()
        .from(users)
        .where(eq(users.username, 'AI_OPPONENT'));

      if (existingAiUser) {
        return existingAiUser;
      }

      // If no AI user exists, create one
      const [newAiUser] = await db.insert(users)
        .values({
          username: 'AI_OPPONENT',
          password: 'AI_OPPONENT_' + Date.now(), // Ensure unique password
        })
        .returning();

      return newAiUser;
    } catch (error: any) {
      // If we hit a unique constraint error, try to fetch the user again
      if (error.code === '23505') { // Unique constraint violation
        const [aiUser] = await db
          .select()
          .from(users)
          .where(eq(users.username, 'AI_OPPONENT'));

        if (aiUser) {
          return aiUser;
        }
      }
      throw error;
    }
  }

  static async buildDeck(): Promise<SelectTradingCard[]> {
    try {
      // Get or create AI user
      const aiUser = await this.getAIUser();

      // Get templates with verification
      const templates = await db.query.cardTemplates.findMany({
        orderBy: sql`RANDOM()`,
        limit: 8,
        with: {
          image: true,
        }
      });

      if (templates.length < 8) {
        throw new Error("Not enough card templates in the global pool");
      }

      // Create trading cards for AI in a transaction
      return await db.transaction(async (tx) => {
        const aiCards = await Promise.all(templates.map(async (template) => {
          // Check if card already exists
          const [existingCard] = await tx
            .select()
            .from(tradingCards)
            .where(eq(tradingCards.userId, aiUser.id))
            .limit(1);

          // If AI already has cards, use them instead of creating new ones
          if (existingCard) {
            return {
              ...existingCard,
              template,
            };
          }

          // Create new card
          const [card] = await tx.insert(tradingCards)
            .values({
              templateId: template.id,
              userId: aiUser.id,
            })
            .returning();

          return {
            ...card,
            template,
          };
        }));

        return aiCards;
      });
    } catch (error) {
      console.error('Error building AI deck:', error);
      throw new Error(`Failed to build AI deck: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async getAIDecision(playerCard: SelectCardTemplate, aiCard: SelectCardTemplate): Promise<string> {
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

  private static calculateCardValue(template: SelectCardTemplate): number {
    const stats = template.powerStats as PowerStats;
    return (stats.attack * 2) + stats.defense + stats.speed + (stats.hp / 2);
  }
}