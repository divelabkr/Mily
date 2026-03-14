import { usePraiseCardStore, PraiseCard, PraiseCardType } from '../src/engines/praiseCard/praiseCardStore';

// Firebase mock
jest.mock('../src/lib/firebase', () => ({
  getFirebaseDb: jest.fn(() => ({})),
}));
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  addDoc: jest.fn(),
  getDocs: jest.fn(),
  query: jest.fn(),
  orderBy: jest.fn(),
  serverTimestamp: jest.fn(() => ({ seconds: Math.floor(Date.now() / 1000) })),
}));

const makeCard = (overrides: Partial<PraiseCard> = {}): PraiseCard => ({
  cardId: 'card_1',
  familyId: 'fam_1',
  fromUid: 'parent_1',
  toUid: 'child_1',
  type: 'well_saved',
  createdAt: Date.now(),
  ...overrides,
});

describe('praiseCardStore', () => {
  beforeEach(() => {
    usePraiseCardStore.setState({ cards: [], loading: false });
  });

  it('addCard: 카드 추가', () => {
    const card = makeCard();
    usePraiseCardStore.getState().addCard(card);
    expect(usePraiseCardStore.getState().cards).toHaveLength(1);
    expect(usePraiseCardStore.getState().cards[0].type).toBe('well_saved');
  });

  it('addCard: 최신 순서(앞에 추가)', () => {
    usePraiseCardStore.getState().addCard(makeCard({ id: 'old', type: 'thank_you' }));
    usePraiseCardStore.getState().addCard(makeCard({ id: 'new', type: 'good_effort' }));
    expect(usePraiseCardStore.getState().cards[0].id).toBe('new');
  });

  it('setCards: 전체 교체', () => {
    usePraiseCardStore.getState().addCard(makeCard({ id: 'old' }));
    usePraiseCardStore.getState().setCards([makeCard({ id: 'a' }), makeCard({ id: 'b' })]);
    expect(usePraiseCardStore.getState().cards).toHaveLength(2);
  });

  it('PraiseCardType: 3종만 허용', () => {
    const validTypes: PraiseCardType[] = ['well_saved', 'good_effort', 'thank_you'];
    validTypes.forEach((type) => {
      const card = makeCard({ type });
      usePraiseCardStore.getState().addCard(card);
    });
    expect(usePraiseCardStore.getState().cards).toHaveLength(3);
  });
});
