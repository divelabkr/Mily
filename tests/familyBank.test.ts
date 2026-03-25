// ──────────────────────────────────────────────
// familyBank.test.ts — 패밀리뱅크 계약 시스템 테스트
// ──────────────────────────────────────────────

jest.mock('../src/lib/firebase', () => ({ getFirebaseDb: jest.fn(() => ({})) }));

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  doc: jest.fn(() => ({})),
  getDoc: jest.fn(),
  getDocs: jest.fn(() => Promise.resolve({ docs: [] })),
  setDoc: jest.fn(() => Promise.resolve()),
  updateDoc: jest.fn(() => Promise.resolve()),
  query: jest.fn(),
  where: jest.fn(),
  Timestamp: {
    fromMillis: jest.fn((ms: number) => ({ seconds: Math.floor(ms / 1000), nanoseconds: 0 })),
    now: jest.fn(() => ({ seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 })),
  },
}));

import { getDoc, setDoc, updateDoc, getDocs } from 'firebase/firestore';
const mockGetDoc = getDoc as jest.Mock;
const mockSetDoc = setDoc as jest.Mock;
const mockUpdateDoc = updateDoc as jest.Mock;
const mockGetDocs = getDocs as jest.Mock;

import {
  generateHashCode,
  createContract,
  signContract,
  recordRepayment,
  getActiveContracts,
  cancelContract,
  CreateContractInput,
  ContractType,
  RepaymentType,
  ContractStatus,
} from '../src/engines/familyBank/familyBankService';

const baseInput: CreateContractInput = {
  familyId: 'fam-001',
  type: 'loan',
  fromUid: 'uid-parent',
  toUid: 'uid-child',
  title: '자전거 구매 대출',
  amount: 50000,
  repaymentType: 'monthly',
  repaymentAmount: 5000,
  totalMonths: 10,
};

beforeEach(() => {
  jest.clearAllMocks();
  mockGetDoc.mockResolvedValue({ exists: () => false });
});

// ── generateHashCode ───────────────────────────

describe('generateHashCode', () => {
  test('1. returns a string starting with FC-', () => {
    const result = generateHashCode('uid1', 'fam1', 10000, Date.now());
    expect(result).toMatch(/^FC-/);
  });

  test('2. same inputs produce same hash', () => {
    const ts = 1700000000000;
    const a = generateHashCode('uid1', 'fam1', 10000, ts);
    const b = generateHashCode('uid1', 'fam1', 10000, ts);
    expect(a).toBe(b);
  });

  test('3. different amounts produce different hashes', () => {
    const ts = 1700000000000;
    const a = generateHashCode('uid1', 'fam1', 10000, ts);
    const b = generateHashCode('uid1', 'fam1', 99999, ts);
    expect(a).not.toBe(b);
  });

  test('4. different uids produce different hashes', () => {
    const ts = 1700000000000;
    const a = generateHashCode('uid-A', 'fam1', 10000, ts);
    const b = generateHashCode('uid-B', 'fam1', 10000, ts);
    expect(a).not.toBe(b);
  });

  test('5. result length > 10', () => {
    const result = generateHashCode('uid1', 'fam1', 10000, Date.now());
    expect(result.length).toBeGreaterThan(10);
  });
});

// ── createContract ─────────────────────────────

describe('createContract', () => {
  test('6. setDoc called once', async () => {
    await createContract(baseInput);
    expect(mockSetDoc).toHaveBeenCalledTimes(1);
  });

  test('7. returned contract has correct familyId', async () => {
    const contract = await createContract(baseInput);
    expect(contract.familyId).toBe('fam-001');
  });

  test('8. returned contract status is pending', async () => {
    const contract = await createContract(baseInput);
    expect(contract.status).toBe('pending');
  });

  test('9. returned contract has hashCode', async () => {
    const contract = await createContract(baseInput);
    expect(contract.hashCode).toBeDefined();
    expect(typeof contract.hashCode).toBe('string');
    expect(contract.hashCode.length).toBeGreaterThan(0);
  });

  test('10. interestRate defaults to 0 when not provided', async () => {
    const input: CreateContractInput = { ...baseInput };
    delete (input as any).interestRate;
    const contract = await createContract(input);
    expect(contract.interestRate).toBe(0);
  });

  test('19. createContract with type loan creates loan contract', async () => {
    const contract = await createContract({ ...baseInput, type: 'loan' });
    expect(contract.type).toBe('loan');
  });

  test('20. createContract: repayments starts as empty array', async () => {
    const contract = await createContract(baseInput);
    expect(contract.repayments).toEqual([]);
  });
});

// ── signContract ───────────────────────────────

describe('signContract', () => {
  test('11. signContract: throws when getDoc returns non-existent doc', async () => {
    mockGetDoc.mockResolvedValue({ exists: () => false });
    await expect(signContract('contract-123', 'uid-parent')).rejects.toThrow();
  });

  test('12. signContract: calls updateDoc with status active', async () => {
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ status: 'pending', toUid: 'uid1', fromUid: 'uid2' }),
    });
    await signContract('contract-123', 'uid1');
    expect(mockUpdateDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ status: 'active' })
    );
  });
});

// ── recordRepayment ────────────────────────────

describe('recordRepayment', () => {
  test('13. recordRepayment: throws when getDoc returns non-existent doc', async () => {
    mockGetDoc.mockResolvedValue({ exists: () => false });
    await expect(recordRepayment('contract-123', 1)).rejects.toThrow();
  });
});

// ── getActiveContracts ─────────────────────────

describe('getActiveContracts', () => {
  test('14. getActiveContracts: returns empty array when no docs', async () => {
    mockGetDocs.mockResolvedValue({ docs: [] });
    const result = await getActiveContracts('fam-001');
    expect(result).toEqual([]);
  });
});

// ── cancelContract ─────────────────────────────

describe('cancelContract', () => {
  test('15. cancelContract: throws when doc does not exist', async () => {
    mockGetDoc.mockResolvedValue({ exists: () => false });
    await expect(cancelContract('contract-123')).rejects.toThrow();
  });
});

// ── 타입 열거형 ──────────────────────────────────

describe('type enums', () => {
  test('16. ContractType enum: loan | interest | chore_reward all valid', () => {
    const types: ContractType[] = ['loan', 'interest', 'chore_reward'];
    expect(types).toHaveLength(3);
    expect(types).toContain('loan');
    expect(types).toContain('interest');
    expect(types).toContain('chore_reward');
  });

  test('17. RepaymentType enum: monthly | lumpsum | chore all valid', () => {
    const types: RepaymentType[] = ['monthly', 'lumpsum', 'chore'];
    expect(types).toHaveLength(3);
    expect(types).toContain('monthly');
    expect(types).toContain('lumpsum');
    expect(types).toContain('chore');
  });

  test('18. ContractStatus: pending | active | completed | cancelled all valid', () => {
    const statuses: ContractStatus[] = ['pending', 'active', 'completed', 'cancelled'];
    expect(statuses).toHaveLength(4);
    expect(statuses).toContain('pending');
    expect(statuses).toContain('active');
    expect(statuses).toContain('completed');
    expect(statuses).toContain('cancelled');
  });
});
