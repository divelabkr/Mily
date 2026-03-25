import { ACHIEVEMENTS, findAchievement } from '../src/engines/achievement/achievementDefinitions';
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
    totalCheckIns: 0, consecutiveWeeks: 0, reviewCount: 0, planCount: 0,
    familyLinked: false, praiseCardsSent: 0, requestCardsSent: 0,
    requestCardTypes: [], emotionTagCount: 0, emotionTagTypes: [],
    memoCheckIns: 0, promiseKeptCount: 0, underBudgetWeeks: 0,
    choiceSpendZeroWeeks: 0, earnedBadges: [], unlockedAchievements: [],
    todayCheckInCount: 0, todayCheckInAmounts: [],
    praiseCardsReceived: 0, giveCheckIns: 0, daysSinceLastCheckIn: 0,
    economyTipsViewed: 0, dailyCheckInStreak: 0, requestCardsResolved: 0,
    // New Bundle 3 fields
    savingsCheckIns: 0, choiceSpendDecreased: false, contractsCompleted: 0,
    ageBandUpgraded: false, isGraduated: false, freedomIndex: 0,
    familyBankCompleted: false, totalMilyXp: 0,
    ...overrides,
  };
}

// ──────────────────────────────────────────────
// Bundle 3 신규 업적: 기록 스트릭 카테고리
// ──────────────────────────────────────────────

describe('업적 조건 (Bundle 3): 일 연속 스트릭', () => {
  it('streak_3: dailyCheckInStreak 2 → 미해금', () => {
    const a = findAchievement('streak_3')!;
    expect(a.condition(makeCtx({ dailyCheckInStreak: 2 }))).toBe(false);
  });

  it('streak_3: dailyCheckInStreak 3 → 해금', () => {
    const a = findAchievement('streak_3')!;
    expect(a.condition(makeCtx({ dailyCheckInStreak: 3 }))).toBe(true);
  });

  it('streak_7: dailyCheckInStreak 6 → 미해금', () => {
    const a = findAchievement('streak_7')!;
    expect(a.condition(makeCtx({ dailyCheckInStreak: 6 }))).toBe(false);
  });

  it('streak_7: dailyCheckInStreak 7 → 해금', () => {
    const a = findAchievement('streak_7')!;
    expect(a.condition(makeCtx({ dailyCheckInStreak: 7 }))).toBe(true);
  });

  it('streak_30: dailyCheckInStreak 29 → 미해금', () => {
    const a = findAchievement('streak_30')!;
    expect(a.condition(makeCtx({ dailyCheckInStreak: 29 }))).toBe(false);
  });

  it('streak_30: dailyCheckInStreak 30 → 해금', () => {
    const a = findAchievement('streak_30')!;
    expect(a.condition(makeCtx({ dailyCheckInStreak: 30 }))).toBe(true);
  });
});

// ──────────────────────────────────────────────
// Bundle 3 신규 업적: 기록 마일스톤
// ──────────────────────────────────────────────

describe('업적 조건 (Bundle 3): 기록 마일스톤', () => {
  it('records_10: totalCheckIns 9 → 미해금', () => {
    const a = findAchievement('records_10')!;
    expect(a.condition(makeCtx({ totalCheckIns: 9 }))).toBe(false);
  });

  it('records_10: totalCheckIns 10 → 해금', () => {
    const a = findAchievement('records_10')!;
    expect(a.condition(makeCtx({ totalCheckIns: 10 }))).toBe(true);
  });
});

// ──────────────────────────────────────────────
// Bundle 3 신규 업적: 계획/절약 카테고리
// ──────────────────────────────────────────────

describe('업적 조건 (Bundle 3): 계획/절약', () => {
  it('first_save: savingsCheckIns 0 → 미해금', () => {
    const a = findAchievement('first_save')!;
    expect(a.condition(makeCtx({ savingsCheckIns: 0 }))).toBe(false);
  });

  it('first_save: savingsCheckIns 1 → 해금', () => {
    const a = findAchievement('first_save')!;
    expect(a.condition(makeCtx({ savingsCheckIns: 1 }))).toBe(true);
  });

  it('budget_kept: underBudgetWeeks 0 → 미해금', () => {
    const a = findAchievement('budget_kept')!;
    expect(a.condition(makeCtx({ underBudgetWeeks: 0 }))).toBe(false);
  });

  it('budget_kept: underBudgetWeeks 1 → 해금', () => {
    const a = findAchievement('budget_kept')!;
    expect(a.condition(makeCtx({ underBudgetWeeks: 1 }))).toBe(true);
  });

  it('choice_down: choiceSpendDecreased false → 미해금', () => {
    const a = findAchievement('choice_down')!;
    expect(a.condition(makeCtx({ choiceSpendDecreased: false }))).toBe(false);
  });

  it('choice_down: choiceSpendDecreased true → 해금', () => {
    const a = findAchievement('choice_down')!;
    expect(a.condition(makeCtx({ choiceSpendDecreased: true }))).toBe(true);
  });

  it('promise_kept: promiseKeptCount 0 → 미해금', () => {
    const a = findAchievement('promise_kept')!;
    expect(a.condition(makeCtx({ promiseKeptCount: 0 }))).toBe(false);
  });

  it('promise_kept: promiseKeptCount 1 → 해금', () => {
    const a = findAchievement('promise_kept')!;
    expect(a.condition(makeCtx({ promiseKeptCount: 1 }))).toBe(true);
  });
});

// ──────────────────────────────────────────────
// Bundle 3 신규 업적: 가족 카테고리
// ──────────────────────────────────────────────

describe('업적 조건 (Bundle 3): 가족 합의', () => {
  it('contract_complete: contractsCompleted 0 → 미해금', () => {
    const a = findAchievement('contract_complete')!;
    expect(a.condition(makeCtx({ contractsCompleted: 0 }))).toBe(false);
  });

  it('contract_complete: contractsCompleted 1 → 해금', () => {
    const a = findAchievement('contract_complete')!;
    expect(a.condition(makeCtx({ contractsCompleted: 1 }))).toBe(true);
  });
});

// ──────────────────────────────────────────────
// Bundle 3 신규 업적: 뱃지 연동 (badge 카테고리)
// ──────────────────────────────────────────────

describe('업적 조건 (Bundle 3): 뱃지 연동', () => {
  it('first_report: reviewCount 0 → 미해금', () => {
    const a = findAchievement('first_report')!;
    expect(a.condition(makeCtx({ reviewCount: 0 }))).toBe(false);
  });

  it('first_report: reviewCount 1 → 해금', () => {
    const a = findAchievement('first_report')!;
    expect(a.condition(makeCtx({ reviewCount: 1 }))).toBe(true);
  });

  it('first_report: category가 badge임을 확인', () => {
    const a = findAchievement('first_report')!;
    expect(a.category).toBe('badge');
  });

  it('economy_tip_x5: economyTipsViewed 4 → 미해금', () => {
    const a = findAchievement('economy_tip_x5')!;
    expect(a.condition(makeCtx({ economyTipsViewed: 4 }))).toBe(false);
  });

  it('economy_tip_x5: economyTipsViewed 5 → 해금', () => {
    const a = findAchievement('economy_tip_x5')!;
    expect(a.condition(makeCtx({ economyTipsViewed: 5 }))).toBe(true);
  });

  it('economy_tip_x5: category가 badge임을 확인', () => {
    const a = findAchievement('economy_tip_x5')!;
    expect(a.category).toBe('badge');
  });

  it('band_up: ageBandUpgraded false → 미해금', () => {
    const a = findAchievement('band_up')!;
    expect(a.condition(makeCtx({ ageBandUpgraded: false }))).toBe(false);
  });

  it('band_up: ageBandUpgraded true → 해금', () => {
    const a = findAchievement('band_up')!;
    expect(a.condition(makeCtx({ ageBandUpgraded: true }))).toBe(true);
  });

  it('graduation: isGraduated false → 미해금', () => {
    const a = findAchievement('graduation')!;
    expect(a.condition(makeCtx({ isGraduated: false }))).toBe(false);
  });

  it('graduation: isGraduated true → 해금', () => {
    const a = findAchievement('graduation')!;
    expect(a.condition(makeCtx({ isGraduated: true }))).toBe(true);
  });

  it('millionaire_start: totalMilyXp 999 → 미해금', () => {
    const a = findAchievement('millionaire_start')!;
    expect(a.condition(makeCtx({ totalMilyXp: 999 }))).toBe(false);
  });

  it('millionaire_start: totalMilyXp 1000 → 해금', () => {
    const a = findAchievement('millionaire_start')!;
    expect(a.condition(makeCtx({ totalMilyXp: 1000 }))).toBe(true);
  });
});

// ──────────────────────────────────────────────
// Bundle 3 신규 업적: 히든 마일스톤
// ──────────────────────────────────────────────

describe('업적 조건 (Bundle 3): 히든 마일스톤', () => {
  it('rat_race_escape: freedomIndex 99 → 미해금', () => {
    const a = findAchievement('rat_race_escape')!;
    expect(a.condition(makeCtx({ freedomIndex: 99 }))).toBe(false);
  });

  it('rat_race_escape: freedomIndex 100 → 해금', () => {
    const a = findAchievement('rat_race_escape')!;
    expect(a.condition(makeCtx({ freedomIndex: 100 }))).toBe(true);
  });

  it('rat_race_escape: isHidden=true, rarity=hidden', () => {
    const a = findAchievement('rat_race_escape')!;
    expect(a.isHidden).toBe(true);
    expect(a.rarity).toBe('hidden');
  });

  it('family_bank_master: familyBankCompleted false → 미해금', () => {
    const a = findAchievement('family_bank_master')!;
    expect(a.condition(makeCtx({ familyBankCompleted: false }))).toBe(false);
  });

  it('family_bank_master: familyBankCompleted true → 해금', () => {
    const a = findAchievement('family_bank_master')!;
    expect(a.condition(makeCtx({ familyBankCompleted: true }))).toBe(true);
  });

  it('family_bank_master: isHidden=true, rarity=hidden', () => {
    const a = findAchievement('family_bank_master')!;
    expect(a.isHidden).toBe(true);
    expect(a.rarity).toBe('hidden');
  });
});

// ──────────────────────────────────────────────
// 전체 업적 무결성 검증
// ──────────────────────────────────────────────

describe('ACHIEVEMENTS 전체 무결성', () => {
  it('전체 업적 수 40개 이상', () => {
    expect(ACHIEVEMENTS.length).toBeGreaterThanOrEqual(40);
  });

  it('모든 업적의 ID가 유일함', () => {
    const ids = ACHIEVEMENTS.map((a) => a.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });
});
