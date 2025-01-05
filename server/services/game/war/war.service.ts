import { db } from "@db";
import { 
  games, 
  gameCards, 
  tradingCards,
  cardTemplates,
  type InsertGame,
  type SelectGame,
  type SelectGameCard,
  type SelectTradingCard,
  type SelectCardTemplate 
} from "@db/schema";
import { eq, and } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { GameState, PowerStats, GameServiceTransaction } from "../types";
import { AIOpponentService } from "../ai/ai-opponent.service";

export class WarGameService {
  static async createGameWithAI(playerId: number): Promise<SelectGame> {
    return await db.transaction(async (tx) => {
      // Get AI's deck from global card pool
      const aiDeck = await AIOpponentService.buildDeck();
      const aiId = -1; // Using -1 to represent AI player

      const [game] = await tx.insert(games)
        .values({
          player1Id: playerId,
          player2Id: aiId, // AI player
          gameState: {
            warActive: false,
            cardsInWar: 0,
            lastAction: "Game started against AI",
            player1Cards: 0,
            player2Cards: 0,
            isAIGame: true,
          } as GameState,
          status: 'ACTIVE'
        })
        .returning();

      // Get player's cards
      const playerCards = await tx.query.tradingCards.findMany({
        where: eq(tradingCards.userId, playerId),
        limit: 8,
        with: {
          template: {
            with: {
              image: true
            }
          }
        }
      });

      if (playerCards.length < 8) {
        throw new Error("You must have at least 8 cards to play");
      }

      // Prepare game cards for both player and AI
      const gameCardsData = [
        ...playerCards.map((card, index) => ({
          gameId: game.id,
          cardId: card.id,
          ownerId: playerId,
          position: 'DECK',
          order: index,
        })),
        ...aiDeck.map((card, index) => ({
          gameId: game.id,
          cardId: card.id,
          ownerId: aiId,
          position: 'DECK',
          order: index + 8,
        }))
      ];

      await tx.insert(gameCards).values(gameCardsData);

      const updatedGameState: GameState = {
        warActive: false,
        cardsInWar: 0,
        lastAction: "Game started against AI",
        player1Cards: 8,
        player2Cards: 8,
        isAIGame: true,
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
      const [game] = await tx.select().from(games).where(eq(games.id, gameId));
      if (!game) throw new Error("Game not found");
      if (game.status === 'COMPLETED') throw new Error("Game is already completed");

      // Get the current cards for both players
      const player1Cards = await this.getPlayerCards(tx, gameId, game.player1Id);
      const player2Cards = await this.getPlayerCards(tx, gameId, game.player2Id);

      const player1Card = player1Cards[0];
      const player2Card = player2Cards[0];

      if (!player1Card || !player2Card) {
        const winnerId = !player1Card ? game.player2Id : game.player1Id;
        return await this.endGame(tx, game, winnerId);
      }

      // Get AI's decision for narrative
      const aiDecision = game.player2Id === -1 ? 
        await AIOpponentService.getAIDecision(player1Card.card.template, player2Card.card.template) : '';

      const player1Value = this.getCardValue(player1Card.card.template);
      const player2Value = this.getCardValue(player2Card.card.template);

      if (player1Value === player2Value) {
        return await this.handleWar(tx, game, aiDecision);
      } else {
        const winner = player1Value > player2Value ? game.player1Id : game.player2Id;
        await this.moveCardsToWinner(tx, gameId, winner, [player1Card, player2Card]);
        return await this.updateGameState(tx, game, winner, aiDecision);
      }
    });
  }

  private static async handleWar(
    tx: GameServiceTransaction, 
    game: SelectGame, 
    aiDecision: string = ""
  ): Promise<SelectGame> {
    const player1Cards = await this.getWarCards(tx, game.id, game.player1Id);
    const player2Cards = await this.getWarCards(tx, game.id, game.player2Id);

    if (player1Cards.length < 4 || player2Cards.length < 4) {
      const winnerId = player1Cards.length < 4 ? game.player2Id : game.player1Id;
      return await this.endGame(tx, game, winnerId);
    }

    const player1FaceUp = player1Cards[player1Cards.length - 1];
    const player2FaceUp = player2Cards[player2Cards.length - 1];

    const player1Value = this.getCardValue(player1FaceUp.card.template);
    const player2Value = this.getCardValue(player2FaceUp.card.template);

    const winner = player1Value > player2Value ? game.player1Id : game.player2Id;
    await this.moveCardsToWinner(tx, game.id, winner, [...player1Cards, ...player2Cards]);
    return await this.updateGameState(tx, game, winner, aiDecision);
  }

  private static async endGame(
    tx: GameServiceTransaction,
    game: SelectGame,
    winnerId: number
  ): Promise<SelectGame> {
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

  private static getCardValue(template: SelectCardTemplate): number {
    try {
      const stats = template.powerStats as PowerStats;
      return (stats.attack * 2) + stats.defense + stats.speed + (stats.hp / 2);
    } catch (error) {
      console.error('Error calculating card value:', error);
      return 0;
    }
  }

  private static async getPlayerCards(
    tx: GameServiceTransaction,
    gameId: number,
    playerId: number,
    limit: number = 1
  ): Promise<SelectGameCard[]> {
    return await tx.query.gameCards.findMany({
      where: and(
        eq(gameCards.gameId, gameId),
        eq(gameCards.ownerId, playerId),
        eq(gameCards.position, 'DECK')
      ),
      with: {
        card: {
          with: {
            template: {
              with: {
                image: true
              }
            }
          }
        }
      },
      orderBy: (cards) => [cards.order],
      limit,
    });
  }

  private static async getWarCards(
    tx: GameServiceTransaction,
    gameId: number,
    playerId: number
  ): Promise<SelectGameCard[]> {
    return this.getPlayerCards(tx, gameId, playerId, 4);
  }

  private static async moveCardsToWinner(
    tx: GameServiceTransaction,
    gameId: number,
    winnerId: number,
    cards: SelectGameCard[]
  ): Promise<void> {
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

  private static async getMaxOrder(
    tx: GameServiceTransaction,
    gameId: number,
    playerId: number
  ): Promise<number> {
    const [result] = await tx.select({ maxOrder: sql`MAX(${gameCards.order})` })
      .from(gameCards)
      .where(and(
        eq(gameCards.gameId, gameId),
        eq(gameCards.ownerId, playerId)
      ));
    return result?.maxOrder ?? 0;
  }

  private static async updateGameState(
    tx: GameServiceTransaction,
    game: SelectGame,
    lastWinner: number,
    aiDecision: string = ""
  ): Promise<SelectGame> {
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
      lastAction: aiDecision || `Player ${lastWinner === game.player1Id ? '1' : 'AI'} won the round`,
      player1Cards: Number(player1Cards.count),
      player2Cards: Number(player2Cards.count),
      isAIGame: game.player2Id === -1,
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