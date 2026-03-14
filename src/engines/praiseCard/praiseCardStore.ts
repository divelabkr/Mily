import { create } from 'zustand';

export type PraiseCardType = 'well_saved' | 'good_effort' | 'thank_you';

export interface PraiseCard {
  cardId: string;
  familyId: string;
  fromUid: string;
  toUid: string;
  type: PraiseCardType;
  createdAt: number;
}

interface PraiseCardState {
  cards: PraiseCard[];
  loading: boolean;
  setCards: (cards: PraiseCard[]) => void;
  addCard: (card: PraiseCard) => void;
  setLoading: (loading: boolean) => void;
}

export const usePraiseCardStore = create<PraiseCardState>((set) => ({
  cards: [],
  loading: false,
  setCards: (cards) => set({ cards }),
  addCard: (card) =>
    set((state) => ({ cards: [card, ...state.cards] })),
  setLoading: (loading) => set({ loading }),
}));
