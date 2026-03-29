/**
 * pushTokenService.test.ts
 * FCM 푸시 토큰 서비스 단위 테스트
 */

import {
  requestPermission,
  getToken,
  saveToken,
  deleteToken,
} from '../src/engines/notification/pushTokenService';

// react-native Platform 모킹
jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
}));

// firebase.ts 모킹
jest.mock('../src/lib/firebase', () => ({
  getFirebaseApp: jest.fn(() => ({})),
  getFirebaseAuth: jest.fn(),
  getFirebaseDb: jest.fn(() => ({})),
}));

// firebase/firestore 모킹
const mockSetDoc = jest.fn().mockResolvedValue(undefined);
const mockUpdateDoc = jest.fn().mockResolvedValue(undefined);
const mockGetDoc = jest.fn().mockResolvedValue({
  exists: () => true,
  data: () => ({ fcmToken: null }),
});
const mockDoc = jest.fn(() => ({ id: 'mock-user-ref' }));
const mockDeleteField = jest.fn(() => 'DELETE_SENTINEL');

jest.mock('firebase/firestore', () => ({
  doc: (...args: any[]) => (mockDoc as any)(...args),
  setDoc: (...args: any[]) => (mockSetDoc as any)(...args),
  updateDoc: (...args: any[]) => (mockUpdateDoc as any)(...args),
  getDoc: (...args: any[]) => (mockGetDoc as any)(...args),
  deleteField: () => mockDeleteField(),
}));

// expo-notifications은 jest.config.js moduleNameMapper로 자동 모킹됨
const Notifications = require('expo-notifications');

beforeEach(() => {
  jest.clearAllMocks();
  // 기본값 복원
  Notifications.getPermissionsAsync.mockResolvedValue({ status: 'granted' });
  Notifications.requestPermissionsAsync.mockResolvedValue({ status: 'granted' });
  Notifications.getDevicePushTokenAsync.mockResolvedValue({
    type: 'fcm',
    data: 'mock-fcm-token-test123',
  });
  mockGetDoc.mockResolvedValue({
    exists: () => true,
    data: () => ({ fcmToken: null }),
  });
});

// ──────────────────────────────────────────────
// 1. requestPermission()
// ──────────────────────────────────────────────

describe('requestPermission()', () => {
  it('기존 권한이 granted이면 요청 없이 true 반환', async () => {
    Notifications.getPermissionsAsync.mockResolvedValue({ status: 'granted' });

    const result = await requestPermission();

    expect(result).toBe(true);
    expect(Notifications.requestPermissionsAsync).not.toHaveBeenCalled();
  });

  it('기존 권한이 없을 때 요청 후 granted이면 true 반환', async () => {
    Notifications.getPermissionsAsync.mockResolvedValue({ status: 'undetermined' });
    Notifications.requestPermissionsAsync.mockResolvedValue({ status: 'granted' });

    const result = await requestPermission();

    expect(result).toBe(true);
    expect(Notifications.requestPermissionsAsync).toHaveBeenCalledTimes(1);
  });

  it('권한 요청 후 denied이면 false 반환', async () => {
    Notifications.getPermissionsAsync.mockResolvedValue({ status: 'undetermined' });
    Notifications.requestPermissionsAsync.mockResolvedValue({ status: 'denied' });

    const result = await requestPermission();

    expect(result).toBe(false);
  });
});

// ──────────────────────────────────────────────
// 2. getToken()
// ──────────────────────────────────────────────

describe('getToken()', () => {
  it('권한 있고 토큰 발급 성공 시 토큰 문자열 반환', async () => {
    const token = await getToken();

    expect(token).toBe('mock-fcm-token-test123');
    expect(Notifications.getDevicePushTokenAsync).toHaveBeenCalledTimes(1);
  });

  it('권한 거부 시 null 반환', async () => {
    Notifications.getPermissionsAsync.mockResolvedValue({ status: 'undetermined' });
    Notifications.requestPermissionsAsync.mockResolvedValue({ status: 'denied' });

    const token = await getToken();

    expect(token).toBeNull();
    expect(Notifications.getDevicePushTokenAsync).not.toHaveBeenCalled();
  });

  it('getDevicePushTokenAsync 실패 시 null 반환 (에러 안전)', async () => {
    Notifications.getDevicePushTokenAsync.mockRejectedValueOnce(
      new Error('Device not supported')
    );

    const token = await getToken();

    expect(token).toBeNull();
  });
});

// ──────────────────────────────────────────────
// 3. saveToken()
// ──────────────────────────────────────────────

describe('saveToken()', () => {
  it('기존 토큰이 없을 때 Firestore에 저장한다', async () => {
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ fcmToken: null }),
    });

    await saveToken('uid-001', 'new-fcm-token-xyz');

    expect(mockSetDoc).toHaveBeenCalledTimes(1);
    expect(mockSetDoc).toHaveBeenCalledWith(
      expect.anything(),
      { fcmToken: 'new-fcm-token-xyz' },
      { merge: true }
    );
  });

  it('기존 토큰과 동일하면 Firestore 저장을 스킵한다', async () => {
    const SAME_TOKEN = 'already-saved-token';
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ fcmToken: SAME_TOKEN }),
    });

    await saveToken('uid-001', SAME_TOKEN);

    expect(mockSetDoc).not.toHaveBeenCalled();
  });

  it('기존 토큰과 다르면 새 토큰으로 업데이트한다', async () => {
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ fcmToken: 'old-token' }),
    });

    await saveToken('uid-001', 'new-token');

    expect(mockSetDoc).toHaveBeenCalledTimes(1);
  });
});

// ──────────────────────────────────────────────
// 4. deleteToken()
// ──────────────────────────────────────────────

describe('deleteToken()', () => {
  it('로그아웃 시 Firestore에서 fcmToken 필드를 삭제한다', async () => {
    await deleteToken('uid-001');

    expect(mockUpdateDoc).toHaveBeenCalledTimes(1);
    expect(mockDeleteField).toHaveBeenCalledTimes(1);
    const [, updateArg] = mockUpdateDoc.mock.calls[0];
    expect(updateArg).toHaveProperty('fcmToken');
  });
});
