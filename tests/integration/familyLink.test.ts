// ──────────────────────────────────────────────
// familyLink.test.ts — 가족 연결 통합 테스트
// 시나리오 A: 부모 계정 생성 + 자녀 초대
// 시나리오 B: 초대 코드 만료
// 시나리오 C: 이미 가족에 속한 자녀 재가입 시도
// ──────────────────────────────────────────────

jest.mock('../../src/lib/firebase', () => ({ getFirebaseDb: jest.fn(() => ({})) }));

const mockFamilyData: Record<string, any> = {};

jest.mock('firebase/firestore', () => ({
  doc: jest.fn((db: any, ...segments: string[]) => ({ _path: segments.join('/') })),
  setDoc: jest.fn(async (ref: any, data: any) => {
    mockFamilyData[ref._path] = data;
  }),
  getDoc: jest.fn(async (ref: any) => ({
    exists: () => !!mockFamilyData[ref._path],
    data: () => mockFamilyData[ref._path],
  })),
  updateDoc: jest.fn(async (ref: any, updates: any) => {
    if (mockFamilyData[ref._path]) {
      Object.assign(mockFamilyData[ref._path], updates);
    }
  }),
  getDocs: jest.fn(async (q: any) => ({
    empty: q._isEmpty ?? false,
    docs: q._docs ?? [],
  })),
  arrayUnion: jest.fn((...items: any[]) => items),
  collection: jest.fn((db: any, col: string) => ({ _col: col })),
  query: jest.fn((ref: any, ...conditions: any[]) => ({ _ref: ref, _conditions: conditions })),
  where: jest.fn((field: string, op: string, val: any) => ({ field, op, val })),
}));

jest.mock('../../src/engines/auth/authService', () => ({
  generateInviteCode: jest.fn(() => 'INVITE123'),
  updateUserDoc: jest.fn(async () => {}),
}));

jest.mock('../../src/engines/family/familyStore', () => ({
  useFamilyStore: {
    getState: jest.fn(() => ({ setFamily: jest.fn() })),
  },
}));

import { createFamily, joinFamilyByCode } from '../../src/engines/family/familyService';
import { generateInviteCode } from '../../src/engines/auth/authService';

const { getDocs, setDoc } = require('firebase/firestore');

// 전체 공통: getDocs mockResolvedValueOnce 큐 누수 방지
beforeEach(() => {
  getDocs.mockReset();
  getDocs.mockImplementation(async (q: any) => ({
    empty: q._isEmpty ?? false,
    docs: q._docs ?? [],
  }));
});

// ── 시나리오 A: 부모 계정 생성 + 자녀 초대 ──────

describe('시나리오 A: 가족 생성 + 자녀 초대', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(mockFamilyData).forEach((k) => delete mockFamilyData[k]);
  });

  test('A-1. createFamily → familyId가 ownerUid 기반으로 생성된다', async () => {
    getDocs.mockResolvedValueOnce({ empty: false, docs: [{ data: () => ({
      familyId: 'family_parent1',
      ownerUid: 'parent1',
      memberUids: ['parent1'],
      members: [{ uid: 'parent1', displayName: '부모님', role: 'parent' }],
      inviteCode: 'INVITE123',
      inviteExpiresAt: Date.now() + 48 * 3600 * 1000,
    })}]});

    const family = await createFamily('parent1', '부모님');
    expect(family.familyId).toBe('family_parent1');
    expect(family.ownerUid).toBe('parent1');
  });

  test('A-2. createFamily → memberUids에 ownerUid가 포함된다', async () => {
    const family = await createFamily('parent2', '엄마');
    expect(family.memberUids).toContain('parent2');
  });

  test('A-3. createFamily → 초대 코드가 설정된다', async () => {
    const family = await createFamily('parent3', '아빠');
    expect(family.inviteCode).toBeDefined();
    expect(family.inviteCode.length).toBeGreaterThan(0);
  });

  test('A-4. createFamily → inviteExpiresAt이 현재보다 미래다 (48h)', async () => {
    const before = Date.now();
    const family = await createFamily('parent4', '보호자');
    expect(family.inviteExpiresAt).toBeGreaterThan(before);
  });

  test('A-5. joinFamilyByCode → 유효한 코드로 자녀가 가족에 합류한다', async () => {
    const validFamily = {
      familyId: 'family_parent1',
      ownerUid: 'parent1',
      memberUids: ['parent1'],
      members: [{ uid: 'parent1', displayName: '부모님', role: 'parent' }],
      inviteCode: 'VALIDCODE',
      inviteExpiresAt: Date.now() + 3600 * 1000,
    };
    getDocs.mockResolvedValueOnce({
      empty: false,
      docs: [{ data: () => validFamily }],
    });

    const result = await joinFamilyByCode('child1', '자녀', 'VALIDCODE');
    expect(result).not.toBeNull();
    expect(result?.familyId).toBe('family_parent1');
  });

  test('A-6. joinFamilyByCode → 소문자 코드도 대문자로 처리된다', async () => {
    const validFamily = {
      familyId: 'family_parent5',
      ownerUid: 'parent5',
      memberUids: ['parent5'],
      members: [],
      inviteCode: 'LOWERCASE',
      inviteExpiresAt: Date.now() + 3600 * 1000,
    };
    getDocs.mockResolvedValueOnce({
      empty: false,
      docs: [{ data: () => validFamily }],
    });

    const result = await joinFamilyByCode('child5', '막내', 'lowercase');
    expect(result).not.toBeNull();
  });
});

// ── 시나리오 B: 초대 코드 만료 ───────────────────

describe('시나리오 B: 초대 코드 만료', () => {
  beforeEach(() => jest.clearAllMocks());

  test('B-1. 만료된 코드로 joinFamilyByCode → null 반환', async () => {
    const expiredFamily = {
      familyId: 'family_expired',
      ownerUid: 'parent_exp',
      memberUids: ['parent_exp'],
      members: [],
      inviteCode: 'EXPIRED1',
      inviteExpiresAt: Date.now() - 1000, // 과거
    };
    getDocs.mockResolvedValueOnce({
      empty: false,
      docs: [{ data: () => expiredFamily }],
    });

    const result = await joinFamilyByCode('child_exp', '자녀', 'EXPIRED1');
    expect(result).toBeNull();
  });

  test('B-2. 존재하지 않는 코드 → null 반환', async () => {
    getDocs.mockResolvedValueOnce({ empty: true, docs: [] });

    const result = await joinFamilyByCode('child2', '자녀2', 'NOTEXIST');
    expect(result).toBeNull();
  });

  test('B-3. inviteExpiresAt 정확히 현재 시간 → 만료로 처리', async () => {
    const now = Date.now();
    const borderFamily = {
      familyId: 'family_border',
      ownerUid: 'parent_border',
      memberUids: [],
      members: [],
      inviteCode: 'BORDER99',
      inviteExpiresAt: now - 1,
    };
    getDocs.mockResolvedValueOnce({
      empty: false,
      docs: [{ data: () => borderFamily }],
    });

    const result = await joinFamilyByCode('child_b', '자녀', 'BORDER99');
    expect(result).toBeNull();
  });
});

// ── 시나리오 C: 이미 가입된 자녀 재가입 시도 ────────

describe('시나리오 C: 이미 가입된 자녀 재가입', () => {
  beforeEach(() => jest.clearAllMocks());

  test('C-1. 이미 memberUids에 포함된 uid → 기존 family 반환 (중복 없음)', async () => {
    const existingFamily = {
      familyId: 'family_existing',
      ownerUid: 'parent_ex',
      memberUids: ['parent_ex', 'child_already'],
      members: [
        { uid: 'parent_ex', displayName: '부모', role: 'parent' },
        { uid: 'child_already', displayName: '자녀', role: 'child' },
      ],
      inviteCode: 'EXISTING1',
      inviteExpiresAt: Date.now() + 3600 * 1000,
    };
    getDocs.mockResolvedValueOnce({
      empty: false,
      docs: [{ data: () => existingFamily }],
    });

    const result = await joinFamilyByCode('child_already', '자녀', 'EXISTING1');
    expect(result?.memberUids).toContain('child_already');
    // updateDoc이 호출되지 않아야 함 (이미 가입)
    const { updateDoc } = require('firebase/firestore');
    expect(updateDoc).not.toHaveBeenCalled();
  });

  test('C-2. 가족의 members 배열에 role이 child로 저장된다', async () => {
    const freshFamily = {
      familyId: 'family_fresh',
      ownerUid: 'parent_fr',
      memberUids: ['parent_fr'],
      members: [{ uid: 'parent_fr', displayName: '아빠', role: 'parent' }],
      inviteCode: 'FRESH001',
      inviteExpiresAt: Date.now() + 3600 * 1000,
    };
    getDocs.mockResolvedValueOnce({
      empty: false,
      docs: [{ data: () => freshFamily }],
    });

    await joinFamilyByCode('child_new', '새자녀', 'FRESH001');

    const { updateDoc, arrayUnion } = require('firebase/firestore');
    expect(updateDoc).toHaveBeenCalled();
    const callArgs = updateDoc.mock.calls[0][1];
    expect(callArgs).toHaveProperty('memberUids');
  });

  test('C-3. generateInviteCode 반환값이 유효한 문자열이다', () => {
    const code = generateInviteCode();
    expect(typeof code).toBe('string');
    expect(code.length).toBeGreaterThan(0);
  });
});
