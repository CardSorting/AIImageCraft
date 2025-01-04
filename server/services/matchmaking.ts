import { WebSocketServer } from 'ws';
import type { Server } from 'http';
import { db, eq } from "@db"; // Added eq import, assuming it's available from @db
import { WarGameService } from "./game";
import type { SelectUser } from "@db/schema";

type QueuedPlayer = {
  user: SelectUser;
  ws: WebSocket;
  joinedAt: Date;
};

export class MatchmakingService {
  private static instance: MatchmakingService;
  private wss: WebSocketServer;
  private queue: QueuedPlayer[] = [];
  private playerSockets: Map<number, WebSocket> = new Map();

  private constructor(server: Server) {
    this.wss = new WebSocketServer({ 
      server,
      path: '/api/matchmaking',
      verifyClient: (info: any, cb: any) => {
        // Extract session from the request
        const session = (info.req as any).session;
        if (!session?.passport?.user) {
          cb(false, 401, 'Unauthorized');
          return;
        }
        cb(true);
      }
    });
    this.setupWebSocketServer();
  }

  static initialize(server: Server): MatchmakingService {
    if (!MatchmakingService.instance) {
      MatchmakingService.instance = new MatchmakingService(server);
    }
    return MatchmakingService.instance;
  }

  private setupWebSocketServer() {
    this.wss.on('connection', async (ws: WebSocket, request: any) => {
      // Extract user ID from session
      const userId = request.session?.passport?.user;
      if (!userId) {
        ws.close(1008, 'Authentication required');
        return;
      }

      // Get user data
      const [user] = await db
        .select()
        .from('users')
        .where(eq('users.id', userId)) // Using the assumed eq function
        .limit(1);

      if (!user) {
        ws.close(1008, 'User not found');
        return;
      }

      // Store socket connection
      this.playerSockets.set(user.id, ws);

      ws.on('message', async (message: string) => {
        try {
          const data = JSON.parse(message);

          switch (data.type) {
            case 'JOIN_QUEUE':
              this.addToQueue({ user, ws, joinedAt: new Date() });
              break;
            case 'LEAVE_QUEUE':
              this.removeFromQueue(user.id);
              break;
          }
        } catch (error) {
          console.error('Error processing message:', error);
        }
      });

      ws.on('close', () => {
        this.removeFromQueue(user.id);
        this.playerSockets.delete(user.id);
      });
    });
  }

  private addToQueue(player: QueuedPlayer) {
    // Remove if already in queue
    this.removeFromQueue(player.user.id);

    // Add to queue
    this.queue.push(player);

    // Notify player they're in queue
    this.sendToPlayer(player.user.id, {
      type: 'QUEUE_STATUS',
      status: 'joined',
      position: this.queue.length
    });

    // Try to find a match
    this.processQueue();
  }

  private removeFromQueue(userId: number) {
    const index = this.queue.findIndex(p => p.user.id === userId);
    if (index !== -1) {
      this.queue.splice(index, 1);
      this.sendToPlayer(userId, {
        type: 'QUEUE_STATUS',
        status: 'left'
      });
    }
  }

  private async processQueue() {
    if (this.queue.length < 2) return;

    // Match the two players who have been waiting the longest
    const [player1, player2] = this.queue.splice(0, 2);

    try {
      // Create a new game
      const game = await WarGameService.createGame(player1.user.id, player2.user.id);

      // Notify both players
      this.sendToPlayer(player1.user.id, {
        type: 'MATCH_FOUND',
        gameId: game.id,
        opponent: {
          id: player2.user.id,
          username: player2.user.username
        }
      });

      this.sendToPlayer(player2.user.id, {
        type: 'MATCH_FOUND',
        gameId: game.id,
        opponent: {
          id: player1.user.id,
          username: player1.user.username
        }
      });

    } catch (error) {
      console.error('Error creating game:', error);
      // Put players back in queue if game creation fails
      this.addToQueue(player1);
      this.addToQueue(player2);
    }
  }

  public sendToPlayer(userId: number, message: any) {
    const ws = this.playerSockets.get(userId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  public broadcastGameUpdate(gameId: number, players: number[], update: any) {
    players.forEach(playerId => {
      this.sendToPlayer(playerId, {
        type: 'GAME_UPDATE',
        gameId,
        ...update
      });
    });
  }
}