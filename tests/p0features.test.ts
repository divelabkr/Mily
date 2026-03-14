import {
  getWeeklySpendBreakdown,
  getWeeklyChoiceTotal,
  getWeeklyTotalBySpendType,
  CheckIn,
} from '../src/engines/checkin/checkinStore';

// Firebase / 외부 모듈 mock
jest.mock('../src/lib/firebase', () => ({ getFirebaseDb: jest.fn(() => ({})) }));
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(), addDoc: jest.fn(() => Promise.resolve({ id: 'doc1' })),
  getDocs: jest.fn(() => Promise.resolve({ docs: [] })),
  query: jest.fn(), orderBy: jest.fn(), serverTimestamp: jest.fn(() => ({})),
  updateDoc: jest.fn(() => Promise.resolve()), doc: jest.fn(),
}));
jest.mock('../src/engines/ai/aiToneService', () => ({
  bufferRequestText: jest.fn(() => Promise.resolve({ bufferedText: '완충된 텍스트' })),
}));
jest.mock('../src/engines/notification/notificationService', () => ({
  notifyRequestCardReceived: jest.fn(() => Promise.resolve()),
}));
jest.mock('expo-notifications', () => ({}));

// ──────────────────────────────────────────────
// 체크인 빌더
// ──────────────────────────────────────────────

function makeCheckIn(overrides: Partial<CheckIn> = {}): CheckIn {
  return {
    checkInId: 'ci_1',
    uid: 'u1',
    weekId: '2026-W11',
    categoryId: 'food',
    amount: 10000,
    spendType: 'choice',
    createdAt: Date.now(),
    ...overrides,
  };
}

// ──────────────────────────────────────────────
// 테스트 1: 홈 선택소비 — SpendType 분리 계산
// ──────────────────────────────────────────────

describe('홈 선택소비 요약 — getWeeklySpendBreakdown', () => {
  it('SpendType 없는 체크인: 전부 0', () => {
    const r = getWeeklySpendBreakdown([]);
    expect(r).toEqual({ fixed: 0, living: 0, choice: 0 });
  });

  it('고정/생활/선택 각각 합산', () => {
    const checkIns = [
      makeCheckIn({ amount: 50000, spendType: 'fixed' }),
      makeCheckIn({ amount: 30000, spendType: 'living' }),
      makeCheckIn({ amount: 20000, spendType: 'choice' }),
      makeCheckIn({ amount: 15000, spendType: 'choice' }),
    ];
    const r = getWeeklySpendBreakdown(checkIns);
    expect(r.fixed).toBe(50000);
    expect(r.living).toBe(30000);
    expect(r.choice).toBe(35000);
  });

  it('getWeeklyChoiceTotal: choice만 합산', () => {
    const checkIns = [
      makeCheckIn({ amount: 10000, spendType: 'fixed' }),
      makeCheckIn({ amount: 5000,  spendType: 'choice' }),
      makeCheckIn({ amount: 7000,  spendType: 'choice' }),
    ];
    expect(getWeeklyChoiceTotal(checkIns)).toBe(12000);
  });

  it('spendType undefined인 체크인은 어느 타입에도 포함 안 됨', () => {
    const checkIns = [
      makeCheckIn({ amount: 10000, spendType: undefined }),
      makeCheckIn({ amount: 5000,  spendType: 'choice' }),
    ];
    const r = getWeeklySpendBreakdown(checkIns);
    expect(r.choice).toBe(5000);
    expect(r.fixed).toBe(0);
    expect(r.living).toBe(0);
  });
});

// ──────────────────────────────────────────────
// 테스트 2: urgent 요청카드 — 즉시 푸시 알림
// ──────────────────────────────────────────────

describe('urgent 요청카드 — 즉시 푸시', () => {
  const { notifyRequestCardReceived } = require('../src/engines/notification/notificationService');
  const { sendRequestCard } = require('../src/engines/requestCard/requestCardService');
  const { useRequestCardStore } = require('../src/engines/requestCard/requestCardStore');

  beforeEach(() => {
    jest.clearAllMocks();
    useRequestCardStore.setState({ cards: [], loading: false });
  });

  it('urgent 발송 → notifyRequestCardReceived 호출됨', async () => {
    await sendRequestCard('fam1', 'child1', 'parent1', '지금 당장 필요해요!', 'urgent', '민준');
    expect(notifyRequestCardReceived).toHaveBeenCalledWith('민준');
  });

  it('extra_budget 발송 → notifyRequestCardReceived 미호출', async () => {
    await sendRequestCard('fam1', 'child1', 'parent1', '용돈 더 주세요', 'extra_budget', '민준');
    expect(notifyRequestCardReceived).not.toHaveBeenCalled();
  });

  it('purchase_check 발송 → notifyRequestCardReceived 미호출', async () => {
    await sendRequestCard('fam1', 'child1', 'parent1', '이거 사도 될까요?', 'purchase_check', '민준');
    expect(notifyRequestCardReceived).not.toHaveBeenCalled();
  });
});

// ──────────────────────────────────────────────
// 테스트 3: 이번 주 약속 — Plan weeklyPromise + 회고 연결
// ──────────────────────────────────────────────

describe('이번 주 약속 — planStore', () => {
  const { usePlanStore } = require('../src/engines/plan/planStore');

  beforeEach(() => {
    usePlanStore.setState({
      currentPlan: {
        planId: 'p1', uid: 'u1', month: '2026-03',
        totalBudget: 300000, categories: [],
        weeklyPromise: null, createdAt: Date.now(), updatedAt: Date.now(),
      },
      loading: false,
    });
  });

  it('setWeeklyPromise: null → 문자열 저장', () => {
    usePlanStore.getState().setWeeklyPromise('커피 2번 이하');
    expect(usePlanStore.getState().currentPlan?.weeklyPromise).toBe('커피 2번 이하');
  });

  it('setWeeklyPromise: 문자열 → null (약속 삭제)', () => {
    usePlanStore.getState().setWeeklyPromise('커피 2번 이하');
    usePlanStore.getState().setWeeklyPromise(null);
    expect(usePlanStore.getState().currentPlan?.weeklyPromise).toBeNull();
  });
});

// ──────────────────────────────────────────────
// 테스트 4: 칭찬 카드 — 타입 3종 + 자녀 필터
// ──────────────────────────────────────────────

describe('칭찬 카드 — 타입 및 수신 필터', () => {
  const { usePraiseCardStore } = require('../src/engines/praiseCard/praiseCardStore');

  beforeEach(() => {
    usePraiseCardStore.setState({ cards: [], loading: false });
  });

  it('3종 타입 모두 유효', () => {
    const types = ['well_saved', 'good_effort', 'thank_you'] as const;
    types.forEach((type) => {
      usePraiseCardStore.getState().addCard({
        cardId: `c_${type}`, familyId: 'f1',
        fromUid: 'parent', toUid: 'child',
        type, createdAt: Date.now(),
      });
    });
    expect(usePraiseCardStore.getState().cards).toHaveLength(3);
  });

  it('자녀 홈: toUid 필터링', () => {
    const now = Date.now();
    usePraiseCardStore.getState().addCard({
      cardId: 'c1', familyId: 'f1',
      fromUid: 'parent', toUid: 'child_a',
      type: 'well_saved', createdAt: now,
    });
    usePraiseCardStore.getState().addCard({
      cardId: 'c2', familyId: 'f1',
      fromUid: 'parent', toUid: 'child_b',
      type: 'thank_you', createdAt: now,
    });
    const forChildA = usePraiseCardStore.getState().cards.filter(
      (c: { toUid: string }) => c.toUid === 'child_a'
    );
    expect(forChildA).toHaveLength(1);
  });
});

// ──────────────────────────────────────────────
// 테스트 5: getWeeklyTotalBySpendType 경계값
// ──────────────────────────────────────────────

describe('getWeeklyTotalBySpendType 경계값', () => {
  it('금액 0원 포함', () => {
    const checkIns = [
      makeCheckIn({ amount: 0,     spendType: 'choice' }),
      makeCheckIn({ amount: 5000,  spendType: 'choice' }),
    ];
    expect(getWeeklyTotalBySpendType(checkIns, 'choice')).toBe(5000);
  });

  it('해당 타입 없으면 0', () => {
    const checkIns = [makeCheckIn({ amount: 10000, spendType: 'fixed' })];
    expect(getWeeklyTotalBySpendType(checkIns, 'living')).toBe(0);
    expect(getWeeklyTotalBySpendType(checkIns, 'choice')).toBe(0);
  });

  it('동일 타입 여러 건 합산', () => {
    const checkIns = Array.from({ length: 5 }, (_, i) =>
      makeCheckIn({ checkInId: `ci_${i}`, amount: 1000, spendType: 'living' })
    );
    expect(getWeeklyTotalBySpendType(checkIns, 'living')).toBe(5000);
  });
});
