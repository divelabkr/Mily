import { ACHIEVEMENTS, findAchievement } from '../src/engines/achievement/achievementDefinitions';
import { useAchievementStore } from '../src/engines/achievement/achievementStore';
import { AchievementContext } from '../src/engines/achievement/achievementTypes';

// Firebase mock
jest.mock('../src/lib/firebase', () => ({
  getFirebaseDb: jest.fn(() => ({})),
}));
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  getDocs: jest.fn(),
  setDoc: jest.fn(),
  getDoc: jest.fn(),
}));
jest.mock('../src/engines/analytics/analyticsService', () => ({
  trackEvent: jest.fn(),
}));

// ──────────────────────────────────────────────
// 테스트용 기본 컨텍스트 빌더
// ──────────────────────────────────────────────

function makeCtx(overrides: Partial<AchievementContext> = {}): AchievementContext {
  return {
    uid: 'test_user',
    totalCheckIns: 0,
    consecutiveWeeks: 0,
    reviewCount: 0,
    planCount: 0,
    familyLinked: false,
    praiseCardsSent: 0,
    requestCardsSent: 0,
    requestCardTypes: [],
    emotionTagCount: 0,
    emotionTagTypes: [],
    memoCheckIns: 0,
    promiseKeptCount: 0,
    underBudgetWeeks: 0,
    choiceSpendZeroWeeks: 0,
    earnedBadges: [],
    unlockedAchievements: [],
    todayCheckInCount: 0,
    todayCheckInAmounts: [],
    ...overrides,
  };
}

// ──────────────────────────────────────────────
// 테스트 1: 첫 체크인 업적 해금 조건
// ──────────────────────────────────────────────

describe('업적 조건: 기록 카테고리', () => {
  it('first_checkin: 체크인 0회 → 미해금', () => {
    const a = findAchievement('first_checkin')!;
    expect(a.condition(makeCtx({ totalCheckIns: 0 }))).toBe(false);
  });

  it('first_checkin: 체크인 1회 이상 → 해금', () => {
    const a = findAchievement('first_checkin')!;
    expect(a.condition(makeCtx({ totalCheckIns: 1 }))).toBe(true);
  });

  it('hundred_checkins: 99회 → 미해금, 100회 → 해금', () => {
    const a = findAchievement('hundred_checkins')!;
    expect(a.condition(makeCtx({ totalCheckIns: 99 }))).toBe(false);
    expect(a.condition(makeCtx({ totalCheckIns: 100 }))).toBe(true);
  });
});

// ──────────────────────────────────────────────
// 테스트 2: 감정 태그 업적 조건
// ──────────────────────────────────────────────

describe('업적 조건: 감정 태그', () => {
  it('all_emotions: 3종만 있으면 미해금', () => {
    const a = findAchievement('all_emotions')!;
    const ctx = makeCtx({
      emotionTagTypes: ['impulse', 'stress', 'social'],
    });
    expect(a.condition(ctx)).toBe(false);
  });

  it('all_emotions: 4종 모두 있으면 해금', () => {
    const a = findAchievement('all_emotions')!;
    const ctx = makeCtx({
      emotionTagTypes: ['impulse', 'stress', 'social', 'reward'],
    });
    expect(a.condition(ctx)).toBe(true);
  });
});

// ──────────────────────────────────────────────
// 테스트 3: 연속 주 업적 조건
// ──────────────────────────────────────────────

describe('업적 조건: 시간 카테고리', () => {
  it('four_weeks: 3주 → 미해금', () => {
    const a = findAchievement('four_weeks')!;
    expect(a.condition(makeCtx({ consecutiveWeeks: 3 }))).toBe(false);
  });

  it('four_weeks: 4주 → 해금', () => {
    const a = findAchievement('four_weeks')!;
    expect(a.condition(makeCtx({ consecutiveWeeks: 4 }))).toBe(true);
  });

  it('twelve_weeks: 12주 이상이면 four/eight/twelve 모두 해금', () => {
    const ctx = makeCtx({ consecutiveWeeks: 12 });
    expect(findAchievement('four_weeks')!.condition(ctx)).toBe(true);
    expect(findAchievement('eight_weeks')!.condition(ctx)).toBe(true);
    expect(findAchievement('twelve_weeks')!.condition(ctx)).toBe(true);
  });
});

// ──────────────────────────────────────────────
// 테스트 4: 가족 업적 조건
// ──────────────────────────────────────────────

describe('업적 조건: 가족 카테고리', () => {
  it('family_linker: 가족 미연결 → 미해금', () => {
    const a = findAchievement('family_linker')!;
    expect(a.condition(makeCtx({ familyLinked: false }))).toBe(false);
  });

  it('family_linker: 가족 연결 → 해금', () => {
    const a = findAchievement('family_linker')!;
    expect(a.condition(makeCtx({ familyLinked: true }))).toBe(true);
  });

  it('three_request_types: 2종 → 미해금, 3종 → 해금', () => {
    const a = findAchievement('three_request_types')!;
    expect(a.condition(makeCtx({ requestCardTypes: ['extra_budget', 'plan_change'] }))).toBe(false);
    expect(
      a.condition(makeCtx({ requestCardTypes: ['extra_budget', 'plan_change', 'reward'] }))
    ).toBe(true);
  });
});

// ──────────────────────────────────────────────
// 테스트 5: 히든 업적 + 스토어 통합
// ──────────────────────────────────────────────

describe('히든 업적 + 스토어', () => {
  beforeEach(() => {
    useAchievementStore.setState({
      userAchievements: [],
      statsMap: {},
      pendingUnlock: null,
      loading: false,
    });
  });

  it('lucky_seven: 7777원 아닌 금액 → 미해금', () => {
    const a = findAchievement('lucky_seven')!;
    expect(a.condition(makeCtx({ todayCheckInAmounts: [7000, 777] }))).toBe(false);
  });

  it('lucky_seven: 7777원 정확히 → 해금', () => {
    const a = findAchievement('lucky_seven')!;
    expect(a.condition(makeCtx({ todayCheckInAmounts: [7777] }))).toBe(true);
  });

  it('lucky_seven: isHidden=true, rarity=hidden', () => {
    const a = findAchievement('lucky_seven')!;
    expect(a.isHidden).toBe(true);
    expect(a.rarity).toBe('hidden');
  });

  it('스토어 addUnlocked: 업적 추가 후 isUnlocked 반환 true', () => {
    const store = useAchievementStore.getState();
    store.addUnlocked({ achievementId: 'first_checkin', unlockedAt: Date.now(), shared: false });
    expect(useAchievementStore.getState().isUnlocked('first_checkin')).toBe(true);
    expect(useAchievementStore.getState().isUnlocked('five_checkins')).toBe(false);
  });

  it('스토어 setPendingUnlock: 팝업 대기 업적 설정', () => {
    const a = findAchievement('first_checkin')!;
    useAchievementStore.getState().setPendingUnlock(a);
    expect(useAchievementStore.getState().pendingUnlock?.id).toBe('first_checkin');
    useAchievementStore.getState().setPendingUnlock(null);
    expect(useAchievementStore.getState().pendingUnlock).toBeNull();
  });

  it('ACHIEVEMENTS 전체 30개 이상 정의됨', () => {
    expect(ACHIEVEMENTS.length).toBeGreaterThanOrEqual(30);
  });
});
