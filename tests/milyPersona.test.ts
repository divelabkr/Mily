import {
  getMilySystemPrompt,
  getAgeBand,
  MILY_SYSTEM_PROMPTS,
  AGE_BAND_RANGES,
} from '../src/engines/message/milyPersona';
import type { AgeBand } from '../src/engines/message/milyPersona';

describe('milyPersona', () => {
  describe('getMilySystemPrompt — 밴드별 프롬프트 반환', () => {
    const bands: AgeBand[] = ['A', 'B', 'C', 'D'];

    test.each(bands)('Band %s 프롬프트 반환', (band) => {
      const prompt = getMilySystemPrompt(band);
      expect(typeof prompt).toBe('string');
      expect(prompt.length).toBeGreaterThan(50);
    });

    it('Band A — 이모지 2~3개 규칙 언급', () => {
      const prompt = getMilySystemPrompt('A');
      expect(prompt).toMatch(/이모지 2~3개/);
    });

    it('Band B — 트렌디 규칙 언급', () => {
      const prompt = getMilySystemPrompt('B');
      expect(prompt).toMatch(/트렌디/);
    });

    it('Band C — 급식체 허용 언급', () => {
      const prompt = getMilySystemPrompt('C');
      expect(prompt).toMatch(/급식체/);
    });

    it('Band D — 인정형 언급', () => {
      const prompt = getMilySystemPrompt('D');
      expect(prompt).toMatch(/인정/);
    });
  });

  describe('공통 금지 규칙 — 모든 밴드에 포함', () => {
    const bands: AgeBand[] = ['A', 'B', 'C', 'D'];

    test.each(bands)('Band %s — "절대 금지 (위반 시 응답 무효)" 포함', (band) => {
      expect(getMilySystemPrompt(band)).toMatch(/절대 금지 \(위반 시 응답 무효\)/);
    });

    test.each(bands)('Band %s — 출력 형식 JSON 명시', (band) => {
      expect(getMilySystemPrompt(band)).toMatch(/message.*emoji/);
    });

    test.each(bands)('Band %s — 성향 진단형 금지 언급', (band) => {
      expect(getMilySystemPrompt(band)).toMatch(/성향 진단형/);
    });
  });

  describe('getAgeBand — 나이 → 밴드 변환', () => {
    it('7세 → Band A', () => expect(getAgeBand(7)).toBe('A'));
    it('9세 → Band A', () => expect(getAgeBand(9)).toBe('A'));
    it('10세 → Band B', () => expect(getAgeBand(10)).toBe('B'));
    it('12세 → Band B', () => expect(getAgeBand(12)).toBe('B'));
    it('13세 → Band C', () => expect(getAgeBand(13)).toBe('C'));
    it('15세 → Band C', () => expect(getAgeBand(15)).toBe('C'));
    it('16세 → Band D', () => expect(getAgeBand(16)).toBe('D'));
    it('18세 → Band D', () => expect(getAgeBand(18)).toBe('D'));
    it('30세 → Band D (성인 기본값)', () => expect(getAgeBand(30)).toBe('D'));
  });

  describe('AGE_BAND_RANGES — 범위 정합성', () => {
    it('A 밴드 7~9', () => {
      expect(AGE_BAND_RANGES.A).toEqual({ min: 7, max: 9 });
    });
    it('D 밴드 16~18', () => {
      expect(AGE_BAND_RANGES.D).toEqual({ min: 16, max: 18 });
    });
    it('4개 밴드 정의', () => {
      expect(Object.keys(MILY_SYSTEM_PROMPTS)).toHaveLength(4);
    });
  });
});
