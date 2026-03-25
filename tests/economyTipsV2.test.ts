// ──────────────────────────────────────────────
// economyTipsV2.test.ts — ECONOMY_TIPS + getEconomyTip 테스트
// ──────────────────────────────────────────────

import { ECONOMY_TIPS, getEconomyTip, EconomyTip } from '../src/engines/review/economyTips';
import { AgeBand } from '../src/engines/review/reportTypes';

const ALL_BANDS: AgeBand[] = ['A', 'B', 'C', 'D'];
const DNA_FORBIDDEN = ['문제', '잘못', '나쁜', '통제', '감시', '훈계'];

describe('ECONOMY_TIPS — 밴드별 팁 개수', () => {
  it('Band A has >= 5 tips', () => {
    expect(ECONOMY_TIPS['A'].length).toBeGreaterThanOrEqual(5);
  });

  it('Band B has >= 5 tips', () => {
    expect(ECONOMY_TIPS['B'].length).toBeGreaterThanOrEqual(5);
  });

  it('Band C has >= 5 tips', () => {
    expect(ECONOMY_TIPS['C'].length).toBeGreaterThanOrEqual(5);
  });

  it('Band D has >= 5 tips', () => {
    expect(ECONOMY_TIPS['D'].length).toBeGreaterThanOrEqual(5);
  });
});

describe('ECONOMY_TIPS — curiosityHook 필드 존재 여부', () => {
  it('All Band A tips have curiosityHook field', () => {
    ECONOMY_TIPS['A'].forEach((tip: EconomyTip) => {
      expect(tip).toHaveProperty('curiosityHook');
    });
  });

  it('All Band B tips have curiosityHook field', () => {
    ECONOMY_TIPS['B'].forEach((tip: EconomyTip) => {
      expect(tip).toHaveProperty('curiosityHook');
    });
  });

  it('All Band C tips have curiosityHook field', () => {
    ECONOMY_TIPS['C'].forEach((tip: EconomyTip) => {
      expect(tip).toHaveProperty('curiosityHook');
    });
  });

  it('All Band D tips have curiosityHook field', () => {
    ECONOMY_TIPS['D'].forEach((tip: EconomyTip) => {
      expect(tip).toHaveProperty('curiosityHook');
    });
  });
});

describe('ECONOMY_TIPS — emoji 필드 존재 여부 (전체 밴드)', () => {
  it('All tips have emoji field', () => {
    ALL_BANDS.forEach((band) => {
      ECONOMY_TIPS[band].forEach((tip: EconomyTip) => {
        expect(tip).toHaveProperty('emoji');
        expect(typeof tip.emoji).toBe('string');
        expect(tip.emoji!.length).toBeGreaterThan(0);
      });
    });
  });
});

describe('ECONOMY_TIPS — concept / body 비어있지 않음', () => {
  it('All tips have non-empty concept and body', () => {
    ALL_BANDS.forEach((band) => {
      ECONOMY_TIPS[band].forEach((tip: EconomyTip) => {
        expect(tip.concept.trim().length).toBeGreaterThan(0);
        expect(tip.body.trim().length).toBeGreaterThan(0);
      });
    });
  });
});

describe('ECONOMY_TIPS — DNA 금지어 검사', () => {
  it('No tip contains DNA-forbidden words (문제, 잘못, 나쁜, 통제, 감시, 훈계)', () => {
    ALL_BANDS.forEach((band) => {
      ECONOMY_TIPS[band].forEach((tip: EconomyTip) => {
        const fullText = [tip.concept, tip.body, tip.curiosityHook ?? ''].join(' ');
        DNA_FORBIDDEN.forEach((word) => {
          expect(fullText).not.toContain(word);
        });
      });
    });
  });
});

describe('getEconomyTip — 팁 선택 함수', () => {
  it('getEconomyTip returns correct tip by index', () => {
    ALL_BANDS.forEach((band) => {
      const tips = ECONOMY_TIPS[band];
      tips.forEach((expected, index) => {
        const result = getEconomyTip(band, index);
        expect(result.id).toBe(expected.id);
      });
    });
  });

  it('getEconomyTip wraps around (modulo)', () => {
    ALL_BANDS.forEach((band) => {
      const tips = ECONOMY_TIPS[band];
      const len = tips.length;

      // index === len should wrap to first tip
      expect(getEconomyTip(band, len).id).toBe(tips[0].id);
      // index === len + 1 should wrap to second tip
      expect(getEconomyTip(band, len + 1).id).toBe(tips[1].id);
      // large index wraps correctly
      expect(getEconomyTip(band, len * 3).id).toBe(tips[0].id);
    });
  });
});

describe('ECONOMY_TIPS — 밴드 내 ID 중복 없음', () => {
  it('Each band has unique tip IDs (no duplicates within band)', () => {
    ALL_BANDS.forEach((band) => {
      const ids = ECONOMY_TIPS[band].map((tip: EconomyTip) => tip.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });
});

describe('ECONOMY_TIPS — Band A 단순 언어 검사', () => {
  it('Band A tips use simple language (no 레버리지 or 재무제표)', () => {
    const complexTerms = ['레버리지', '재무제표'];
    ECONOMY_TIPS['A'].forEach((tip: EconomyTip) => {
      const fullText = [tip.concept, tip.body, tip.curiosityHook ?? ''].join(' ');
      complexTerms.forEach((term) => {
        expect(fullText).not.toContain(term);
      });
    });
  });
});
