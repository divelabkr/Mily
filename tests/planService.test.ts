import {
  createDefaultAllocations,
  createNewPlan,
  getWeeklyBudget,
  getCategoryWeeklyLimit,
  normalizeCategoryPercents,
} from '../src/engines/plan/planService';
import { DEFAULT_CATEGORIES } from '../src/engines/plan/defaultCategories';

// Firebase mock
jest.mock('../src/lib/firebase', () => ({
  getFirebaseDb: jest.fn(() => ({})),
  getFirebaseAuth: jest.fn(() => ({})),
}));
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  setDoc: jest.fn(),
  getDoc: jest.fn(),
  collection: jest.fn(),
  getDocs: jest.fn(),
  query: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
}));

describe('planService', () => {
  describe('createDefaultAllocations', () => {
    it('6개 카테고리 생성', () => {
      const allocs = createDefaultAllocations();
      expect(allocs).toHaveLength(DEFAULT_CATEGORIES.length);
    });

    it('합계가 100%', () => {
      const allocs = createDefaultAllocations();
      const total = allocs.reduce((sum, c) => sum + c.percent, 0);
      expect(total).toBe(100);
    });
  });

  describe('createNewPlan', () => {
    it('플랜 생성 시 필드 확인', () => {
      const plan = createNewPlan('uid_test', 500000);
      expect(plan.uid).toBe('uid_test');
      expect(plan.totalBudget).toBe(500000);
      expect(plan.categories).toHaveLength(DEFAULT_CATEGORIES.length);
    });
  });

  describe('getWeeklyBudget', () => {
    it('월간 예산 / 4 반환', () => {
      const plan = createNewPlan('uid', 400000);
      expect(getWeeklyBudget(plan)).toBe(100000);
    });

    it('나머지 반올림 처리', () => {
      const plan = createNewPlan('uid', 300001);
      expect(getWeeklyBudget(plan)).toBe(75000);
    });
  });

  describe('getCategoryWeeklyLimit', () => {
    it('카테고리 한도 계산', () => {
      const plan = createNewPlan('uid', 600000);
      // 기본 배분: 각 카테고리 ~16~17%
      const limit = getCategoryWeeklyLimit(plan, 'food');
      expect(limit).toBeGreaterThan(0);
      expect(limit).toBeLessThanOrEqual(getWeeklyBudget(plan));
    });
  });

  describe('normalizeCategoryPercents', () => {
    it('빈 배열이면 기본값 반환', () => {
      const result = normalizeCategoryPercents([]);
      const total = result.reduce((s, c) => s + c.percent, 0);
      expect(total).toBe(100);
    });

    it('합계를 100으로 정규화', () => {
      const cats = DEFAULT_CATEGORIES.map((c, i) => ({
        categoryId: c.id,
        percent: i % 2 === 0 ? 20 : 10,
      }));
      const normalized = normalizeCategoryPercents(cats);
      const total = normalized.reduce((s, c) => s + c.percent, 0);
      expect(total).toBe(100);
    });
  });
});
