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
}));

import {
  buildStatement, saveStatement, getStatement, getStatementHistory,
  compareStatements, buildStatementSummary,
  BuildStatementInput, FamilyStatement,
} from '../src/engines/cashflow/financialStatementService';
import { setDoc } from 'firebase/firestore';

function makeInput(overrides: Partial<BuildStatementInput> = {}): BuildStatementInput {
  return {
    uid: 'user1', period: '2025-03',
    allowanceIncome: 50000, passiveIncome: 5000, otherIncome: 0,
    consumableExpense: 30000, investmentExpense: 10000,
    liabilityExpense: 5000, giveExpense: 2000,
    savingsBalance: 100000, contractBalance: 0, loanBalance: 0,
    ...overrides,
  };
}

describe('financialStatementService', () => {
  test('1. buildStatement: income.total = allowance + passive + other', () => {
    const stmt = buildStatement(makeInput());
    expect(stmt.income.total).toBe(50000 + 5000 + 0);
  });

  test('2. buildStatement: expenses.total = sum of all expense types', () => {
    const stmt = buildStatement(makeInput());
    expect(stmt.expenses.total).toBe(30000 + 10000 + 5000 + 2000);
  });

  test('3. buildStatement: netWorth = assets.total - liabilities.total', () => {
    const stmt = buildStatement(makeInput());
    expect(stmt.netWorth).toBe(stmt.assets.total - stmt.liabilities.total);
  });

  test('4. buildStatement: cashFlow = income.total - expenses.total', () => {
    const stmt = buildStatement(makeInput());
    expect(stmt.cashFlow).toBe(stmt.income.total - stmt.expenses.total);
  });

  test('5. buildStatement: freedomIndex = passiveIncome / totalExpenses (approximately)', () => {
    const input = makeInput();
    const stmt = buildStatement(input);
    const totalExpenses = input.consumableExpense + input.investmentExpense + input.liabilityExpense + input.giveExpense;
    const expected = input.passiveIncome / totalExpenses;
    expect(stmt.freedomIndex).toBeCloseTo(Math.min(expected, 1), 5);
  });

  test('6. buildStatement: freedomIndex capped at 1 when passive > expenses', () => {
    const stmt = buildStatement(makeInput({ passiveIncome: 999999 }));
    expect(stmt.freedomIndex).toBeLessThanOrEqual(1);
  });

  test('7. buildStatement: wealthLevel is a valid WealthLevel string', () => {
    const stmt = buildStatement(makeInput());
    const validLevels = ['seed', 'sprout', 'tree', 'forest', 'millionaire'];
    expect(validLevels).toContain(stmt.wealthLevel);
  });

  test('8. buildStatement: period is preserved', () => {
    const stmt = buildStatement(makeInput({ period: '2025-06' }));
    expect(stmt.period).toBe('2025-06');
  });

  test('9. buildStatement: uid is preserved', () => {
    const stmt = buildStatement(makeInput({ uid: 'user-abc' }));
    expect(stmt.uid).toBe('user-abc');
  });

  test('10. buildStatement with loanBalance=50000: liabilities.loans = 50000, netWorth reduced', () => {
    const stmtWithout = buildStatement(makeInput({ loanBalance: 0 }));
    const stmtWith = buildStatement(makeInput({ loanBalance: 50000 }));
    expect(stmtWith.liabilities.loans).toBe(50000);
    expect(stmtWith.netWorth).toBe(stmtWithout.netWorth - 50000);
  });

  test('11. saveStatement: setDoc is called once', async () => {
    const stmt = buildStatement(makeInput());
    await saveStatement(stmt);
    expect(setDoc).toHaveBeenCalledTimes(1);
  });

  test('12. getStatement: returns null when doc doesn\'t exist', async () => {
    const result = await getStatement('user1', '2025-03');
    expect(result).toBeNull();
  });

  test('13. getStatementHistory: returns empty array when no docs', async () => {
    const result = await getStatementHistory('user1', 12);
    expect(result).toEqual([]);
  });

  test('14. buildStatementSummary: returns non-empty string', () => {
    const stmt = buildStatement(makeInput());
    const summary = buildStatementSummary(stmt);
    expect(typeof summary).toBe('string');
    expect(summary.length).toBeGreaterThan(0);
  });

  test('15. buildStatementSummary: result passes DNA check (no forbidden words)', () => {
    const stmt = buildStatement(makeInput());
    const summary = buildStatementSummary(stmt);
    const forbidden = ['통제', '감시', '훈계'];
    for (const word of forbidden) {
      expect(summary).not.toContain(word);
    }
  });
});
