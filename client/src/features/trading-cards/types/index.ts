export interface Card {
  id: number;
  templateId: number;
  userId: number | null;
  createdAt: string;
  template: {
    id: number;
    name: string;
    description: string;
    elementalType: string;
    rarity: string;
    powerStats: {
      attack: number;
      defense: number;
      speed: number;
    };
    image: {
      id: number;
      url: string;
    };
  };
}

export interface CardPack {
  id: number;
  userId: number;
  name: string;
  description: string | null;
  createdAt: string;
  cards: Array<{
    id: number;
    globalPoolCard: {
      id: number;
      card: Card;
    };
  }>;
}

export interface CreateCardPack {
  name: string;
  description?: string;
  cardIds: number[];
}
