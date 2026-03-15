/**
 * recurringExpense.test.ts
 * 반복 지출 템플릿 단위 테스트
 * autoRecord=false 항상. spendType=choice 금지. "기록할까요?" 확인 플로우.
 */

import {
  validateRecurringExpense,
  RecurringExpenseValidationError,
  buildConfirmMessage,
  createRecurringExpense,
  loadRecurringExpenses,
  deleteRecurringExpense,
  RecurringExpense,
} from '../src/engines/checkin/recurringExpenseService';

// firebase 모킹
jest.mock('../src/lib/firebase', () => ({
  getFirebaseDb: jest.fn(() => ({})),
}));

const mockAddDoc = jest.fn();
const mockGetDocs = jest.fn(() => Promise.resolve({ docs: [] }));
const mockDeleteDoc = jest.fn(() => Promise.resolve());

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  addDoc: (...args: unknown[]) => mockAddDoc(...args),
  getDoc: jest.fn(),
  getDocs: (...args: unknown[]) => mockGetDocs(...args),
  deleteDoc: (...args: unknown[]) => mockDeleteDoc(...args),
  serverTimestamp: jest.fn(() => ({ _type: 'serverTimestamp' })),
  orderBy: jest.fn(),
  query: jest.fn(),
}));

// checkinService 모킹
jest.mock('../src/engines/checkin/checkinService', () => ({
  saveCheckIn: jest.fn((data: unknown) =>
    Promise.resolve({ ...data as object, checkInId: 'mock-id', createdAt: Date.now() })
  ),
}));

// dateUtils 모킹
jest.mock('../src/utils/dateUtils', () => ({
  getWeekId: jest.fn(() => '2025-W10'),
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockAddDoc.mockResolvedValue({ id: 'template-001' });
  mockGetDocs.mockResolvedValue({ docs: [] });
});

const baseParams = {
  uid: 'user1',
  categoryId: 'transport' as const,
  amount: 55000,
  spendType: 'fixed' as const,
  label: '월 교통카드',
};

function makeTemplate(overrides?: Partial<RecurringExpense>): RecurringExpense {
  return {
    id: 'tpl1',
    uid: 'user1',
    categoryId: 'transport',
    amount: 55000,
    spendType: 'fixed',
    label: '월 교통카드',
    autoRecord: false,
    createdAt: Date.now(),
    ...overrides,
  };
}

// ──────────────────────────────────────────────
// 1. validateRecurringExpense() — spendType=choice 금지
// ──────────────────────────────────────────────

describe('validateRecurringExpense()', () => {
  it('spendType=choice → 오류 발생', () => {
    expect(() =>
      validateRecurringExpense({ ...baseParams, spendType: 'choice' as never })
    ).toThrow(RecurringExpenseValidationError);
  });

  it('spendType=fixed → 통과', () => {
    expect(() =>
      validateRecurringExpense({ ...baseParams, spendType: 'fixed' })
    ).not.toThrow();
  });

  it('spendType=living → 통과', () => {
    expect(() =>
      validateRecurringExpense({ ...baseParams, spendType: 'living' })
    ).not.toThrow();
  });

  it('빈 label → 오류 발생', () => {
    expect(() =>
      validateRecurringExpense({ ...baseParams, label: '' })
    ).toThrow(RecurringExpenseValidationError);
  });

  it('공백 label → 오류 발생', () => {
    expect(() =>
      validateRecurringExpense({ ...baseParams, label: '   ' })
    ).toThrow(RecurringExpenseValidationError);
  });

  it('amount=0 → 오류 발생', () => {
    expect(() =>
      validateRecurringExpense({ ...baseParams, amount: 0 })
    ).toThrow(RecurringExpenseValidationError);
  });

  it('choice 오류 메시지에 안내 문구 포함', () => {
    try {
      validateRecurringExpense({ ...baseParams, spendType: 'choice' as never });
    } catch (e) {
      expect((e as Error).message).toContain('고정비 또는 생활비');
    }
  });
});

// ──────────────────────────────────────────────
// 2. autoRecord 항상 false
// ──────────────────────────────────────────────

describe('autoRecord', () => {
  it('생성된 템플릿의 autoRecord는 항상 false', async () => {
    const template = await createRecurringExpense(baseParams);
    expect(template.autoRecord).toBe(false);
  });

  it('makeTemplate의 autoRecord=false', () => {
    const t = makeTemplate();
    expect(t.autoRecord).toBe(false);
  });
});

// ──────────────────────────────────────────────
// 3. buildConfirmMessage()
// ──────────────────────────────────────────────

describe('buildConfirmMessage()', () => {
  it('템플릿 이름 포함', () => {
    const msg = buildConfirmMessage(makeTemplate());
    expect(msg).toContain('월 교통카드');
  });

  it('금액 포함', () => {
    const msg = buildConfirmMessage(makeTemplate({ amount: 55000 }));
    expect(msg).toContain('55,000');
  });

  it('"이번 주" 또는 "기록" 키워드 포함', () => {
    const msg = buildConfirmMessage(makeTemplate());
    expect(msg).toMatch(/이번 주|기록/);
  });

  it('비어있지 않음', () => {
    const msg = buildConfirmMessage(makeTemplate());
    expect(msg.length).toBeGreaterThan(0);
  });
});

// ──────────────────────────────────────────────
// 4. createRecurringExpense()
// ──────────────────────────────────────────────

describe('createRecurringExpense()', () => {
  it('유효한 파라미터로 생성 성공', async () => {
    const result = await createRecurringExpense(baseParams);
    expect(result.id).toBe('template-001');
    expect(result.autoRecord).toBe(false);
  });

  it('spendType=choice로 생성 시도 → 오류', async () => {
    await expect(
      createRecurringExpense({ ...baseParams, spendType: 'choice' as never })
    ).rejects.toThrow(RecurringExpenseValidationError);
  });
});

// ──────────────────────────────────────────────
// 5. loadRecurringExpenses()
// ──────────────────────────────────────────────

describe('loadRecurringExpenses()', () => {
  it('빈 목록 반환', async () => {
    const results = await loadRecurringExpenses('user1');
    expect(Array.isArray(results)).toBe(true);
    expect(results).toHaveLength(0);
  });

  it('Firestore 오류 → 빈 배열 반환 (graceful fallback)', async () => {
    mockGetDocs.mockRejectedValueOnce(new Error('Firestore error'));
    const results = await loadRecurringExpenses('user1');
    expect(Array.isArray(results)).toBe(true);
  });
});

// ──────────────────────────────────────────────
// 6. deleteRecurringExpense()
// ──────────────────────────────────────────────

describe('deleteRecurringExpense()', () => {
  it('정상 삭제 → 예외 없음', async () => {
    await expect(deleteRecurringExpense('user1', 'tpl1')).resolves.toBeUndefined();
    expect(mockDeleteDoc).toHaveBeenCalledTimes(1);
  });
});
