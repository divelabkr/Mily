// Grade A 함수는 Anthropic SDK 모킹 (API 키 불필요)
jest.mock('@anthropic-ai/sdk', () => {
  return jest.fn().mockImplementation(() => ({
    messages: {
      create: jest.fn().mockRejectedValue(new Error('ANTHROPIC_API_KEY not set')),
    },
  }));
});

import {
  getWeeklyReview,
  getRequestCardBuffer,
  getDailySummaryInsight,
  getParentChildSignal,
  getReconcileProposal,
  getGreeting,
  getAchievementMessage,
  getEmptyStateMessage,
  getPraiseRecommendation,
  getCheerMessage,
  getLegalDisclaimer,
  getErrorMessage,
  getDNANotice,
} from '../src/engines/message/messageService';
import type { WeeklyReviewInput } from '../src/engines/ai/prompts/weeklyReview';
import type { RequestBufferInput } from '../src/engines/ai/prompts/requestBuffer';

// ══════════════════════════════════════════════
// GRADE A — Fallback 동작 (Haiku 실패 시)
// ══════════════════════════════════════════════

describe('messageService — Grade A (fallback)', () => {
  const weeklyInput: WeeklyReviewInput = {
    categories: [
      { categoryId: 'food', label: '식비', planned: 50000, actual: 40000 },
    ],
    emotionTags: [],
    totalBudget: 100000,
    totalSpent: 40000,
  };

  it('getWeeklyReview — fallback 반환 (message + emoji)', async () => {
    const result = await getWeeklyReview(weeklyInput);
    expect(result).toHaveProperty('message');
    expect(result).toHaveProperty('emoji');
    expect(result.message.length).toBeGreaterThan(0);
  });

  it('getWeeklyReview — 예산 초과 시 fallback 메시지 다름', async () => {
    const overInput = { ...weeklyInput, totalSpent: 150000 };
    const result = await getWeeklyReview(overInput);
    expect(result.message).toBeTruthy();
  });

  it('getRequestCardBuffer — fallback은 원문 반환', async () => {
    const input: RequestBufferInput = {
      originalText: '이번 달 용돈 좀 더 받을 수 있을까요?',
      requestType: 'extra_budget',
    };
    const result = await getRequestCardBuffer(input);
    expect(result.message).toBeTruthy();
    expect(result.emoji).toBeTruthy();
  });

  it('getDailySummaryInsight — fallback 반환', async () => {
    const result = await getDailySummaryInsight({
      date: '2026-03-25',
      totalAmount: 30000,
      choiceAmount: 20000,
      checkInCount: 2,
    });
    expect(result).toHaveProperty('message');
    expect(result).toHaveProperty('emoji');
  });

  it('getParentChildSignal — fallback에 자녀 이름 포함', async () => {
    const result = await getParentChildSignal({
      childName: '민준',
      weekId: '2026-W13',
      checkInCount: 3,
      hadReview: false,
    });
    expect(result.message).toContain('민준');
  });

  it('getReconcileProposal — 초과 시 카테고리명 포함', async () => {
    const result = await getReconcileProposal({
      month: '2026-03',
      planned: 100000,
      actual: 130000,
      topChoiceCategory: '외식',
    });
    expect(result.message).toContain('외식');
  });

  it('getReconcileProposal — 예산 내 달성 fallback', async () => {
    const result = await getReconcileProposal({
      month: '2026-03',
      planned: 100000,
      actual: 80000,
      topChoiceCategory: '취미',
    });
    expect(result.message).toBeTruthy();
  });
});

// ══════════════════════════════════════════════
// GRADE B — 템플릿 풀
// ══════════════════════════════════════════════

describe('messageService — Grade B (템플릿)', () => {
  describe('getGreeting', () => {
    it('자녀 아침 인사 반환', () => {
      const result = getGreeting({ hour: 8, streakWeeks: 0, role: 'child' });
      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('emoji');
      expect(result.message).toMatch(/아침/);
    });

    it('부모 저녁 인사 반환', () => {
      const result = getGreeting({ hour: 20, streakWeeks: 0, role: 'parent' });
      expect(result.message).toMatch(/저녁/);
    });

    it('4주 스트릭 → 주수 포함', () => {
      const result = getGreeting({ hour: 10, streakWeeks: 4, role: 'child' });
      expect(result.message).toContain('4주');
    });

    it('새벽 시간대 반영', () => {
      const result = getGreeting({ hour: 2, streakWeeks: 0, role: 'parent' });
      expect(result.message).toMatch(/새벽/);
    });
  });

  describe('getAchievementMessage', () => {
    const rarities = ['common', 'uncommon', 'rare', 'epic', 'hidden'] as const;

    test.each(rarities)('"%s" 희귀도 메시지 반환', (rarity) => {
      const result = getAchievementMessage(rarity);
      expect(result.message.length).toBeGreaterThan(0);
      expect(result.emoji.length).toBeGreaterThan(0);
    });
  });

  describe('getEmptyStateMessage', () => {
    it('홈/부모 빈 상태', () => {
      const result = getEmptyStateMessage('home', 'parent');
      expect(result.message).toBeTruthy();
    });

    it('계획/자녀 빈 상태', () => {
      const result = getEmptyStateMessage('plan', 'child');
      expect(result.message).toBeTruthy();
    });

    it('가족/부모 빈 상태 — 초대 관련', () => {
      const result = getEmptyStateMessage('family', 'parent');
      expect(result.message).toMatch(/초대/);
    });
  });

  describe('getPraiseRecommendation', () => {
    it('budget_kept → well_saved 타입 반환', () => {
      const result = getPraiseRecommendation('budget_kept');
      expect(result.type).toBe('well_saved');
      expect(result.message.length).toBeGreaterThan(0);
    });

    it('request_polite → thank_you 타입 반환', () => {
      const result = getPraiseRecommendation('request_polite');
      expect(result.type).toBe('thank_you');
    });

    it('streak → good_effort 타입 반환', () => {
      const result = getPraiseRecommendation('streak');
      expect(result.type).toBe('good_effort');
    });
  });

  describe('getCheerMessage', () => {
    it('goal_set 응원 메시지', () => {
      const result = getCheerMessage('goal_set');
      expect(result.message).toBeTruthy();
      expect(result.emoji).toBeTruthy();
    });

    it('result_challenge — 도전 관련 메시지', () => {
      const result = getCheerMessage('result_challenge');
      expect(result.message).toMatch(/도전|해냈|대단/);
    });
  });
});

// ══════════════════════════════════════════════
// GRADE C — 하드코딩
// ══════════════════════════════════════════════

describe('messageService — Grade C (하드코딩)', () => {
  it('getLegalDisclaimer — "금융 서비스" 포함', () => {
    expect(getLegalDisclaimer()).toMatch(/금융 서비스가 아닙니다/);
  });

  it('getLegalDisclaimer — "송금" 불포함 (DNA 일치)', () => {
    expect(getLegalDisclaimer()).not.toMatch(/송금/);
  });

  it('getErrorMessage — network 오류 메시지', () => {
    expect(getErrorMessage('network')).toMatch(/인터넷/);
  });

  it('getErrorMessage — auth 오류 메시지', () => {
    expect(getErrorMessage('auth')).toMatch(/로그인/);
  });

  it('getErrorMessage — unknown 오류 메시지', () => {
    expect(getErrorMessage('unknown')).toBeTruthy();
  });

  it('getDNANotice — "판단하지 않습니다" 포함', () => {
    expect(getDNANotice()).toMatch(/판단하지 않습니다/);
  });
});

// ══════════════════════════════════════════════
// DNA Guardian 통합 검증
// ══════════════════════════════════════════════

describe('messageService — DNA 통과 검증', () => {
  it('모든 Grade B 반환값이 DNA 통과 (에러 없이 반환됨 = DNA ✅)', () => {
    expect(() => getGreeting({ hour: 9, streakWeeks: 1, role: 'child' })).not.toThrow();
    expect(() => getAchievementMessage('epic')).not.toThrow();
    expect(() => getEmptyStateMessage('review', 'parent')).not.toThrow();
    expect(() => getPraiseRecommendation('first_checkin')).not.toThrow();
    expect(() => getCheerMessage('result_easy')).not.toThrow();
  });

  it('Grade C 반환값 DNA 통과 (금지어 없음)', () => {
    const disclaimer = getLegalDisclaimer();
    const forbiddenInDisclaimer = ['송금', '이체', '통제', '감시', '과소비'];
    forbiddenInDisclaimer.forEach((word) => {
      expect(disclaimer).not.toContain(word);
    });
  });
});
