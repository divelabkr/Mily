// ──────────────────────────────────────────────
// trustScore.test.ts — 신뢰 점수 시스템 테스트
// ──────────────────────────────────────────────

jest.mock('../src/lib/firebase', () => ({ getFirebaseDb: jest.fn(() => ({})) }));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(() => ({})),
  getDoc: jest.fn(() => Promise.resolve({ exists: () => false })),
  setDoc: jest.fn(() => Promise.resolve()),
  updateDoc: jest.fn(() => Promise.resolve()),
  arrayUnion: jest.fn((...args) => args),
}));

import {
  getLevel,
  getLoanLimitByScore,
  getLevelInfo,
  getScore,
  addEvent,
  getLoanLimit,
  LEVEL_INFO,
  TrustLevel,
} from '../src/engines/familyBank/trustScoreService';

// ── getLevel ───────────────────────────────────

describe('getLevel', () => {
  test('1. getLevel(0) === 1', () => {
    expect(getLevel(0)).toBe(1);
  });

  test('2. getLevel(49) === 1', () => {
    expect(getLevel(49)).toBe(1);
  });

  test('3. getLevel(50) === 2', () => {
    expect(getLevel(50)).toBe(2);
  });

  test('4. getLevel(99) === 2', () => {
    expect(getLevel(99)).toBe(2);
  });

  test('5. getLevel(100) === 3', () => {
    expect(getLevel(100)).toBe(3);
  });

  test('6. getLevel(200) === 4', () => {
    expect(getLevel(200)).toBe(4);
  });
});

// ── getLoanLimitByScore ────────────────────────

describe('getLoanLimitByScore', () => {
  test('7. getLoanLimitByScore(0) === 10000', () => {
    expect(getLoanLimitByScore(0)).toBe(10000);
  });

  test('8. getLoanLimitByScore(50) === 30000', () => {
    expect(getLoanLimitByScore(50)).toBe(30000);
  });

  test('9. getLoanLimitByScore(100) === 50000', () => {
    expect(getLoanLimitByScore(100)).toBe(50000);
  });

  test('10. getLoanLimitByScore(200) === 100000', () => {
    expect(getLoanLimitByScore(200)).toBe(100000);
  });
});

// ── LEVEL_INFO ─────────────────────────────────

describe('LEVEL_INFO', () => {
  test('11. LEVEL_INFO[1] has label, description, loanLimit, perks', () => {
    const info = LEVEL_INFO[1];
    expect(info).toHaveProperty('label');
    expect(info).toHaveProperty('description');
    expect(info).toHaveProperty('loanLimit');
    expect(info).toHaveProperty('perks');
  });

  test('12. LEVEL_INFO[4].loanLimit === 100000', () => {
    expect(LEVEL_INFO[4].loanLimit).toBe(100000);
  });
});

// ── getLevelInfo ───────────────────────────────

describe('getLevelInfo', () => {
  test('13. getLevelInfo(1).level === 1', () => {
    expect(getLevelInfo(1).level).toBe(1);
  });
});

// ── perks coverage ────────────────────────────

describe('LEVEL_INFO perks', () => {
  test('14. All 4 levels have perks array with at least 1 item', () => {
    const levels: TrustLevel[] = [1, 2, 3, 4];
    for (const level of levels) {
      const info = LEVEL_INFO[level];
      expect(Array.isArray(info.perks)).toBe(true);
      expect(info.perks.length).toBeGreaterThanOrEqual(1);
    }
  });
});

// ── contract_cancelled delta ───────────────────

describe('contract_cancelled event', () => {
  test('15. contract_cancelled event gives 0 delta (no penalty)', async () => {
    const { getDoc, setDoc, updateDoc } = require('firebase/firestore');

    // First call: getScore — doc does not exist, create initial
    getDoc.mockResolvedValueOnce({ exists: () => false });
    // setDoc creates initial score=0
    setDoc.mockResolvedValueOnce(undefined);
    // Second call inside addEvent: getScore again (addEvent calls getScore internally)
    // addEvent calls getScore which calls getDoc again; mock for the updateDoc path
    getDoc.mockResolvedValueOnce({ exists: () => false });
    setDoc.mockResolvedValueOnce(undefined);

    const result = await addEvent('uid-test', 'contract_cancelled');

    // Score should not have increased: delta = 0
    expect(result.score).toBe(0);

    // updateDoc should have been called with score: 0
    expect(updateDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ score: 0 })
    );
  });
});
