// ──────────────────────────────────────────────
// integration.test.ts — 통합 시나리오 테스트
// 엔진 간 연결 흐름 검증
// ──────────────────────────────────────────────

jest.mock('../src/lib/firebase', () => ({ getFirebaseDb: jest.fn(() => ({})) }));
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(() => ({})),
  getDoc: jest.fn(() => Promise.resolve({ exists: () => false })),
  setDoc: jest.fn(() => Promise.resolve()),
  getDocs: jest.fn(() => Promise.resolve({ docs: [] })),
  collection: jest.fn(),
  query: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
}));
jest.mock('../src/engines/message/dnaFilter', () => ({
  filterDna: jest.fn(() => ({ passed: true, violations: [] })),
  assertDnaClean: jest.fn(),
}));

import {
  calculateCashFlowFromData,
  getWealthLevel,
  getWealthEmoji,
  classifyAssetType,
  calcFreedomIndex,
  getPassiveIncomeRatio,
  InflowItem,
  OutflowItem,
} from '../src/engines/cashflow/cashFlowEngine';

import {
  buildStatement,
  buildStatementSummary,
  BuildStatementInput,
} from '../src/engines/cashflow/financialStatementService';

import { classify, getAssetRatioFromItems, ClassifyInput } from '../src/engines/cashflow/assetClassifier';
import { getRoleModels, getRoleModelById } from '../src/engines/millionaire/roleModelService';
import { getDreamScenarios, getDreamById, calculateTimeToAchieve } from '../src/engines/millionaire/dreamScenarioService';
import { LIFE_EVENTS, getMonthlyEvent } from '../src/engines/cashflow/lifeEventService';
import { DEFAULT_FLAGS } from '../src/engines/config/featureFlags';

// ── 시나리오 1: 성인 온보딩 → 체크인 → 캐시플로우 ──

describe('Integration: Adult checkin → cashflow', () => {
  test('1. Inflow → CashFlowData → wealthLevel progression', () => {
    const inflows: InflowItem[] = [
      { source: 'allowance', amount: 50000, isPassive: false },
      { source: 'interest', amount: 5000, isPassive: true },
    ];
    const outflows: OutflowItem[] = [
      { categoryId: 'food', spendType: 'living', amount: 20000, assetType: 'consumable' },
      { categoryId: 'savings', spendType: 'fixed', amount: 10000, assetType: 'asset' },
    ];

    const result = calculateCashFlowFromData('uid1', '2025-03', inflows, outflows);
    expect(result.passiveIncome).toBe(5000);
    expect(result.totalInflow).toBe(55000);
    expect(result.totalOutflow).toBe(30000);
    expect(result.passiveIncomeRatio).toBeCloseTo(5000 / 30000, 5);
    expect(result.netWorthLevel).toBeDefined();
  });

  test('2. CashFlow → FinancialStatement round-trip', () => {
    const input: BuildStatementInput = {
      uid: 'uid1', period: '2025-03',
      allowanceIncome: 50000, passiveIncome: 5000, otherIncome: 0,
      consumableExpense: 20000, investmentExpense: 5000,
      liabilityExpense: 3000, giveExpense: 2000,
      savingsBalance: 80000, contractBalance: 0, loanBalance: 0,
    };
    const stmt = buildStatement(input);
    expect(stmt.income.total).toBe(55000);
    expect(stmt.expenses.total).toBe(30000);
    expect(stmt.cashFlow).toBe(25000);
    expect(stmt.netWorth).toBe(80000);
    expect(stmt.wealthLevel).toBe('tree'); // 80,000 → tree (50K~200K)

    const summary = buildStatementSummary(stmt);
    expect(summary.length).toBeGreaterThan(0);
    expect(summary).toContain('흑자');
  });

  test('3. AssetClassifier → assetRatio consistency', () => {
    const items: ClassifyInput[] = [
      { categoryId: 'savings', spendType: 'fixed', amount: 10000 },
      { categoryId: 'food', spendType: 'living', amount: 15000 },
      { categoryId: 'give', spendType: 'give', amount: 5000 },
      { categoryId: 'hobby', spendType: 'choice', amount: 8000 },
    ];
    const ratio = getAssetRatioFromItems(items);
    const total = ratio.asset + ratio.investment + ratio.consumable + ratio.liability + ratio.give;
    expect(total).toBeCloseTo(1.0, 2);
    expect(ratio.asset).toBeGreaterThan(0);
    expect(ratio.give).toBeGreaterThan(0);
  });
});

// ── 시나리오 2: 밀리어네어 → 꿈 계산기 연결 ──

describe('Integration: Millionaire → Dream calculator', () => {
  test('4. RoleModel band filter works for A band', () => {
    const models = getRoleModels('A', 'child');
    expect(models.length).toBeGreaterThan(0);
    models.forEach((m) => {
      expect(m.ageBands).toContain('A');
    });
  });

  test('5. Dream scenario → calculateTimeToAchieve is finite', () => {
    const dreams = getDreamScenarios('B');
    expect(dreams.length).toBeGreaterThan(0);
    dreams.forEach((d) => {
      const months = calculateTimeToAchieve(d, 10000);
      expect(months).toBeGreaterThan(0);
      expect(isFinite(months)).toBe(true);
    });
  });

  test('6. RoleModel + Dream are available for all bands', () => {
    const bands = ['A', 'B', 'C', 'D'] as const;
    for (const band of bands) {
      const models = getRoleModels(band, 'both');
      const dreams = getDreamScenarios(band);
      expect(models.length).toBeGreaterThan(0);
      expect(dreams.length).toBeGreaterThan(0);
    }
  });

  test('7. Dream DS-01 → months calculation is finite and positive', () => {
    const dream = getDreamById('DS-01');
    expect(dream).toBeDefined();
    const months = calculateTimeToAchieve(dream!, 1000000);
    expect(months).toBeGreaterThan(0);
    expect(isFinite(months)).toBe(true);
    // Compound interest → shorter than simple division
    expect(months).toBeLessThanOrEqual(Math.ceil(dream!.realWorldPrice / 1000000));
  });
});

// ── 시나리오 3: Life events + Feature flags ──

describe('Integration: Life events + feature flags', () => {
  test('8. LIFE_EVENTS covers all 3 types', () => {
    const types = new Set(LIFE_EVENTS.map((e) => e.type));
    expect(types.has('bonus')).toBe(true);
    expect(types.has('challenge')).toBe(true);
    expect(types.has('family_decision')).toBe(true);
  });

  test('9. getMonthlyEvent returns event not in recent list', () => {
    const recent = ['LE-01', 'LE-02'];
    const event = getMonthlyEvent('B', recent);
    expect(event).toBeDefined();
    expect(recent).not.toContain(event!.id);
  });

  test('10. All new feature flags default to false', () => {
    expect(DEFAULT_FLAGS.cashflow_engine_enabled).toBe(false);
    expect(DEFAULT_FLAGS.family_bank_enabled).toBe(false);
    expect(DEFAULT_FLAGS.millionaire_enabled).toBe(false);
    expect(DEFAULT_FLAGS.life_events_enabled).toBe(false);
    expect(DEFAULT_FLAGS.financial_statement_enabled).toBe(false);
  });
});

// ── 시나리오 4: 자유 지수 경로 ──────────────

describe('Integration: Freedom index journey', () => {
  test('11. Zero passive income → freedomIndex 0', () => {
    const fi = calcFreedomIndex(0, 50000);
    expect(fi).toBe(0);
  });

  test('12. Full passive income → freedomIndex 1 (rat race escape)', () => {
    const fi = calcFreedomIndex(50000, 50000);
    expect(fi).toBe(1);
  });

  test('13. WealthLevel progression: seed → sprout → tree → forest → millionaire', () => {
    expect(getWealthLevel(0)).toBe('seed');
    expect(getWealthLevel(10000)).toBe('sprout');
    expect(getWealthLevel(50000)).toBe('tree');
    expect(getWealthLevel(200000)).toBe('forest');
    expect(getWealthLevel(500000)).toBe('millionaire');
  });

  test('14. Each WealthLevel has a unique emoji', () => {
    const emojis = ['seed', 'sprout', 'tree', 'forest', 'millionaire'].map(
      (l) => getWealthEmoji(l as any)
    );
    const uniqueEmojis = new Set(emojis);
    expect(uniqueEmojis.size).toBe(5);
  });

  test('15. PassiveIncomeRatio ranges 0~1', () => {
    const inflows: InflowItem[] = [
      { source: 'allowance', amount: 50000, isPassive: false },
      { source: 'interest', amount: 10000, isPassive: true },
    ];
    const ratio = getPassiveIncomeRatio(inflows);
    expect(ratio).toBeGreaterThanOrEqual(0);
    expect(ratio).toBeLessThanOrEqual(1);
    expect(ratio).toBeCloseTo(10000 / 60000, 5);
  });
});
