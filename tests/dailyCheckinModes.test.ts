/**
 * dailyCheckinModes.test.ts
 * 체크인 모드 (quick / standard / detailed) 단위 테스트
 */

import {
  CheckInMode,
  CHECKIN_MODE_OPTIONS,
  getRemoteDefaultMode,
  getFieldsForMode,
  loadCheckInMode,
  saveCheckInMode,
} from '../src/engines/checkin/checkinModeService';

// AsyncStorage 모킹
const store: Record<string, string> = {};
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn((key: string) => Promise.resolve(store[key] ?? null)),
  setItem: jest.fn((key: string, value: string) => {
    store[key] = value;
    return Promise.resolve();
  }),
}));

// remoteConfigService 모킹
const mockGetString = jest.fn(() => 'standard');
jest.mock('../src/engines/config/remoteConfigService', () => ({
  getString: (key: string) => mockGetString(key),
}));

beforeEach(() => {
  jest.clearAllMocks();
  Object.keys(store).forEach((k) => delete store[k]);
  mockGetString.mockReturnValue('standard');
});

// ──────────────────────────────────────────────
// 1. CHECKIN_MODE_OPTIONS 구조
// ──────────────────────────────────────────────

describe('CHECKIN_MODE_OPTIONS', () => {
  it('3개 모드 옵션', () => {
    expect(CHECKIN_MODE_OPTIONS).toHaveLength(3);
  });

  it('quick / standard / detailed 순서', () => {
    expect(CHECKIN_MODE_OPTIONS[0].mode).toBe('quick');
    expect(CHECKIN_MODE_OPTIONS[1].mode).toBe('standard');
    expect(CHECKIN_MODE_OPTIONS[2].mode).toBe('detailed');
  });

  it('모든 옵션에 label과 desc 있음', () => {
    for (const opt of CHECKIN_MODE_OPTIONS) {
      expect(opt.label.length).toBeGreaterThan(0);
      expect(opt.desc.length).toBeGreaterThan(0);
    }
  });
});

// ──────────────────────────────────────────────
// 2. getRemoteDefaultMode()
// ──────────────────────────────────────────────

describe('getRemoteDefaultMode()', () => {
  it('Remote Config 값 standard → standard 반환', () => {
    mockGetString.mockReturnValue('standard');
    expect(getRemoteDefaultMode()).toBe('standard');
  });

  it('Remote Config 값 quick → quick 반환', () => {
    mockGetString.mockReturnValue('quick');
    expect(getRemoteDefaultMode()).toBe('quick');
  });

  it('Remote Config 값 detailed → detailed 반환', () => {
    mockGetString.mockReturnValue('detailed');
    expect(getRemoteDefaultMode()).toBe('detailed');
  });

  it('Remote Config 잘못된 값 → standard 폴백', () => {
    mockGetString.mockReturnValue('invalid_mode');
    expect(getRemoteDefaultMode()).toBe('standard');
  });

  it('Remote Config 빈 값 → standard 폴백', () => {
    mockGetString.mockReturnValue('');
    expect(getRemoteDefaultMode()).toBe('standard');
  });
});

// ──────────────────────────────────────────────
// 3. getFieldsForMode()
// ──────────────────────────────────────────────

describe('getFieldsForMode()', () => {
  it('quick: 지출유형/감정/메모 모두 숨김', () => {
    const fields = getFieldsForMode('quick');
    expect(fields.showSpendType).toBe(false);
    expect(fields.showEmotion).toBe(false);
    expect(fields.showMemo).toBe(false);
  });

  it('standard: 지출유형만 표시, 감정/메모 숨김', () => {
    const fields = getFieldsForMode('standard');
    expect(fields.showSpendType).toBe(true);
    expect(fields.showEmotion).toBe(false);
    expect(fields.showMemo).toBe(false);
  });

  it('detailed: 지출유형/감정/메모 모두 표시', () => {
    const fields = getFieldsForMode('detailed');
    expect(fields.showSpendType).toBe(true);
    expect(fields.showEmotion).toBe(true);
    expect(fields.showMemo).toBe(true);
  });
});

// ──────────────────────────────────────────────
// 4. saveCheckInMode() + loadCheckInMode()
// ──────────────────────────────────────────────

describe('saveCheckInMode() + loadCheckInMode()', () => {
  it('저장 후 로드 → 동일 모드 반환', async () => {
    await saveCheckInMode('quick');
    const loaded = await loadCheckInMode();
    expect(loaded).toBe('quick');
  });

  it('detailed 저장 후 로드', async () => {
    await saveCheckInMode('detailed');
    const loaded = await loadCheckInMode();
    expect(loaded).toBe('detailed');
  });

  it('저장 없으면 Remote Config 기본값 사용', async () => {
    mockGetString.mockReturnValue('quick');
    const loaded = await loadCheckInMode();
    expect(loaded).toBe('quick');
  });

  it('AsyncStorage에 잘못된 값 있으면 Remote Config 폴백', async () => {
    const AsyncStorage = require('@react-native-async-storage/async-storage');
    AsyncStorage.getItem.mockResolvedValueOnce('garbage_value');
    mockGetString.mockReturnValue('standard');
    const loaded = await loadCheckInMode();
    expect(loaded).toBe('standard');
  });
});
