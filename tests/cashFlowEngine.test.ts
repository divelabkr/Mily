import {
  getWealthLevel, getWealthEmoji, getWealthLabel,
  classifyAssetType, calcFreedomIndex, getFreedomIndexLabel,
  calculateCashFlowFromData, getPassiveIncomeRatio,
  InflowItem, OutflowItem,
} from '../src/engines/cashflow/cashFlowEngine';

jest.mock('../src/engines/message/dnaFilter', () => ({
  filterDna: jest.fn(() => ({ passed: true, violations: [] })),
}));

describe('cashFlowEngine', () => {
  describe('getWealthLevel', () => {
    it('returns seed for 0', () => {
      expect(getWealthLevel(0)).toBe('seed');
    });

    it('returns seed for 9999', () => {
      expect(getWealthLevel(9999)).toBe('seed');
    });

    it('returns sprout for 10000', () => {
      expect(getWealthLevel(10000)).toBe('sprout');
    });

    it('returns sprout for 49999', () => {
      expect(getWealthLevel(49999)).toBe('sprout');
    });

    it('returns tree for 50000', () => {
      expect(getWealthLevel(50000)).toBe('tree');
    });

    it('returns forest for 200000', () => {
      expect(getWealthLevel(200000)).toBe('forest');
    });

    it('returns millionaire for 500000', () => {
      expect(getWealthLevel(500000)).toBe('millionaire');
    });
  });

  describe('getWealthEmoji', () => {
    it('returns 🌱 for seed', () => {
      expect(getWealthEmoji('seed')).toBe('🌱');
    });

    it('returns 🏆 for millionaire', () => {
      expect(getWealthEmoji('millionaire')).toBe('🏆');
    });
  });

  describe('getWealthLabel', () => {
    it('returns 나무 for tree', () => {
      expect(getWealthLabel('tree')).toBe('나무');
    });
  });

  describe('classifyAssetType', () => {
    it('classifies savings/fixed as asset', () => {
      expect(classifyAssetType('savings', 'fixed')).toBe('asset');
    });

    it('classifies give/give as investment', () => {
      expect(classifyAssetType('give', 'give')).toBe('investment');
    });

    it('classifies food/fixed as liability', () => {
      expect(classifyAssetType('food', 'fixed')).toBe('liability');
    });

    it('classifies food/living as consumable', () => {
      expect(classifyAssetType('food', 'living')).toBe('consumable');
    });
  });

  describe('calcFreedomIndex', () => {
    it('returns 0 when passive income is 0', () => {
      expect(calcFreedomIndex(0, 100)).toBe(0);
    });

    it('returns 1 when passive income equals total expenses', () => {
      expect(calcFreedomIndex(100, 100)).toBe(1);
    });

    it('returns 0.5 when passive income is half of expenses', () => {
      expect(calcFreedomIndex(50, 100)).toBe(0.5);
    });

    it('caps at 1 when passive income exceeds total expenses', () => {
      expect(calcFreedomIndex(200, 100)).toBe(1);
    });
  });

  describe('calculateCashFlowFromData', () => {
    it('correctly sums passive income from inflows', () => {
      const inflows: InflowItem[] = [
        { source: 'allowance', amount: 3000000, isPassive: false },
        { source: 'interest', amount: 50000, isPassive: true },
        { source: 'reward', amount: 200000, isPassive: true },
      ];
      const outflows: OutflowItem[] = [];
      const result = calculateCashFlowFromData('uid1', '2025-03', inflows, outflows);
      expect(result.passiveIncome).toBe(250000);
    });
  });

  describe('getPassiveIncomeRatio', () => {
    it('returns correct passive to total income ratio', () => {
      const inflows: InflowItem[] = [
        { source: 'allowance', amount: 3000000, isPassive: false },
        { source: 'interest', amount: 500000, isPassive: true },
        { source: 'reward', amount: 500000, isPassive: true },
      ];
      const ratio = getPassiveIncomeRatio(inflows);
      expect(ratio).toBeCloseTo(0.25, 5);
    });
  });
});
