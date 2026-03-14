import { RequestType, useRequestCardStore, RequestCard } from '../src/engines/requestCard/requestCardStore';

const makeCard = (type: RequestType): RequestCard => ({
  id: `card_${type}`,
  familyId: 'fam_1',
  fromUid: 'child_1',
  toUid: 'parent_1',
  originalText: '원문',
  bufferedText: '완충문',
  requestType: type,
  status: 'pending',
  createdAt: Date.now(),
});

describe('RequestType — 5종', () => {
  beforeEach(() => {
    useRequestCardStore.setState({ cards: [], loading: false });
  });

  const ALL_TYPES: RequestType[] = [
    'extra_budget',
    'plan_change',
    'reward',
    'urgent',
    'purchase_check',
  ];

  it('5종 타입 모두 카드 생성 가능', () => {
    ALL_TYPES.forEach((type) => {
      useRequestCardStore.getState().addCard(makeCard(type));
    });
    expect(useRequestCardStore.getState().cards).toHaveLength(5);
  });

  it('urgent 카드 필터링', () => {
    ALL_TYPES.forEach((type) => useRequestCardStore.getState().addCard(makeCard(type)));
    const urgentCards = useRequestCardStore
      .getState()
      .cards.filter((c) => c.requestType === 'urgent');
    expect(urgentCards).toHaveLength(1);
  });

  it('purchase_check 카드 필터링', () => {
    ALL_TYPES.forEach((type) => useRequestCardStore.getState().addCard(makeCard(type)));
    const purchaseCards = useRequestCardStore
      .getState()
      .cards.filter((c) => c.requestType === 'purchase_check');
    expect(purchaseCards).toHaveLength(1);
  });

  it('updateCard: 상태 변경', () => {
    useRequestCardStore.getState().addCard(makeCard('urgent'));
    useRequestCardStore.getState().updateCard('card_urgent', { status: 'cheered' });
    const card = useRequestCardStore.getState().cards.find((c) => c.id === 'card_urgent');
    expect(card?.status).toBe('cheered');
  });

  it('기존 3종(extra_budget, plan_change, reward) 유지', () => {
    const legacy: RequestType[] = ['extra_budget', 'plan_change', 'reward'];
    legacy.forEach((type) => useRequestCardStore.getState().addCard(makeCard(type)));
    expect(useRequestCardStore.getState().cards).toHaveLength(3);
  });
});
