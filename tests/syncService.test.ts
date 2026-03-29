/**
 * syncService.test.ts
 * 기기 동기화 + 신규/기기전환 판별 단위 테스트
 */

import {
  checkAndSync,
  getSyncSummary,
  refreshFcmToken,
} from '../src/engines/backup/syncService';

// firebase 모킹
jest.mock('../src/lib/firebase', () => ({
  getFirebaseDb: jest.fn(() => ({})),
}));

// posthog 모킹
jest.mock('../src/engines/monitoring/posthogService', () => ({
  capture: jest.fn(),
}));

// pushTokenService 모킹
const mockGetToken = jest.fn();
jest.mock('../src/engines/notification/pushTokenService', () => ({
  getToken: (...args: any[]) => (mockGetToken as any)(...args),
}));

// firestore 모킹
const mockGetDoc = jest.fn();
const mockGetDocs = jest.fn();
const mockUpdateDoc = jest.fn().mockResolvedValue(undefined);
const mockSetDoc = jest.fn().mockResolvedValue(undefined);
const mockDoc = jest.fn(() => ({ id: 'mock-ref' }));
const mockCollection = jest.fn(() => ({}));
const mockServerTimestamp = jest.fn(() => 'SERVER_TIMESTAMP');

jest.mock('firebase/firestore', () => ({
  doc: (...args: any[]) => (mockDoc as any)(...args),
  collection: (...args: any[]) => (mockCollection as any)(...args),
  getDoc: (...args: any[]) => (mockGetDoc as any)(...args),
  getDocs: (...args: any[]) => (mockGetDocs as any)(...args),
  updateDoc: (...args: any[]) => (mockUpdateDoc as any)(...args),
  setDoc: (...args: any[]) => (mockSetDoc as any)(...args),
  serverTimestamp: () => mockServerTimestamp(),
}));

function makeUserSnap(data: Record<string, unknown>) {
  return { exists: () => true, data: () => data };
}

function makeEmptySnap() {
  return { exists: () => false };
}

function makeDocsSnap(count: number) {
  return {
    size: count,
    forEach: jest.fn(),
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockGetToken.mockResolvedValue('token-device-A');
  mockGetDocs.mockResolvedValue(makeDocsSnap(5));
});

// ──────────────────────────────────────────────
// 1. checkAndSync() — 신규 유저 판별
// ──────────────────────────────────────────────

describe('checkAndSync() 신규 유저', () => {
  it('firstLoginAt 없으면 isNewDevice=false, recordCount=0 반환', async () => {
    mockGetDoc.mockResolvedValueOnce(
      makeUserSnap({ onboardingCompleted: false })
    );

    const result = await checkAndSync('uid-001');

    expect(result.isNewDevice).toBe(false);
    expect(result.onboardingCompleted).toBe(false);
  });

  it('문서 자체 없으면 기본값 반환', async () => {
    mockGetDoc.mockResolvedValueOnce(makeEmptySnap());

    const result = await checkAndSync('uid-new');

    expect(result.isNewDevice).toBe(false);
    expect(result.recordCount).toBe(0);
  });
});

// ──────────────────────────────────────────────
// 2. checkAndSync() — 기기 전환 판별
// ──────────────────────────────────────────────

describe('checkAndSync() 기기 전환', () => {
  it('lastDeviceToken 다르면 isNewDevice=true', async () => {
    mockGetDoc.mockResolvedValueOnce(
      makeUserSnap({
        firstLoginAt: { toMillis: () => Date.now() - 1000 },
        lastDeviceToken: 'token-device-OLD',
        onboardingCompleted: true,
      })
    );
    mockGetToken.mockResolvedValue('token-device-NEW');

    const result = await checkAndSync('uid-002');

    expect(result.isNewDevice).toBe(true);
    expect(result.onboardingCompleted).toBe(true);
  });

  it('lastDeviceToken 같으면 isNewDevice=false', async () => {
    const SAME_TOKEN = 'same-token-123';
    mockGetDoc.mockResolvedValueOnce(
      makeUserSnap({
        firstLoginAt: { toMillis: () => Date.now() - 1000 },
        lastDeviceToken: SAME_TOKEN,
        onboardingCompleted: true,
      })
    );
    mockGetToken.mockResolvedValue(SAME_TOKEN);

    const result = await checkAndSync('uid-003');

    expect(result.isNewDevice).toBe(false);
  });
});

// ──────────────────────────────────────────────
// 3. onboardingCompleted === false → 온보딩 재표시
// ──────────────────────────────────────────────

describe('checkAndSync() onboarding 상태', () => {
  it('onboardingCompleted=false 이면 false 반환', async () => {
    mockGetDoc.mockResolvedValueOnce(
      makeUserSnap({
        firstLoginAt: { toMillis: () => Date.now() - 1000 },
        lastDeviceToken: 'token-A',
        onboardingCompleted: false,
      })
    );

    const result = await checkAndSync('uid-004');

    expect(result.onboardingCompleted).toBe(false);
  });
});

// ──────────────────────────────────────────────
// 4. getSyncSummary() — 요약 정보
// ──────────────────────────────────────────────

describe('getSyncSummary()', () => {
  it('가족 연결된 유저의 familyLinked=true', async () => {
    mockGetDoc.mockResolvedValueOnce(
      makeUserSnap({
        familyId: 'family_001',
        lastSyncAt: { toDate: () => new Date() },
      })
    );
    mockGetDocs.mockResolvedValueOnce(makeDocsSnap(12));

    const summary = await getSyncSummary('uid-005');

    expect(summary.familyLinked).toBe(true);
    expect(summary.checkInCount).toBe(12);
    expect(summary.lastSyncAt).not.toBeNull();
  });
});

// ──────────────────────────────────────────────
// 5. refreshFcmToken() — 실패 시 fallback
// ──────────────────────────────────────────────

describe('refreshFcmToken()', () => {
  it('토큰 발급 실패 시 에러 없이 종료 (fallback)', async () => {
    mockGetToken.mockRejectedValueOnce(new Error('permission denied'));

    await expect(refreshFcmToken('uid-006')).resolves.not.toThrow();
  });

  it('토큰 없으면 updateDoc 미호출', async () => {
    mockGetToken.mockResolvedValueOnce(null);

    await refreshFcmToken('uid-007');

    expect(mockUpdateDoc).not.toHaveBeenCalled();
  });
});
