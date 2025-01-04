import { db } from "@db";
import { eq, and, or, sql } from "drizzle-orm";
import { users, tradingCards, games } from "@db/schema";
import { WarGameService } from "./game";

export class MatchmakingService {
  static async findMatch(userId: number): Promise<number | null> {
    return await db.transaction(async (tx) => {
      // First, verify the current user has enough cards
      const [userCardCount] = await tx
        .select({ count: sql<number>`count(*)` })
        .from(tradingCards)
        .where(eq(tradingCards.userId, userId));

      if (Number(userCardCount.count) < 26) {
        throw new Error("You need at least 26 cards to play");
      }

      // Find another user with enough cards who isn't already in an active game
      const potentialOpponents = await tx
        .select({
          userId: users.id,
          cardCount: sql<number>`count(${tradingCards.id})`,
        })
        .from(users)
        .leftJoin(tradingCards, eq(users.id, tradingCards.userId))
        .where(
          and(
            sql`${users.id} != ${userId}`,
            sql`${users.id} NOT IN (
              SELECT player1_id FROM games WHERE status = 'ACTIVE'
              UNION
              SELECT player2_id FROM games WHERE status = 'ACTIVE'
            )`
          )
        )
        .groupBy(users.id)
        .having(sql`count(${tradingCards.id}) >= 26`)
        .limit(1);

      if (potentialOpponents.length === 0) {
        return null;
      }

      const opponent = potentialOpponents[0];
      const game = await WarGameService.createGame(userId, opponent.userId);

      // Automatically play the game
      while (game.status === 'ACTIVE') {
        await WarGameService.playTurn(game.id);
      }

      return game.id;
    });
  }

  static async getActiveGame(userId: number): Promise<number | null> {
    const [activeGame] = await db
      .select()
      .from(games)
      .where(
        and(
          or(
            eq(games.player1Id, userId),
            eq(games.player2Id, userId)
          ),
          eq(games.status, 'ACTIVE')
        )
      )
      .limit(1);

    return activeGame?.id || null;
  }
}
