import { db } from "@db";
import { 
  games, 
  gameCards, 
  tradingCards,
  type InsertGame,
  type SelectGame,
  type SelectGameCard,
  type SelectTradingCard 
} from "@db/schema";
import { eq, and, or } from "drizzle-orm";
import { sql } from "drizzle-orm";

type GameState = {
  warActive: boolean;
  cardsInWar: number;
  lastAction: string;
  player1Cards: number;
  player2Cards: number;
};

// Add type for power stats
type PowerStats = {
  attack: number;
  defense: number;
  speed: number;
  hp: number;
};

export class WarGameService {
  static async createGame(player1Id: number, player2Id: number): Promise<SelectGame> {
    // Start a transaction to ensure data consistency
    return await db.transaction(async (tx) => {
      // Create new game
      const [game] = await tx.insert(games)
        .values({
          player1Id,
          player2Id,
          gameState: {
            warActive: false,
            cardsInWar: 0,
            lastAction: "Game started",
            player1Cards: 0,
            player2Cards: 0,
          } as GameState,
        })
        .returning();

      // Get 8 cards from each player's collection instead of 26
      const player1Cards = await tx.query.tradingCards.findMany({
        where: eq(tradingCards.userId, player1Id),
        limit: 8,
      });

      const player2Cards = await tx.query.tradingCards.findMany({
        where: eq(tradingCards.userId, player2Id),
        limit: 8,
      });

      // Validate that both players have enough cards
      if (player1Cards.length < 8 || player2Cards.length < 8) {
        throw new Error("Both players must have at least 8 cards to play");
      }

      // Shuffle and assign cards to the game
      const shuffledCards = this.shuffleCards([...player1Cards, ...player2Cards]);
      const gameCardsData = shuffledCards.map((card, index) => ({
        gameId: game.id,
        cardId: card.id,
        ownerId: index < 8 ? player1Id : player2Id,
        position: 'DECK',
        order: index,
      }));

      await tx.insert(gameCards).values(gameCardsData);

      // Update game state with initial card counts
      const updatedGameState: GameState = {
        ...game.gameState as GameState,
        player1Cards: 8,
        player2Cards: 8,
      };

      const [updatedGame] = await tx.update(games)
        .set({ gameState: updatedGameState })
        .where(eq(games.id, game.id))
        .returning();

      return updatedGame;
    });
  }

  static async playTurn(gameId: number): Promise<SelectGame> {
    return await db.transaction(async (tx) => {
      // Get current game state
      const [game] = await tx.select().from(games).where(eq(games.id, gameId));
      if (!game) throw new Error("Game not found");
      if (game.status === 'COMPLETED') throw new Error("Game is already completed");

      const gameState = game.gameState as GameState;

      // Get top cards for both players
      const player1Card = await this.getTopCard(tx, gameId, game.player1Id);
      const player2Card = await this.getTopCard(tx, gameId, game.player2Id);

      if (!player1Card || !player2Card) {
        // Handle game over condition
        const winnerId = !player1Card ? game.player2Id : game.player1Id;
        await this.endGame(tx, game, winnerId);
        return game;
      }

      // Compare cards and handle war
      if (this.getCardValue(player1Card) === this.getCardValue(player2Card)) {
        // War scenario
        return await this.handleWar(tx, game);
      } else {
        // Normal turn
        const winner = this.getCardValue(player1Card) > this.getCardValue(player2Card)
          ? game.player1Id : game.player2Id;

        // Move cards to winner's deck
        await this.moveCardsToWinner(tx, gameId, winner, [player1Card, player2Card]);

        // Update game state
        const updatedGame = await this.updateGameState(tx, game, winner);
        return updatedGame;
      }
    });
  }

  private static async handleWar(tx: any, game: SelectGame): Promise<SelectGame> {
    const gameState = game.gameState as GameState;

    // Each player puts down 3 cards face down and 1 face up
    const player1Cards = await this.getWarCards(tx, game.id, game.player1Id);
    const player2Cards = await this.getWarCards(tx, game.id, game.player2Id);

    // If either player doesn't have enough cards for war, they lose
    if (player1Cards.length < 4 || player2Cards.length < 4) {
      const winnerId = player1Cards.length < 4 ? game.player2Id : game.player1Id;
      return await this.endGame(tx, game, winnerId);
    }

    // Compare the last (face-up) cards
    const player1FaceUp = player1Cards[player1Cards.length - 1];
    const player2FaceUp = player2Cards[player2Cards.length - 1];

    const winner = this.getCardValue(player1FaceUp) > this.getCardValue(player2FaceUp)
      ? game.player1Id : game.player2Id;

    // Move all cards to winner
    await this.moveCardsToWinner(tx, game.id, winner, [...player1Cards, ...player2Cards]);

    // Update game state
    return await this.updateGameState(tx, game, winner);
  }

  private static async endGame(tx: any, game: SelectGame, winnerId: number): Promise<SelectGame> {
    // Transfer all cards to winner's collection
    await tx.update(tradingCards)
      .set({ userId: winnerId })
      .where(
        and(
          eq(gameCards.gameId, game.id),
          eq(gameCards.ownerId, winnerId === game.player1Id ? game.player2Id : game.player1Id)
        )
      );

    // Update game status
    const [updatedGame] = await tx.update(games)
      .set({ 
        status: 'COMPLETED',
        winnerId,
        updatedAt: new Date()
      })
      .where(eq(games.id, game.id))
      .returning();

    return updatedGame;
  }

  // Helper methods
  private static shuffleCards(cards: SelectTradingCard[]): SelectTradingCard[] {
    for (let i = cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cards[i], cards[j]] = [cards[j], cards[i]];
    }
    return cards;
  }

  private static getCardValue(card: SelectTradingCard): number {
    try {
      const stats = card.powerStats as PowerStats;
      // Use a combination of stats to determine card value
      return (stats.attack * 2) + stats.defense + stats.speed + (stats.hp / 2);
    } catch (error) {
      console.error('Error calculating card value:', error);
      // Return a default value if powerStats is invalid
      return 0;
    }
  }

  private static async getTopCard(tx: any, gameId: number, playerId: number) {
    const [card] = await tx.query.gameCards.findMany({
      where: and(
        eq(gameCards.gameId, gameId),
        eq(gameCards.ownerId, playerId),
        eq(gameCards.position, 'DECK')
      ),
      orderBy: (cards: any, { asc }: any) => [asc(cards.order)],
      limit: 1,
    });
    return card;
  }

  private static async getWarCards(tx: any, gameId: number, playerId: number) {
    return await tx.query.gameCards.findMany({
      where: and(
        eq(gameCards.gameId, gameId),
        eq(gameCards.ownerId, playerId),
        eq(gameCards.position, 'DECK')
      ),
      orderBy: (cards: any, { asc }: any) => [asc(cards.order)],
      limit: 4,
    });
  }

  private static async moveCardsToWinner(
    tx: any,
    gameId: number,
    winnerId: number,
    cards: SelectGameCard[]
  ) {
    // Update card ownership and move to bottom of winner's deck
    const maxOrder = await this.getMaxOrder(tx, gameId, winnerId);

    for (let i = 0; i < cards.length; i++) {
      await tx.update(gameCards)
        .set({
          ownerId: winnerId,
          order: maxOrder + i + 1,
        })
        .where(eq(gameCards.id, cards[i].id));
    }
  }

  private static async getMaxOrder(tx: any, gameId: number, playerId: number): Promise<number> {
    const [result] = await tx.select({ maxOrder: sql`MAX(${gameCards.order})` })
      .from(gameCards)
      .where(and(
        eq(gameCards.gameId, gameId),
        eq(gameCards.ownerId, playerId)
      ));
    return result?.maxOrder ?? 0;
  }

  private static async updateGameState(
    tx: any,
    game: SelectGame,
    lastWinner: number
  ): Promise<SelectGame> {
    // Count remaining cards for each player
    const [player1Cards] = await tx.select({ count: sql`COUNT(*)` })
      .from(gameCards)
      .where(and(
        eq(gameCards.gameId, game.id),
        eq(gameCards.ownerId, game.player1Id)
      ));

    const [player2Cards] = await tx.select({ count: sql`COUNT(*)` })
      .from(gameCards)
      .where(and(
        eq(gameCards.gameId, game.id),
        eq(gameCards.ownerId, game.player2Id)
      ));

    const updatedGameState: GameState = {
      warActive: false,
      cardsInWar: 0,
      lastAction: `Player ${lastWinner === game.player1Id ? '1' : '2'} won the round`,
      player1Cards: Number(player1Cards.count),
      player2Cards: Number(player2Cards.count),
    };

    const [updatedGame] = await tx.update(games)
      .set({
        gameState: updatedGameState,
        currentTurn: game.currentTurn + 1,
        updatedAt: new Date(),
      })
      .where(eq(games.id, game.id))
      .returning();

    return updatedGame;
  }
}