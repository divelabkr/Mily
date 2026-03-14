import {
  ECONOMIC_BADGES,
  findBadge,
  useBadgeStore,
  checkAndAwardBadges,
  checkSingleBadge,
} from '../src/engines/badge/badgeService';
import { BadgeContext, BadgeId } from '../src/engines/badge/badgeTypes';

// Firebase mock
jest.mock('../src/lib/firebase', () => ({
  getFirebaseDb: jest.fn(() => ({})),
}));
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  getDocs: jest.fn(() => Promise.resolve({ docs: [] })),
  setDoc: jest.fn(() => Promise.resolve()),
}));
jest.mock('../src/engines/analytics/analyticsService', () => ({
  trackEvent: jest.fn(() => Promise.resolve()),
}));

// ──────────────────────────────────────────────
// 테스트용 기본 컨텍스트 빌더
// ──────────────────────────────────────────────

function makeCtx(overrides: Partial<BadgeContext> = {}): BadgeContext {
  return {
    uid: 'test_user',
    totalBudgetSet: false,
    planCount: 0,
    reviewCount: 0,
    hasFixedCheckIn: false,
    hasNegotiatedCard: false,
    hasUrgentRequest: false,
    hasWeeklyPromise: false,
    hasCheeredResponse: false,
    consecutiveWeeks: 0,
    familyLinked: false,
    earnedBadges: [],
    ...overrides,
  };
}

// ──────────────────────────────────────────────
// 테스트 1: 뱃지 정의 — 9종 완비 확인
// ──────────────────────────────────────────────

describe('ECONOMIC_BADGES 정의', () => {
  it('9종 모두 정의됨', () => {
    expect(ECONOMIC_BADGES).toHaveLength(9);
  });

  it('필수 필드(id/label/emoji/triggerHint) 모두 존재', () => {
    const requiredIds: BadgeId[] = [
      'budget', 'plan', 'review', 'fixed_cost', 'negotiate',
      'emergency', 'promise', 'consensus', 'independence',
    ];
    for (const id of requiredIds) {
      const badge = findBadge(id);
      expect(badge).toBeDefined();
      expect(badge.label).toBeTruthy();
      expect(badge.emoji).toBeTruthy();
      expect(badge.triggerHint).toBeTruthy();
    }
  });
});

// ──────────────────────────────────────────────
// 테스트 2: 기능 첫 사용 조건 검증
// ──────────────────────────────────────────────

describe('뱃지 획득 조건', () => {
  it('budget: 예산 미설정 → 미획득, 설정 → 획득', async () => {
    useBadgeStore.setState({ userBadges: [], loading: false });
    const earned = await checkAndAwardBadges('uid', makeCtx({ totalBudgetSet: true, earnedBadges: [] }));
    expect(earned.some((b) => b.id === 'budget')).toBe(true);
  });

  it('plan: 계획 0개 → 미획득, 1개 → 획득', async () => {
    useBadgeStore.setState({ userBadges: [], loading: false });
    const notYet = await checkAndAwardBadges('uid', makeCtx({ planCount: 0 }));
    expect(notYet.some((b) => b.id === 'plan')).toBe(false);

    useBadgeStore.setState({ userBadges: [], loading: false });
    const earned = await checkAndAwardBadges('uid', makeCtx({ planCount: 1, earnedBadges: [] }));
    expect(earned.some((b) => b.id === 'plan')).toBe(true);
  });

  it('emergency: urgent 요청 없으면 미획득', async () => {
    useBadgeStore.setState({ userBadges: [], loading: false });
    const earned = await checkAndAwardBadges('uid', makeCtx({ hasUrgentRequest: false }));
    expect(earned.some((b) => b.id === 'emergency')).toBe(false);
  });

  it('independence: 4주 미만이거나 가족 연결이면 미획득', async () => {
    useBadgeStore.setState({ userBadges: [], loading: false });
    // 4주 달성했지만 가족 연결
    let earned = await checkAndAwardBadges('uid', makeCtx({ consecutiveWeeks: 4, familyLinked: true }));
    expect(earned.some((b) => b.id === 'independence')).toBe(false);

    useBadgeStore.setState({ userBadges: [], loading: false });
    // 3주, 가족 미연결
    earned = await checkAndAwardBadges('uid', makeCtx({ consecutiveWeeks: 3, familyLinked: false }));
    expect(earned.some((b) => b.id === 'independence')).toBe(false);
  });

  it('independence: 4주 이상 + 가족 미연결 → 획득', async () => {
    useBadgeStore.setState({ userBadges: [], loading: false });
    const earned = await checkAndAwardBadges('uid', makeCtx({ consecutiveWeeks: 4, familyLinked: false, earnedBadges: [] }));
    expect(earned.some((b) => b.id === 'independence')).toBe(true);
  });
});

// ──────────────────────────────────────────────
// 테스트 3: 중복 획득 방지
// ──────────────────────────────────────────────

describe('중복 획득 방지', () => {
  it('이미 획득한 뱃지는 재획득되지 않음', async () => {
    useBadgeStore.setState({ userBadges: [], loading: false });
    // 이미 획득 상태로 컨텍스트 구성
    const ctx = makeCtx({ planCount: 1, earnedBadges: ['plan'] });
    const earned = await checkAndAwardBadges('uid', ctx);
    expect(earned.some((b) => b.id === 'plan')).toBe(false);
  });

  it('checkSingleBadge: 스토어에 이미 있으면 false 반환', async () => {
    useBadgeStore.setState({
      userBadges: [{ badgeId: 'review', earnedAt: Date.now() }],
      loading: false,
    });
    const result = await checkSingleBadge('uid', 'review', makeCtx({ reviewCount: 1 }));
    expect(result).toBe(false);
  });
});

// ──────────────────────────────────────────────
// 테스트 4: 협상/합의 카드 기반 뱃지
// ──────────────────────────────────────────────

describe('협상/합의 뱃지', () => {
  it('negotiate: adjusting 경험 없으면 미획득', async () => {
    useBadgeStore.setState({ userBadges: [], loading: false });
    const earned = await checkAndAwardBadges('uid', makeCtx({ hasNegotiatedCard: false }));
    expect(earned.some((b) => b.id === 'negotiate')).toBe(false);
  });

  it('negotiate: adjusting 경험 있으면 획득', async () => {
    useBadgeStore.setState({ userBadges: [], loading: false });
    const earned = await checkAndAwardBadges('uid', makeCtx({ hasNegotiatedCard: true }));
    expect(earned.some((b) => b.id === 'negotiate')).toBe(true);
  });

  it('consensus: cheered 경험 있으면 획득', async () => {
    useBadgeStore.setState({ userBadges: [], loading: false });
    const earned = await checkAndAwardBadges('uid', makeCtx({ hasCheeredResponse: true }));
    expect(earned.some((b) => b.id === 'consensus')).toBe(true);
  });
});

// ──────────────────────────────────────────────
// 테스트 5: 스토어 통합
// ──────────────────────────────────────────────

describe('useBadgeStore 통합', () => {
  beforeEach(() => {
    useBadgeStore.setState({ userBadges: [], loading: false });
  });

  it('addBadge: 뱃지 추가 후 hasBadge true', () => {
    useBadgeStore.getState().addBadge({ badgeId: 'promise', earnedAt: Date.now() });
    expect(useBadgeStore.getState().hasBadge('promise')).toBe(true);
    expect(useBadgeStore.getState().hasBadge('review')).toBe(false);
  });

  it('setUserBadges: 전체 교체', () => {
    useBadgeStore.getState().addBadge({ badgeId: 'budget', earnedAt: Date.now() });
    useBadgeStore.getState().setUserBadges([
      { badgeId: 'plan', earnedAt: Date.now() },
      { badgeId: 'review', earnedAt: Date.now() },
    ]);
    expect(useBadgeStore.getState().userBadges).toHaveLength(2);
    expect(useBadgeStore.getState().hasBadge('budget')).toBe(false);
  });

  it('한 번에 여러 뱃지 획득 가능', async () => {
    const ctx = makeCtx({
      totalBudgetSet: true,
      planCount: 1,
      reviewCount: 1,
      earnedBadges: [],
    });
    const earned = await checkAndAwardBadges('uid', ctx);
    const ids = earned.map((b) => b.id);
    expect(ids).toContain('budget');
    expect(ids).toContain('plan');
    expect(ids).toContain('review');
  });
});
