import {
  classify, getAssetRatioFromItems, suggestReclassification,
  buildAssetSummaryReport, ClassifyInput,
} from '../src/engines/cashflow/assetClassifier';

describe('assetClassifier', () => {
  describe('classify', () => {
    it('classifies savings/fixed as asset', () => {
      expect(classify('savings', 'fixed', 10000)).toBe('asset');
    });

    it('classifies give/give as investment', () => {
      expect(classify('give', 'give', 5000)).toBe('investment');
    });

    it('classifies food/fixed as liability', () => {
      expect(classify('food', 'fixed', 20000)).toBe('liability');
    });

    it('classifies food/living as consumable', () => {
      expect(classify('food', 'living', 15000)).toBe('consumable');
    });

    it('classifies hobby/choice as a valid AssetType', () => {
      const validTypes = ['asset', 'investment', 'consumable', 'liability'];
      const result = classify('hobby', 'choice', 10000);
      expect(validTypes).toContain(result);
    });
  });

  describe('getAssetRatioFromItems', () => {
    it('returns all ratios as 0 for empty array', () => {
      const result = getAssetRatioFromItems([]);
      expect(result.asset).toBe(0);
      expect(result.investment).toBe(0);
      expect(result.consumable).toBe(0);
      expect(result.liability).toBe(0);
    });

    it('returns asset ratio > 0 for a savings item', () => {
      const items: ClassifyInput[] = [
        { categoryId: 'savings', spendType: 'fixed', amount: 10000 },
      ];
      const result = getAssetRatioFromItems(items);
      expect(result.asset).toBeGreaterThan(0);
    });

    it('returns give ratio > 0 for a give item', () => {
      const items: ClassifyInput[] = [
        { categoryId: 'give', spendType: 'give', amount: 5000 },
      ];
      const result = getAssetRatioFromItems(items);
      expect(result.give).toBeGreaterThan(0);
    });

    it('all ratios sum to approximately 1.0', () => {
      const items: ClassifyInput[] = [
        { categoryId: 'savings', spendType: 'fixed', amount: 10000 },
        { categoryId: 'food', spendType: 'living', amount: 15000 },
        { categoryId: 'give', spendType: 'give', amount: 5000 },
      ];
      const result = getAssetRatioFromItems(items);
      const total = result.asset + result.investment + result.consumable + result.liability + result.give;
      expect(total).toBeCloseTo(1.0, 2);
    });
  });

  describe('suggestReclassification', () => {
    it('returns an object or null for hobby/choice item', () => {
      const item: ClassifyInput = { categoryId: 'hobby', spendType: 'choice', amount: 10000 };
      const result = suggestReclassification(item);
      expect(result === null || typeof result === 'object').toBe(true);
    });

    it('returns null for savings item (already asset)', () => {
      const item: ClassifyInput = { categoryId: 'savings', spendType: 'fixed', amount: 10000 };
      const result = suggestReclassification(item);
      expect(result).toBeNull();
    });
  });

  describe('buildAssetSummaryReport', () => {
    const sampleItems: ClassifyInput[] = [
      { categoryId: 'savings', spendType: 'fixed', amount: 20000 },
      { categoryId: 'food', spendType: 'living', amount: 30000 },
      { categoryId: 'give', spendType: 'give', amount: 10000 },
    ];

    it('returns a non-empty summary string', () => {
      const ratio = getAssetRatioFromItems(sampleItems);
      const result = buildAssetSummaryReport(ratio);
      expect(result.summary.length).toBeGreaterThan(0);
    });

    it('summary contains a percent sign', () => {
      const ratio = getAssetRatioFromItems(sampleItems);
      const result = buildAssetSummaryReport(ratio);
      expect(result.summary).toContain('%');
    });

    it('assetPct + consumablePct + givePct <= 100', () => {
      const ratio = getAssetRatioFromItems(sampleItems);
      const result = buildAssetSummaryReport(ratio);
      expect(result.assetPct + result.consumablePct + result.givePct).toBeLessThanOrEqual(100);
    });

    it('assetPct is 0 when all items are zero amount', () => {
      const zeroItems: ClassifyInput[] = [
        { categoryId: 'savings', spendType: 'fixed', amount: 0 },
        { categoryId: 'food', spendType: 'living', amount: 0 },
      ];
      const ratio = getAssetRatioFromItems(zeroItems);
      const result = buildAssetSummaryReport(ratio);
      expect(result.assetPct).toBe(0);
    });
  });
});
