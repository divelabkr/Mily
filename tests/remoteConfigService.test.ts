/**
 * remoteConfigService.test.ts
 * Firebase Remote Config + Feature Flag 단위 테스트
 */

import { getBoolean, fetchAndActivate } from 'firebase/remote-config';
import {
  getFlag,
  getString,
  init,
  _resetForTest,
} from '../src/engines/config/remoteConfigService';
import { FeatureFlags, DEFAULT_FLAGS } from '../src/engines/config/featureFlags';
import { useConfigStore } from '../src/engines/config/configStore';

const mockGetBoolean = getBoolean as jest.Mock;
const mockFetchAndActivate = fetchAndActivate as jest.Mock;

// firebase.ts 모킹 (getFirebaseApp 노출)
jest.mock('../src/lib/firebase', () => ({
  getFirebaseApp: jest.fn(() => ({})),
  getFirebaseAuth: jest.fn(),
  getFirebaseDb: jest.fn(),
}));

beforeEach(() => {
  // 각 테스트 전: Remote Config 싱글턴 + 스토어 초기화
  _resetForTest();
  useConfigStore.setState({ flags: { ...DEFAULT_FLAGS }, initialized: false });
  mockGetBoolean.mockReset();
  mockFetchAndActivate.mockReset();
  mockGetBoolean.mockReturnValue(false);
  mockFetchAndActivate.mockResolvedValue(true);
});

// ──────────────────────────────────────────────
// 1. getFlag() 기본값 반환
// ──────────────────────────────────────────────

describe('getFlag() — 기본값', () => {
  it('request_card_enabled 기본값은 true', () => {
    expect(getFlag(FeatureFlags.REQUEST_CARD_ENABLED)).toBe(true);
  });

  it('maintenance_mode 기본값은 false', () => {
    expect(getFlag(FeatureFlags.MAINTENANCE_MODE)).toBe(false);
  });

  it('force_update_required 기본값은 false', () => {
    expect(getFlag(FeatureFlags.FORCE_UPDATE_REQUIRED)).toBe(false);
  });

  it('new_onboarding_enabled 기본값은 false', () => {
    expect(getFlag(FeatureFlags.NEW_ONBOARDING_ENABLED)).toBe(false);
  });
});

// ──────────────────────────────────────────────
// 2. getFlag() Remote Config 값 우선 반환
// ──────────────────────────────────────────────

describe('getFlag() — store 값 우선 반환', () => {
  it('store에 true로 설정된 값을 반환한다', () => {
    useConfigStore.getState().setFlag(FeatureFlags.MAINTENANCE_MODE, true);
    expect(getFlag(FeatureFlags.MAINTENANCE_MODE)).toBe(true);
  });

  it('store에 false로 재설정하면 false를 반환한다', () => {
    useConfigStore.getState().setFlag(FeatureFlags.REQUEST_CARD_ENABLED, false);
    expect(getFlag(FeatureFlags.REQUEST_CARD_ENABLED)).toBe(false);
  });
});

// ──────────────────────────────────────────────
// 3. maintenance_mode 감지
// ──────────────────────────────────────────────

describe('maintenance_mode 감지', () => {
  it('maintenance_mode ON 설정 시 getFlag가 true 반환', () => {
    useConfigStore.getState().setFlag(FeatureFlags.MAINTENANCE_MODE, true);
    expect(getFlag(FeatureFlags.MAINTENANCE_MODE)).toBe(true);
  });

  it('maintenance_mode OFF 복구 시 false 반환', () => {
    useConfigStore.getState().setFlag(FeatureFlags.MAINTENANCE_MODE, true);
    useConfigStore.getState().setFlag(FeatureFlags.MAINTENANCE_MODE, false);
    expect(getFlag(FeatureFlags.MAINTENANCE_MODE)).toBe(false);
  });
});

// ──────────────────────────────────────────────
// 4. getString() — min_app_version
// ──────────────────────────────────────────────

describe('getString()', () => {
  it('min_app_version 기본값은 "1.0.0"', () => {
    expect(getString(FeatureFlags.MIN_APP_VERSION)).toBe('1.0.0');
  });

  it('store에 문자열 값을 설정하면 해당 값을 반환한다', () => {
    useConfigStore.getState().setFlag(FeatureFlags.MIN_APP_VERSION, '2.0.0');
    expect(getString(FeatureFlags.MIN_APP_VERSION)).toBe('2.0.0');
  });
});

// ──────────────────────────────────────────────
// 5. init() — 초기화 흐름
// ──────────────────────────────────────────────

describe('init()', () => {
  it('init() 완료 후 initialized가 true가 된다', async () => {
    expect(useConfigStore.getState().initialized).toBe(false);
    await init();
    expect(useConfigStore.getState().initialized).toBe(true);
  });

  it('Firebase 실패 시에도 initialized가 true가 된다 (폴백)', async () => {
    mockFetchAndActivate.mockRejectedValueOnce(new Error('Network error'));
    await init();
    expect(useConfigStore.getState().initialized).toBe(true);
  });

  it('init() 후 getBoolean이 반환한 값이 store에 반영된다', async () => {
    // maintenance_mode에 대해 getBoolean이 true를 반환하도록 설정
    mockGetBoolean.mockImplementation((_config: unknown, key: string) =>
      key === FeatureFlags.MAINTENANCE_MODE ? true : false
    );
    await init();
    expect(getFlag(FeatureFlags.MAINTENANCE_MODE)).toBe(true);
  });
});

// ──────────────────────────────────────────────
// 6. useFeatureFlag hook (store 기반 검증)
// ──────────────────────────────────────────────

describe('useFeatureFlag hook — configStore 기반 반응성', () => {
  it('store 값이 변경되면 getFlag가 즉시 새 값을 반환한다', () => {
    // hooks는 React 렌더링 없이 store 직접 검증
    useConfigStore.getState().setFlag(FeatureFlags.PRAISE_CARD_ENABLED, false);
    expect(getFlag(FeatureFlags.PRAISE_CARD_ENABLED)).toBe(false);
    useConfigStore.getState().setFlag(FeatureFlags.PRAISE_CARD_ENABLED, true);
    expect(getFlag(FeatureFlags.PRAISE_CARD_ENABLED)).toBe(true);
  });

  it('DEFAULT_FLAGS의 모든 boolean 키가 초기 store에 존재한다', () => {
    const flags = useConfigStore.getState().flags;
    const booleanKeys = Object.entries(DEFAULT_FLAGS)
      .filter(([, v]) => typeof v === 'boolean')
      .map(([k]) => k);
    booleanKeys.forEach((key) => {
      expect(flags).toHaveProperty(key);
    });
  });
});
