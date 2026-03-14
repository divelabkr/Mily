import {
  getRemoteConfig,
  fetchAndActivate,
  getBoolean,
  getString as getStringRC,
  RemoteConfig,
} from 'firebase/remote-config';
import { getFirebaseApp } from '../../lib/firebase';
import { DEFAULT_FLAGS, FeatureFlagValue } from './featureFlags';
import { useConfigStore } from './configStore';

// __DEV__: React Native 글로벌. 비-RN 환경(테스트 등) 방어
const IS_DEV = typeof __DEV__ !== 'undefined' && __DEV__;

let _remoteConfig: RemoteConfig | null = null;

function getConfig(): RemoteConfig {
  if (!_remoteConfig) {
    _remoteConfig = getRemoteConfig(getFirebaseApp());
    _remoteConfig.defaultConfig = DEFAULT_FLAGS;
    _remoteConfig.settings.minimumFetchIntervalMillis = IS_DEV ? 0 : 3600 * 1000;
  }
  return _remoteConfig;
}

// ──────────────────────────────────────────────
// Firebase Remote Config 초기화
// ──────────────────────────────────────────────

export async function init(): Promise<void> {
  try {
    const config = getConfig();
    await fetchAndActivate(config);

    // 서버에서 받아온 값으로 store 갱신
    const updatedFlags: Record<string, boolean | string> = {};
    for (const key of Object.keys(DEFAULT_FLAGS)) {
      const defaultVal = DEFAULT_FLAGS[key];
      updatedFlags[key] =
        typeof defaultVal === 'boolean'
          ? getBoolean(config, key)
          : getStringRC(config, key);
    }
    useConfigStore.getState().setFlags(updatedFlags);
  } catch {
    // Firebase 연결 실패 → DEFAULT_FLAGS 그대로 유지
  } finally {
    useConfigStore.getState().setInitialized(true);
  }
}

// ──────────────────────────────────────────────
// 플래그 읽기
// ──────────────────────────────────────────────

export function getFlag(key: FeatureFlagValue): boolean {
  const flags = useConfigStore.getState().flags;
  const val = flags[key];
  if (typeof val === 'boolean') return val;
  return (DEFAULT_FLAGS[key] as boolean) ?? false;
}

export function getString(key: string): string {
  const flags = useConfigStore.getState().flags;
  const val = flags[key];
  if (typeof val === 'string') return val;
  return (DEFAULT_FLAGS[key] as string) ?? '';
}

// ──────────────────────────────────────────────
// 기본값 Firebase 등록 (선택 호출)
// ──────────────────────────────────────────────

export function setDefaults(): void {
  try {
    getConfig(); // lazy init에서 defaultConfig 등록
  } catch {
    // Firebase 미초기화 상태 무시
  }
}

// ──────────────────────────────────────────────
// 테스트 전용: 내부 상태 초기화
// ──────────────────────────────────────────────

export function _resetForTest(): void {
  _remoteConfig = null;
}
