import { filterCheckInsByPlan, isWeekLocked } from '../src/engines/billing/timeLock';
import { getWeekId } from '../src/utils/dateUtils';

// billingService mock
jest.mock('../src/engines/billing/billingService', () => ({
  isPaidPlan: jest.fn(),
  getCurrentPlanId: jest.fn(),
}));

const { isPaidPlan } = require('../src/engines/billing/billingService');

const mockCheckIns = [
  { checkInId: '1', uid: 'u', weekId: getWeekId(), categoryId: 'food' as const, amount: 1000, createdAt: Date.now() },
  { checkInId: '2', uid: 'u', weekId: '2026-W01', categoryId: 'food' as const, amount: 2000, createdAt: Date.now() },
  { checkInId: '3', uid: 'u', weekId: '2025-W50', categoryId: 'hobby' as const, amount: 3000, createdAt: Date.now() },
];

describe('timeLock', () => {
  describe('filterCheckInsByPlan', () => {
    it('Free: 현재 주 기록만 반환', () => {
      isPaidPlan.mockReturnValue(false);
      const result = filterCheckInsByPlan(mockCheckIns);
      expect(result).toHaveLength(1);
      expect(result[0].weekId).toBe(getWeekId());
    });

    it('Paid: 전체 기록 반환', () => {
      isPaidPlan.mockReturnValue(true);
      const result = filterCheckInsByPlan(mockCheckIns);
      expect(result).toHaveLength(3);
    });
  });

  describe('isWeekLocked', () => {
    it('Free 유저 — 현재 주는 잠금 안 됨', () => {
      isPaidPlan.mockReturnValue(false);
      expect(isWeekLocked(getWeekId())).toBe(false);
    });

    it('Free 유저 — 과거 주는 잠금', () => {
      isPaidPlan.mockReturnValue(false);
      expect(isWeekLocked('2026-W01')).toBe(true);
    });

    it('Paid 유저 — 과거 주도 잠금 안 됨', () => {
      isPaidPlan.mockReturnValue(true);
      expect(isWeekLocked('2026-W01')).toBe(false);
    });
  });
});
