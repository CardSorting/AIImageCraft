export interface Image {
  id: number;
  url: string;
  prompt: string;
  tags: string[];
  createdAt: string;
}

export interface TradingCard {
  id: number;
  name: string;
  description: string;
  elementalType: string;
  rarity: string;
  powerStats: {
    attack: number;
    defense: number;
    speed: number;
    magic: number;
  };
  image: {
    url: string;
  };
  createdAt: string;
  creator?: {
    username: string;
  };
}

export interface Trade {
  id: number;
  initiator: {
    username: string;
  };
  receiver: {
    username: string;
  };
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  message?: string;
  createdAt: string;
  items: Array<{
    card: TradingCard;
    offerer: {
      username: string;
    };
  }>;
}
