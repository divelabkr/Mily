// ──────────────────────────────────────────────
// checkIn.integration.test.ts — 체크인 통합 테스트
// ──────────────────────────────────────────────

jest.mock('../../../src/lib/firebase', () => ({ getFirebaseDb: jest.fn(() => ({})) }));
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(() => ({ _col: 'checkins' })),
  doc: jest.fn(() => ({ id: 'mock_doc_id', _path: 'checkins/mock_doc_id' })),
  setDoc: jest.fn(() => Promise.resolve()),
  getDoc: jest.fn(() => Promise.resolve({ exists: () => false, data: () => null })),
  getDocs: jest.fn(() => Promise.resolve({ docs: [] })),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  Timestamp: { now: jest.fn(() => ({ toMillis: () => Date.now() })) },
}));
jest.mock('../../../src/engines/message/dnaFilter', () => ({
  filterDna: jest.fn(() => ({ passed: true, violations: [] })),
  assertDnaClean: jest.fn(),
}));

import { calculateBoundary } from '../../../src/engines/checkin/planBoundary';
import {
  getWeeklySpendBreakdown,
  getWeeklyChoiceTotal,
  getWeeklyTotalBySpendType,
  CheckIn,
} from '../../../src/engines/checkin/checkinStore';

function makeCheckIn(overrides: Partial<CheckIn> = {}): CheckIn {
  return {
    checkInId: `ci_${Math.random()}`,
    uid: 'uid_test',
    weekId: '2026-W12',
    categoryId: 'food',
    amount: 10000,
    spendType: 'choice',
    createdAt: Date.now(),
    ...overrides,
  };
}

describe('CheckIn Integration: 경계 계산 + 지출유형 분리', () => {
  test('1. fixed 지출은 항상 within 경계', () => {
    const boundary = calculateBoundary(50000, 30000, 'fixed');
    expect(boundary).toBe('within');
  });

  test('2. choice 지출 80% 이하 → within', () => {
    const boundary = calculateBoundary(8000, 10000, 'choice');
    expect(boundary).toBe('within');
  });

  test('3. choice 지출 80~120% → similar', () => {
    const boundary = calculateBoundary(10000, 10000, 'choice');
    expect(boundary).toBe('similar');
  });

  test('4. choice 지출 120% 초과 → outside', () => {
    const boundary = calculateBoundary(15000, 10000, 'choice');
    expect(boundary).toBe('outside');
  });

  test('5. living 지출 100% 이하 → within', () => {
    const boundary = calculateBoundary(9000, 10000, 'living');
    expect(boundary).toBe('within');
  });

  test('6. living 지출 100~150% → similar', () => {
    const boundary = calculateBoundary(12000, 10000, 'living');
    expect(boundary).toBe('similar');
  });

  test('7. weeklyLimit === 0 → outside', () => {
    const boundary = calculateBoundary(5000, 0, 'choice');
    expect(boundary).toBe('outside');
  });

  test('8. 주간 지출 breakdown — fixed/living/choice 분리', () => {
    const checkins: CheckIn[] = [
      makeCheckIn({ spendType: 'fixed', amount: 5000 }),
      makeCheckIn({ spendType: 'living', amount: 8000 }),
      makeCheckIn({ spendType: 'choice', amount: 12000 }),
      makeCheckIn({ spendType: 'choice', amount: 3000 }),
    ];
    const breakdown = getWeeklySpendBreakdown(checkins);
    expect(breakdown.fixed).toBe(5000);
    expect(breakdown.living).toBe(8000);
    expect(breakdown.choice).toBe(15000);
  });

  test('9. getWeeklyChoiceTotal — choice만 합산', () => {
    const checkins: CheckIn[] = [
      makeCheckIn({ spendType: 'fixed', amount: 10000 }),
      makeCheckIn({ spendType: 'choice', amount: 7000 }),
    ];
    const total = getWeeklyChoiceTotal(checkins);
    expect(total).toBe(7000);
  });

  test('10. getWeeklyTotalBySpendType — 타입별 합계 일치', () => {
    const checkins: CheckIn[] = [
      makeCheckIn({ spendType: 'fixed', amount: 20000 }),
      makeCheckIn({ spendType: 'fixed', amount: 30000 }),
      makeCheckIn({ spendType: 'living', amount: 10000 }),
    ];
    const result = getWeeklyTotalBySpendType(checkins);
    expect(result.fixed).toBe(50000);
    expect(result.living).toBe(10000);
    expect(result.choice).toBe(0);
  });
});
