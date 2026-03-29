/**
 * dailySummaryService.test.ts
 * 일별 지출 요약 + 다중 카테고리 배분 단위 테스트
 */

import {
  toDateString,
  computeDailySummary,
  applyPercentages,
  getTodaySummary,
} from '../src/engines/checkin/dailySummaryService';
import type { CheckIn } from '../src/engines/checkin/checkinStore';

// firebase 모킹
jest.mock('../src/lib/firebase', () => ({
  getFirebaseDb: jest.fn(() => ({})),
}));

// posthog 모킹
jest.mock('../src/engines/monitoring/posthogService', () => ({
  capture: jest.fn(),
}));

// firestore 모킹
const mockGetDocs = jest.fn();
const mockDoc = jest.fn(() => ({ id: 'mock-ref' }));
const mockCollection = jest.fn(() => ({}));

jest.mock('firebase/firestore', () => ({
  doc: (...args: any[]) => (mockDoc as any)(...args),
  collection: (...args: any[]) => (mockCollection as any)(...args),
  getDocs: (...args: any[]) => (mockGetDocs as any)(...args),
  query: jest.fn((ref) => ref),
  orderBy: jest.fn(),
}));

// ── 테스트용 CheckIn 생성 헬퍼 ──

function makeCheckIn(
  overrides: Partial<CheckIn> & { amount: number; spendType: 'fixed' | 'living' | 'choice' }
): CheckIn {
  const today = new Date();
  return {
    checkInId: 'cid-' + Math.random(),
    uid: 'uid-test',
    weekId: '2026-W11',
    categoryId: 'food',
    emotionTag: null,
    createdAt: today.getTime(),
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

// ──────────────────────────────────────────────
// 1. toDateString()
// ──────────────────────────────────────────────

describe('toDateString()', () => {
  it('날짜 → YYYY-MM-DD 형식 반환', () => {
    const d = new Date(2026, 2, 15); // 2026-03-15 (월=2, 0-index)
    expect(toDateString(d)).toBe('2026-03-15');
  });

  it('월/일 한 자리는 0 패딩', () => {
    const d = new Date(2026, 0, 5); // 2026-01-05
    expect(toDateString(d)).toBe('2026-01-05');
  });
});

// ──────────────────────────────────────────────
// 2. computeDailySummary()
// ──────────────────────────────────────────────

describe('computeDailySummary()', () => {
  it('빈 배열이면 0 반환', () => {
    const today = toDateString();
    const result = computeDailySummary([], today);
    expect(result.totalAmount).toBe(0);
    expect(result.choiceAmount).toBe(0);
    expect(result.checkInCount).toBe(0);
  });

  it('오늘 체크인만 집계 (날짜 필터)', () => {
    const today = toDateString();
    const todayMs = new Date().getTime();
    const yesterdayMs = todayMs - 24 * 60 * 60 * 1000;

    const checkIns = [
      makeCheckIn({ amount: 5000, spendType: 'choice', createdAt: todayMs }),
      makeCheckIn({ amount: 3000, spendType: 'living', createdAt: todayMs }),
      makeCheckIn({ amount: 10000, spendType: 'fixed', createdAt: yesterdayMs }), // 어제 → 제외
    ];

    const result = computeDailySummary(checkIns, today);
    expect(result.totalAmount).toBe(8000);
    expect(result.choiceAmount).toBe(5000);
    expect(result.livingAmount).toBe(3000);
    expect(result.fixedAmount).toBe(0);
    expect(result.checkInCount).toBe(2);
  });

  it('choice + living + fixed 각각 집계', () => {
    const today = toDateString();
    const ms = new Date().getTime();

    const checkIns = [
      makeCheckIn({ amount: 2000, spendType: 'choice', createdAt: ms }),
      makeCheckIn({ amount: 3000, spendType: 'choice', createdAt: ms }),
      makeCheckIn({ amount: 5000, spendType: 'living', createdAt: ms }),
      makeCheckIn({ amount: 10000, spendType: 'fixed', createdAt: ms }),
    ];

    const result = computeDailySummary(checkIns, today);
    expect(result.choiceAmount).toBe(5000);
    expect(result.livingAmount).toBe(5000);
    expect(result.fixedAmount).toBe(10000);
    expect(result.totalAmount).toBe(20000);
  });
});

// ──────────────────────────────────────────────
// 3. applyPercentages()
// ──────────────────────────────────────────────

describe('applyPercentages()', () => {
  it('비율에 따라 금액 분배', () => {
    const result = applyPercentages(10000, [
      { categoryId: 'food', percentage: 60, spendType: 'choice' },
      { categoryId: 'transport', percentage: 40, spendType: 'living' },
    ]);
    expect(result).toHaveLength(2);
    expect(result[0].amount).toBe(6000);
    expect(result[1].amount).toBe(4000);
  });

  it('마지막 항목은 나머지 금액 할당 (반올림 오차 보정)', () => {
    const result = applyPercentages(10000, [
      { categoryId: 'food', percentage: 33, spendType: 'choice' },
      { categoryId: 'transport', percentage: 33, spendType: 'living' },
      { categoryId: 'etc', percentage: 34, spendType: 'choice' },
    ]);
    const total = result.reduce((s, r) => s + r.amount, 0);
    expect(total).toBe(10000);
  });

  it('amount=0인 항목은 결과에서 제외', () => {
    const result = applyPercentages(100, [
      { categoryId: 'food', percentage: 100, spendType: 'choice' },
      { categoryId: 'transport', percentage: 0, spendType: 'living' }, // 0% → 제외
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].categoryId).toBe('food');
  });
});

// ──────────────────────────────────────────────
// 4. getTodaySummary() — Firestore 없을 때 기본값
// ──────────────────────────────────────────────

describe('getTodaySummary()', () => {
  it('Firestore 오류 시 빈 요약 반환', async () => {
    mockGetDocs.mockRejectedValueOnce(new Error('network error'));

    const result = await getTodaySummary('uid-001', '2026-W11');
    expect(result.totalAmount).toBe(0);
    expect(result.checkInCount).toBe(0);
  });

  it('기록 없으면 totalAmount=0', async () => {
    mockGetDocs.mockResolvedValueOnce({ docs: [] });

    const result = await getTodaySummary('uid-002', '2026-W11');
    expect(result.totalAmount).toBe(0);
  });
});
