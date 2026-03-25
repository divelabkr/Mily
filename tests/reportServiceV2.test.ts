// ──────────────────────────────────────────────
// reportServiceV2.test.ts — reportService + DNA filter 통합 테스트
// ──────────────────────────────────────────────

import { generateReport, weekIndexFromId } from '../src/engines/review/reportService';
import {
  ReportInput,
  ReportOutput,
  REPORT_TYPES,
  getAgeBand,
  AGE_BAND_RANGES,
} from '../src/engines/review/reportTypes';
import { ECONOMY_TIPS, getEconomyTip } from '../src/engines/review/economyTips';

jest.mock('@anthropic-ai/sdk', () => {
  return jest.fn().mockImplementation(() => ({
    messages: {
      create: jest.fn().mockRejectedValue(new Error('ANTHROPIC_API_KEY not set')),
    },
  }));
});

// ── 테스트 픽스처 ─────────────────────────────

const BASE_CATEGORIES = [
  { categoryId: 'food' as const, label: '식비', planned: 100000, actual: 80000 },
  { categoryId: 'transport' as const, label: '교통', planned: 50000, actual: 55000 },
];

function makeInput(overrides: Partial<ReportInput> = {}): ReportInput {
  return {
    role: 'solo_adult',
    period: 'weekly',
    weekId: '2025-W10',
    totalBudget: 300000,
    totalSpent: 250000,
    categories: BASE_CATEGORIES,
    ...overrides,
  };
}

// ── generateReport 폴백 ───────────────────────

describe('generateReport — fallback (AI 실패 시)', () => {
  it('1. solo_adult 폴백: aiUsed=false', async () => {
    const result = await generateReport(makeInput({ role: 'solo_adult' }));
    expect(result.aiUsed).toBe(false);
  });

  it('2. 폴백 출력: headline, highlights, suggestion 존재', async () => {
    const result = await generateReport(makeInput());
    expect(result.headline).toBeTruthy();
    expect(Array.isArray(result.highlights)).toBe(true);
    expect(result.highlights.length).toBeGreaterThanOrEqual(1);
    expect(result.suggestion).toBeTruthy();
  });

  it('3. child + ageBand 폴백: economyTip 포함', async () => {
    const result = await generateReport(
      makeInput({ role: 'child', ageBand: 'B' })
    );
    expect(result.economyTip).toBeTruthy();
  });

  it('4. solo_adult 폴백: economyTip 없음', async () => {
    const result = await generateReport(makeInput({ role: 'solo_adult' }));
    expect(result.economyTip).toBeUndefined();
  });

  it('5. parent role 폴백 정상 동작', async () => {
    const result = await generateReport(
      makeInput({
        role: 'parent',
        familySummary: {
          totalBudget: 500000,
          totalSpent: 420000,
          keptPromises: 3,
          praiseSent: 2,
        },
      })
    );
    expect(result.role).toBe('parent');
    expect(result.aiUsed).toBe(false);
  });

  it('6. 폴백 headline에 기간 레이블 포함 (이번 주 또는 이번 달)', async () => {
    const weekly = await generateReport(makeInput({ period: 'weekly' }));
    const monthly = await generateReport(
      makeInput({ period: 'monthly', month: '2025-03' })
    );
    expect(weekly.headline).toMatch(/이번 주/);
    expect(monthly.headline).toMatch(/이번 달/);
  });

  it('7. 폴백 suggestion은 "~해볼까요?" 패턴 사용', async () => {
    const result = await generateReport(makeInput());
    expect(result.suggestion).toMatch(/해볼까요\?/);
  });

  it('8. child 폴백 economyTip에 "경제 개념" 포함', async () => {
    const result = await generateReport(
      makeInput({ role: 'child', ageBand: 'A' })
    );
    expect(result.economyTip).toMatch(/경제 개념/);
  });

  it('16. 폴백 리포트에 금지 패턴 미포함', async () => {
    const result = await generateReport(makeInput());
    const fullText = [result.headline, ...result.highlights, result.suggestion].join(' ');
    expect(fullText).not.toMatch(/문제가 있/);
    expect(fullText).not.toMatch(/줄이세요/);
    expect(fullText).not.toMatch(/통제/);
    expect(fullText).not.toMatch(/훈계/);
    expect(fullText).not.toMatch(/과소비/);
  });

  it('17. monthly 폴백 정상 동작', async () => {
    const result = await generateReport(
      makeInput({ period: 'monthly', month: '2025-03', weekId: undefined })
    );
    expect(result.period).toBe('monthly');
    expect(result.aiUsed).toBe(false);
    expect(result.headline).toMatch(/이번 달/);
  });

  it('18. parent weekly 폴백: 가족 또는 소비 언급', async () => {
    const result = await generateReport(
      makeInput({
        role: 'parent',
        period: 'weekly',
        familySummary: {
          totalBudget: 600000,
          totalSpent: 500000,
          keptPromises: 2,
          praiseSent: 1,
        },
      })
    );
    const fullText = [result.headline, ...result.highlights, result.suggestion].join(' ');
    expect(fullText).toMatch(/가족|소비/);
  });
});

// ── weekIndexFromId ───────────────────────────

describe('weekIndexFromId', () => {
  it('9. "2025-W01" → 0', () => {
    expect(weekIndexFromId('2025-W01')).toBe(0);
  });

  it('10. "2025-W10" → 9', () => {
    expect(weekIndexFromId('2025-W10')).toBe(9);
  });

  it('11. "2025-W52" → 51', () => {
    expect(weekIndexFromId('2025-W52')).toBe(51);
  });

  it('12. 유효하지 않은 입력 → 0', () => {
    expect(weekIndexFromId('invalid')).toBe(0);
    expect(weekIndexFromId('')).toBe(0);
    expect(weekIndexFromId('2025')).toBe(0);
  });
});

// ── getAgeBand ────────────────────────────────

describe('getAgeBand — 엣지 케이스', () => {
  it('13. 연령 밴드 경계 값 매핑', () => {
    expect(getAgeBand(7)).toBe('A');
    expect(getAgeBand(9)).toBe('A');
    expect(getAgeBand(10)).toBe('B');
    expect(getAgeBand(15)).toBe('C');
    expect(getAgeBand(16)).toBe('D');
    expect(getAgeBand(19)).toBe('D');
  });
});

// ── REPORT_TYPES ──────────────────────────────

describe('REPORT_TYPES', () => {
  it('14. REPORT_TYPES에 정확히 6개 항목 존재', () => {
    expect(REPORT_TYPES).toHaveLength(6);
  });

  it('15. 6개 리포트 타입 조합 모두 존재', () => {
    expect(REPORT_TYPES).toContain('solo_adult_weekly');
    expect(REPORT_TYPES).toContain('solo_adult_monthly');
    expect(REPORT_TYPES).toContain('parent_weekly');
    expect(REPORT_TYPES).toContain('parent_monthly');
    expect(REPORT_TYPES).toContain('child_weekly');
    expect(REPORT_TYPES).toContain('child_monthly');
  });
});

// ── AGE_BAND_RANGES ───────────────────────────

describe('AGE_BAND_RANGES', () => {
  it('19. 4개 밴드 모두 min/max 존재', () => {
    const bands = ['A', 'B', 'C', 'D'] as const;
    for (const band of bands) {
      expect(AGE_BAND_RANGES[band]).toHaveProperty('min');
      expect(AGE_BAND_RANGES[band]).toHaveProperty('max');
      expect(typeof AGE_BAND_RANGES[band].min).toBe('number');
      expect(typeof AGE_BAND_RANGES[band].max).toBe('number');
    }
  });
});

// ── Economy Tips 통합 ─────────────────────────

describe('Economy Tips 통합', () => {
  it('20. 모든 밴드의 getEconomyTip이 유효한 팁 반환', () => {
    const bands = ['A', 'B', 'C', 'D'] as const;
    for (const band of bands) {
      const tip = getEconomyTip(band);
      expect(tip).toBeDefined();
      expect(tip.id).toBeTruthy();
      expect(tip.ageBand).toBe(band);
      expect(tip.concept).toBeTruthy();
      expect(tip.body).toBeTruthy();
    }
  });

  it('20-extra. weekIndex로 순환 — 배열 범위 내 반환', () => {
    const bands = ['A', 'B', 'C', 'D'] as const;
    for (const band of bands) {
      const len = ECONOMY_TIPS[band].length;
      // 범위 밖 인덱스도 안전하게 처리
      const tip = getEconomyTip(band, len + 3);
      expect(tip).toBeDefined();
      expect(tip.ageBand).toBe(band);
    }
  });
});
