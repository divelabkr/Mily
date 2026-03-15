/**
 * reconcileService.test.ts
 * 월간 정산 서비스 단위 테스트
 */

import {
  computeMonthlyReconcile,
  getPrevMonthId,
  getAdherenceSummary,
  saveMonthlySnapshot,
  getMonthlySnapshot,
} from '../src/engines/review/reconcileService';
import type { CheckIn } from '../src/engines/checkin/checkinStore';
import type { Plan } from '../src/engines/plan/planStore';

// firebase 모킹
jest.mock('../src/lib/firebase', () => ({
  getFirebaseDb: jest.fn(() => ({})),
}));

// posthog 모킹
jest.mock('../src/engines/monitoring/posthogService', () => ({
  capture: jest.fn(),
}));

// firestore 모킹
const mockGetDoc = jest.fn();
const mockSetDoc = jest.fn().mockResolvedValue(undefined);
const mockDoc = jest.fn(() => ({ id: 'mock-ref' }));
const mockServerTimestamp = jest.fn(() => 'SERVER_TS');

jest.mock('firebase/firestore', () => ({
  doc: (...args: unknown[]) => mockDoc(...args),
  getDoc: (...args: unknown[]) => mockGetDoc(...args),
  setDoc: (...args: unknown[]) => mockSetDoc(...args),
  collection: jest.fn(() => ({})),
  getDocs: jest.fn().mockResolvedValue({ docs: [] }),
  serverTimestamp: () => mockServerTimestamp(),
}));

// ── 헬퍼 ──

function makePlan(totalBudget: number): Plan {
  return {
    planId: 'plan-1',
    uid: 'uid-test',
    month: '2026-02',
    totalBudget,
    categories: [
      { categoryId: 'food', percent: 50 },
      { categoryId: 'transport', percent: 30 },
      { categoryId: 'etc', percent: 20 },
    ],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

function makeCheckIn(
  categoryId: string,
  amount: number,
  spendType: 'fixed' | 'living' | 'choice'
): CheckIn {
  return {
    checkInId: 'cid-' + Math.random(),
    uid: 'uid-test',
    weekId: '2026-W09',
    categoryId,
    amount,
    spendType,
    emotionTag: null,
    createdAt: Date.now(),
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

// ──────────────────────────────────────────────
// 1. computeMonthlyReconcile()
// ──────────────────────────────────────────────

describe('computeMonthlyReconcile()', () => {
  it('빈 체크인이면 totalActual=0, adherenceRate=0', () => {
    const plan = makePlan(300000);
    const result = computeMonthlyReconcile([], plan, '2026-02');

    expect(result.totalActual).toBe(0);
    expect(result.adherenceRate).toBe(0);
    expect(result.checkInCount).toBe(0);
  });

  it('계획과 실제 지출 정확히 계산', () => {
    const plan = makePlan(100000);
    const checkIns = [
      makeCheckIn('food', 60000, 'choice'),
      makeCheckIn('transport', 20000, 'living'),
      makeCheckIn('etc', 10000, 'fixed'),
    ];

    const result = computeMonthlyReconcile(checkIns, plan, '2026-02');

    expect(result.totalPlanned).toBe(100000);
    expect(result.totalActual).toBe(90000);
    expect(result.choiceActual).toBe(60000);
    expect(result.adherenceRate).toBeCloseTo(0.9, 2);
    expect(result.checkInCount).toBe(3);
  });

  it('지출 초과 시 adherenceRate > 1', () => {
    const plan = makePlan(50000);
    const checkIns = [
      makeCheckIn('food', 70000, 'choice'),
    ];

    const result = computeMonthlyReconcile(checkIns, plan, '2026-02');
    expect(result.adherenceRate).toBeGreaterThan(1);
  });

  it('카테고리별 실적 집계', () => {
    const plan = makePlan(100000);
    const checkIns = [
      makeCheckIn('food', 30000, 'choice'),
      makeCheckIn('food', 20000, 'choice'),
      makeCheckIn('transport', 15000, 'living'),
    ];

    const result = computeMonthlyReconcile(checkIns, plan, '2026-02');
    const foodCat = result.categories.find((c) => c.categoryId === 'food');
    expect(foodCat?.actual).toBe(50000);
    expect(foodCat?.planned).toBe(50000); // 50% of 100000
  });
});

// ──────────────────────────────────────────────
// 2. getPrevMonthId()
// ──────────────────────────────────────────────

describe('getPrevMonthId()', () => {
  it('3월 → 2월 반환', () => {
    const march = new Date(2026, 2, 15); // 3월 15일
    expect(getPrevMonthId(march)).toBe('2026-02');
  });

  it('1월 → 이전 해 12월 반환', () => {
    const jan = new Date(2026, 0, 5); // 1월 5일
    expect(getPrevMonthId(jan)).toBe('2025-12');
  });
});

// ──────────────────────────────────────────────
// 3. getAdherenceSummary()
// ──────────────────────────────────────────────

describe('getAdherenceSummary()', () => {
  const baseReconcile = {
    monthId: '2026-02',
    totalPlanned: 100000,
    checkInCount: 10,
    categories: [],
    createdAt: Date.now(),
  };

  it('adherenceRate <= 0.8이면 여유 문구', () => {
    const r = { ...baseReconcile, totalActual: 70000, choiceActual: 50000, adherenceRate: 0.7 };
    expect(getAdherenceSummary(r)).toContain('여유');
  });

  it('adherenceRate 0.8~1.0이면 잘 지냈어요 문구', () => {
    const r = { ...baseReconcile, totalActual: 90000, choiceActual: 60000, adherenceRate: 0.9 };
    expect(getAdherenceSummary(r)).toContain('잘');
  });

  it('초과 + choice 적으면 고정비 문구', () => {
    const r = { ...baseReconcile, totalActual: 110000, choiceActual: 5000, adherenceRate: 1.1 };
    const text = getAdherenceSummary(r);
    expect(text).toContain('고정비');
  });

  it('훈계형 표현 없음 (판단형 금지)', () => {
    const r = { ...baseReconcile, totalActual: 120000, choiceActual: 80000, adherenceRate: 1.2 };
    const text = getAdherenceSummary(r);
    expect(text).not.toContain('문제');
    expect(text).not.toContain('낭비');
    expect(text).not.toContain('과소비');
  });
});

// ──────────────────────────────────────────────
// 4. saveMonthlySnapshot() + getMonthlySnapshot()
// ──────────────────────────────────────────────

describe('saveMonthlySnapshot()', () => {
  it('setDoc 호출 확인', async () => {
    const plan = makePlan(100000);
    const reconcile = computeMonthlyReconcile([], plan, '2026-02');
    await saveMonthlySnapshot('uid-001', reconcile);

    expect(mockSetDoc).toHaveBeenCalledTimes(1);
  });
});

describe('getMonthlySnapshot()', () => {
  it('문서 없으면 null 반환', async () => {
    mockGetDoc.mockResolvedValueOnce({ exists: () => false });
    const result = await getMonthlySnapshot('uid-001', '2026-02');
    expect(result).toBeNull();
  });

  it('문서 있으면 데이터 반환', async () => {
    const mockData = { monthId: '2026-02', totalActual: 80000 };
    mockGetDoc.mockResolvedValueOnce({ exists: () => true, data: () => mockData });
    const result = await getMonthlySnapshot('uid-001', '2026-02');
    expect(result?.monthId).toBe('2026-02');
  });
});
