import { create } from 'zustand';

export type RequestType =
  | 'extra_budget'
  | 'plan_change'
  | 'reward'
  | 'urgent'
  | 'purchase_check';
export type RequestStatus = 'pending' | 'cheered' | 'held' | 'adjusting';

export interface RequestCard {
  id: string;
  familyId: string;
  fromUid: string;
  toUid: string;
  originalText: string;
  bufferedText: string;
  requestType: RequestType;
  status: RequestStatus;
  createdAt: number;
  respondedAt?: number;
  // 같은 주제 재요청 쿨다운: 7일
  cooldownUntil?: number;
}

interface RequestCardState {
  cards: RequestCard[];
  loading: boolean;
  setCards: (cards: RequestCard[]) => void;
  addCard: (card: RequestCard) => void;
  updateCard: (id: string, data: Partial<RequestCard>) => void;
  setLoading: (loading: boolean) => void;
}

export const useRequestCardStore = create<RequestCardState>((set) => ({
  cards: [],
  loading: false,
  setCards: (cards) => set({ cards }),
  addCard: (card) =>
    set((state) => ({ cards: [card, ...state.cards] })),
  updateCard: (id, data) =>
    set((state) => ({
      cards: state.cards.map((c) => (c.id === id ? { ...c, ...data } : c)),
    })),
  setLoading: (loading) => set({ loading }),
}));
