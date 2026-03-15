/**
 * reportSystemV2.test.ts
 * 역할 기반 리포트 시스템 v2 단위 테스트
 * 3 roles × 2 periods = 6 report types
 */

import {
  REPORT_TYPES,
  getAgeBand,
  AGE_BAND_RANGES,
  ReportInput,
} from '../src/engines/review/reportTypes';

import {
  ECONOMY_TIPS,
  getEconomyTip,
} from '../src/engines/review/economyTips';

import {
  getReportSystemPrompt,
  buildReportUserMessage,
} from '../src/engines/review/reportPrompts';

import {
  generateReport,
  weekIndexFromId,
} from '../src/engines/review/reportService';

// Anthropic SDK 모킹
jest.mock('@anthropic-ai/sdk', () => {
  return jest.fn().mockImplementation(() => ({
    messages: {
      create: jest.fn().mockRejectedValue(new Error('ANTHROPIC_API_KEY not set')),
    },
  }));
});

// ──────────────────────────────────────────────
// 1. reportTypes — 6개 타입 구조
// ──────────────────────────────────────────────

describe('REPORT_TYPES', () => {
  it('6개 리포트 타입', () => {
    expect(REPORT_TYPES).toHaveLength(6);
  });

  it('solo_adult_weekly 포함', () => {
    expect(REPORT_TYPES).toContain('solo_adult_weekly');
  });

  it('child_monthly 포함', () => {
    expect(REPORT_TYPES).toContain('child_monthly');
  });

  it('3 roles × 2 periods 조합 완전', () => {
    const roles = ['solo_adult', 'parent', 'child'];
    const periods = ['weekly', 'monthly'];
    for (const role of roles) {
      for (const period of periods) {
        expect(REPORT_TYPES).toContain(`${role}_${period}`);
      }
    }
  });
});

// ──────────────────────────────────────────────
// 2. getAgeBand()
// ──────────────────────────────────────────────

describe('getAgeBand()', () => {
  it('7세 → A', () => expect(getAgeBand(7)).toBe('A'));
  it('9세 → A', () => expect(getAgeBand(9)).toBe('A'));
  it('10세 → B', () => expect(getAgeBand(10)).toBe('B'));
  it('12세 → B', () => expect(getAgeBand(12)).toBe('B'));
  it('13세 → C', () => expect(getAgeBand(13)).toBe('C'));
  it('15세 → C', () => expect(getAgeBand(15)).toBe('C'));
  it('16세 → D', () => expect(getAgeBand(16)).toBe('D'));
  it('18세 → D', () => expect(getAgeBand(18)).toBe('D'));
});

// ──────────────────────────────────────────────
// 3. economyTips
// ──────────────────────────────────────────────

describe('ECONOMY_TIPS', () => {
  it('4개 밴드(A~D) 모두 팁 있음', () => {
    expect(ECONOMY_TIPS.A.length).toBeGreaterThan(0);
    expect(ECONOMY_TIPS.B.length).toBeGreaterThan(0);
    expect(ECONOMY_TIPS.C.length).toBeGreaterThan(0);
    expect(ECONOMY_TIPS.D.length).toBeGreaterThan(0);
  });

  it('모든 팁에 concept과 body 있음', () => {
    for (const band of ['A', 'B', 'C', 'D'] as const) {
      for (const tip of ECONOMY_TIPS[band]) {
        expect(tip.concept.length).toBeGreaterThan(0);
        expect(tip.body.length).toBeGreaterThan(0);
      }
    }
  });

  it('팁에 판단형/훈계형 표현 없음', () => {
    for (const band of ['A', 'B', 'C', 'D'] as const) {
      for (const tip of ECONOMY_TIPS[band]) {
        expect(tip.body).not.toContain('문제');
        expect(tip.body).not.toContain('잘못');
        expect(tip.body).not.toContain('나쁜');
      }
    }
  });
});

describe('getEconomyTip()', () => {
  it('weekIndex 기반 순환 — 같은 밴드 다른 팁', () => {
    const tip0 = getEconomyTip('B', 0);
    const tip1 = getEconomyTip('B', 1);
    // 팁이 2개 이상이면 순환해야 함
    if (ECONOMY_TIPS.B.length > 1) {
      expect(tip0.id).not.toBe(tip1.id);
    }
  });

  it('weekIndex 초과 시 순환 (modulo)', () => {
    const tips = ECONOMY_TIPS.A;
    const tip = getEconomyTip('A', tips.length);
    expect(tip.id).toBe(tips[0].id);
  });
});

// ──────────────────────────────────────────────
// 4. reportPrompts
// ──────────────────────────────────────────────

describe('getReportSystemPrompt()', () => {
  const combinations = [
    ['solo_adult', 'weekly'],
    ['solo_adult', 'monthly'],
    ['parent', 'weekly'],
    ['parent', 'monthly'],
    ['child', 'weekly'],
    ['child', 'monthly'],
  ] as const;

  it('6개 조합 모두 프롬프트 있음', () => {
    for (const [role, period] of combinations) {
      const prompt = getReportSystemPrompt(role, period);
      expect(prompt.length).toBeGreaterThan(50);
    }
  });

  it('child 프롬프트에 비난/훈계 금지 명시', () => {
    const prompt = getReportSystemPrompt('child', 'weekly');
    expect(prompt).toContain('훈계');
  });

  it('모든 프롬프트에 판단형 표현 금지 명시', () => {
    for (const [role, period] of combinations) {
      const prompt = getReportSystemPrompt(role, period);
      expect(prompt).toContain('판단형');
    }
  });

  it('모든 프롬프트에 출력 형식 JSON 명시', () => {
    for (const [role, period] of combinations) {
      const prompt = getReportSystemPrompt(role, period);
      expect(prompt).toContain('JSON');
    }
  });
});

describe('buildReportUserMessage()', () => {
  it('역할/기간 포함', () => {
    const input: ReportInput = {
      role: 'solo_adult',
      period: 'weekly',
      totalBudget: 100000,
      totalSpent: 80000,
      categories: [],
    };
    const msg = buildReportUserMessage(input);
    expect(msg).toContain('solo_adult');
    expect(msg).toContain('weekly');
  });

  it('ageBand가 있으면 메시지에 포함', () => {
    const input: ReportInput = {
      role: 'child',
      period: 'weekly',
      totalBudget: 30000,
      totalSpent: 20000,
      categories: [],
      ageBand: 'B',
    };
    const msg = buildReportUserMessage(input);
    expect(msg).toContain('B');
  });
});

// ──────────────────────────────────────────────
// 5. reportService — generateReport() 폴백
// ──────────────────────────────────────────────

describe('generateReport() — AI 실패 시 폴백', () => {
  const baseInput: ReportInput = {
    role: 'solo_adult',
    period: 'weekly',
    totalBudget: 100000,
    totalSpent: 80000,
    categories: [
      { categoryId: 'food', label: '식비', planned: 40000, actual: 30000 },
      { categoryId: 'transport', label: '교통', planned: 20000, actual: 25000 },
    ],
  };

  it('폴백 결과 반환 (aiUsed=false)', async () => {
    const result = await generateReport(baseInput);
    expect(result.aiUsed).toBe(false);
    expect(result.role).toBe('solo_adult');
    expect(result.period).toBe('weekly');
  });

  it('headline, highlights, suggestion 모두 있음', async () => {
    const result = await generateReport(baseInput);
    expect(result.headline.length).toBeGreaterThan(0);
    expect(result.highlights.length).toBeGreaterThan(0);
    expect(result.suggestion.length).toBeGreaterThan(0);
  });

  it('child 리포트 + ageBand → economyTip 포함', async () => {
    const childInput: ReportInput = {
      ...baseInput,
      role: 'child',
      ageBand: 'B',
    };
    const result = await generateReport(childInput);
    expect(result.economyTip).toBeDefined();
    expect(result.economyTip!).toContain('경제 개념');
  });

  it('solo_adult 리포트 → economyTip 없음', async () => {
    const result = await generateReport(baseInput);
    expect(result.economyTip).toBeUndefined();
  });
});

// ──────────────────────────────────────────────
// 6. weekIndexFromId()
// ──────────────────────────────────────────────

describe('weekIndexFromId()', () => {
  it('2025-W01 → 0', () => {
    expect(weekIndexFromId('2025-W01')).toBe(0);
  });

  it('2025-W10 → 9', () => {
    expect(weekIndexFromId('2025-W10')).toBe(9);
  });
});
