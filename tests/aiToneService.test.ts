import { buildFallbackReview, buildFallbackBufferedText } from '../src/engines/ai/fallback';
import type { WeeklyReviewInput } from '../src/engines/ai/prompts/weeklyReview';

describe('AI fallback', () => {
  const mockInput: WeeklyReviewInput = {
    categories: [
      { categoryId: 'food', label: '식음료', planned: 30000, actual: 25000 },
      { categoryId: 'hobby', label: '취미', planned: 20000, actual: 35000 },
      { categoryId: 'transport', label: '이동', planned: 10000, actual: 8000 },
    ],
    emotionTags: [],
    totalBudget: 100000,
    totalSpent: 80000,
  };

  describe('buildFallbackReview', () => {
    it('good, leak, suggestion 3줄 반환', () => {
      const result = buildFallbackReview(mockInput);
      expect(result.good).toBeTruthy();
      expect(result.leak).toBeTruthy();
      expect(result.suggestion).toBeTruthy();
    });

    it('금지 표현 포함 안 됨', () => {
      const result = buildFallbackReview(mockInput);
      const allText = result.good + result.leak + result.suggestion;
      expect(allText).not.toMatch(/과소비/);
      expect(allText).not.toMatch(/줄이세요/);
      expect(allText).not.toMatch(/\d+점/);
      expect(allText).not.toMatch(/등급/);
    });

    it('가장 잘 지킨 카테고리를 good에 반영', () => {
      const result = buildFallbackReview(mockInput);
      // food(25000/30000=83%) 또는 transport(8000/10000=80%)이 가장 낮음
      expect(result.good).toMatch(/식음료|이동/);
    });

    it('가장 많이 초과한 카테고리를 leak에 반영', () => {
      const result = buildFallbackReview(mockInput);
      // hobby(35000/20000=175%)가 가장 높음
      expect(result.leak).toContain('취미');
    });
  });

  describe('buildFallbackBufferedText', () => {
    it('원문 그대로 반환', () => {
      const original = '이번 달 취미 예산을 좀 늘려주세요';
      expect(buildFallbackBufferedText(original)).toBe(original);
    });
  });
});
