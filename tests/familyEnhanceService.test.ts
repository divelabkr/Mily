/**
 * familyEnhanceService.test.ts
 * 부모 2명 + 성년 전환 + 소프트 연결 변경 단위 테스트
 */

import {
  addParent,
  graduateToAdult,
  scheduleDisconnect,
  cancelDisconnect,
  calcAgeAtDate,
  getDaysUntilDisconnect,
} from '../src/engines/family/familyEnhanceService';

// firebase 모킹
jest.mock('../src/lib/firebase', () => ({
  getFirebaseDb: jest.fn(() => ({})),
}));

// posthog 모킹
jest.mock('../src/engines/monitoring/posthogService', () => ({
  capture: jest.fn(),
}));

// store 모킹
jest.mock('../src/engines/family/familyStore', () => ({
  useFamilyStore: {
    getState: jest.fn(() => ({
      family: null,
      setFamily: jest.fn(),
    })),
  },
}));

// firestore 모킹
const mockGetDoc = jest.fn();
const mockUpdateDoc = jest.fn().mockResolvedValue(undefined);
const mockDoc = jest.fn(() => ({ id: 'mock-ref' }));
const mockArrayUnion = jest.fn((...args: any[]) => args);
const mockServerTimestamp = jest.fn(() => 'SERVER_TS');

jest.mock('firebase/firestore', () => ({
  doc: (...args: any[]) => (mockDoc as any)(...args),
  getDoc: (...args: any[]) => (mockGetDoc as any)(...args),
  updateDoc: (...args: any[]) => (mockUpdateDoc as any)(...args),
  arrayUnion: (...args: any[]) => (mockArrayUnion as any)(...args),
  serverTimestamp: () => mockServerTimestamp(),
}));

function makeFamilySnap(data: Record<string, unknown>) {
  return { exists: () => true, data: () => data };
}

function makeUserSnap(data: Record<string, unknown>) {
  return { exists: () => true, data: () => data };
}

beforeEach(() => {
  jest.clearAllMocks();
});

// ──────────────────────────────────────────────
// 1. addParent() — 부모 2명 추가
// ──────────────────────────────────────────────

describe('addParent()', () => {
  it('첫 번째 부모 추가 성공', async () => {
    mockGetDoc.mockResolvedValueOnce(
      makeFamilySnap({ familyId: 'f1', ownerUid: 'parent1', memberUids: ['parent1'] })
    );

    await addParent('f1', 'parent2');

    expect(mockUpdateDoc).toHaveBeenCalledTimes(1);
  });

  it('두 번째 부모 추가 성공 (최대 2명)', async () => {
    mockGetDoc.mockResolvedValueOnce(
      makeFamilySnap({
        familyId: 'f2',
        ownerUid: 'parent1',
        parentUids: ['parent1'],
        memberUids: ['parent1', 'child1'],
      })
    );

    await addParent('f2', 'parent2');

    expect(mockUpdateDoc).toHaveBeenCalledTimes(1);
    const [, updateData] = mockUpdateDoc.mock.calls[0];
    expect(updateData.parentUids).toContain('parent1');
    expect(updateData.parentUids).toContain('parent2');
  });

  it('세 번째 부모 추가 시 오류 발생 (3명 차단)', async () => {
    mockGetDoc.mockResolvedValueOnce(
      makeFamilySnap({
        familyId: 'f3',
        ownerUid: 'parent1',
        parentUids: ['parent1', 'parent2'],
      })
    );

    await expect(addParent('f3', 'parent3')).rejects.toThrow('최대 2명');
  });

  it('이미 존재하는 부모 추가 시 중복 없이 종료', async () => {
    mockGetDoc.mockResolvedValueOnce(
      makeFamilySnap({
        familyId: 'f4',
        ownerUid: 'parent1',
        parentUids: ['parent1'],
      })
    );

    await addParent('f4', 'parent1');

    expect(mockUpdateDoc).not.toHaveBeenCalled();
  });
});

// ──────────────────────────────────────────────
// 2. graduateToAdult() — 성년 전환
// ──────────────────────────────────────────────

describe('graduateToAdult()', () => {
  it('만 18세 이상이면 전환 성공', async () => {
    mockGetDoc.mockResolvedValueOnce(
      makeUserSnap({ role: 'child', graduatedAt: null })
    );

    const now = new Date();
    // 20년 전 생년월일
    await expect(
      graduateToAdult('uid-teen', now.getFullYear() - 20, 1, 1)
    ).resolves.not.toThrow();

    expect(mockUpdateDoc).toHaveBeenCalledTimes(1);
    const [, updateData] = mockUpdateDoc.mock.calls[0];
    expect(updateData.role).toBe('individual');
  });

  it('만 18세 미만이면 오류 발생', async () => {
    const now = new Date();
    // 15년 전 생년월일
    await expect(
      graduateToAdult('uid-minor', now.getFullYear() - 15, 1, 1)
    ).rejects.toThrow('만 18세');
  });

  it('이미 전환된 유저는 중복 처리 없이 종료', async () => {
    mockGetDoc.mockResolvedValueOnce(
      makeUserSnap({ role: 'individual', graduatedAt: 'SERVER_TS' })
    );

    const now = new Date();
    await graduateToAdult('uid-already', now.getFullYear() - 20, 1, 1);

    expect(mockUpdateDoc).not.toHaveBeenCalled();
  });
});

// ──────────────────────────────────────────────
// 3. scheduleDisconnect() — 7일 유예 연결 변경
// ──────────────────────────────────────────────

describe('scheduleDisconnect()', () => {
  it('7일 후 disconnectScheduledAt 설정', async () => {
    const before = Date.now();
    await scheduleDisconnect('fam1', 'uid-requester');

    expect(mockUpdateDoc).toHaveBeenCalledTimes(1);
    const [, updateData] = mockUpdateDoc.mock.calls[0];
    const after = Date.now();

    expect(updateData.disconnectScheduledAt).toBeGreaterThan(
      before + 6 * 24 * 60 * 60 * 1000
    );
    expect(updateData.disconnectScheduledAt).toBeLessThanOrEqual(
      after + 7 * 24 * 60 * 60 * 1000
    );
    expect(updateData.disconnectRequestedBy).toBe('uid-requester');
  });
});

// ──────────────────────────────────────────────
// 4. cancelDisconnect() — 취소
// ──────────────────────────────────────────────

describe('cancelDisconnect()', () => {
  it('disconnectScheduledAt, disconnectRequestedBy 삭제', async () => {
    mockGetDoc.mockResolvedValueOnce(
      makeFamilySnap({
        familyId: 'fam2',
        disconnectScheduledAt: Date.now() + 1000000,
        disconnectRequestedBy: 'uid-req',
      })
    );

    await cancelDisconnect('fam2');

    expect(mockUpdateDoc).toHaveBeenCalledTimes(1);
    const [, updateData] = mockUpdateDoc.mock.calls[0];
    expect(updateData.disconnectScheduledAt).toBeNull();
    expect(updateData.disconnectRequestedBy).toBeNull();
  });
});

// ──────────────────────────────────────────────
// 5. calcAgeAtDate() + getDaysUntilDisconnect()
// ──────────────────────────────────────────────

describe('유틸 함수', () => {
  it('calcAgeAtDate — 정확한 나이 계산', () => {
    const now = new Date();
    const year = now.getFullYear() - 18;
    const month = now.getMonth() + 1;
    const day = now.getDate();
    expect(calcAgeAtDate(year, month, day)).toBe(18);
  });

  it('getDaysUntilDisconnect — 정확한 D-N 계산', () => {
    const future = Date.now() + 5 * 24 * 60 * 60 * 1000;
    const days = getDaysUntilDisconnect(future);
    expect(days).toBeGreaterThanOrEqual(4);
    expect(days).toBeLessThanOrEqual(6);
  });
});
