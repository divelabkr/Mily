import { useConfigStore } from './configStore';
import { DEFAULT_FLAGS, FeatureFlags, FeatureFlagValue } from './featureFlags';

// ──────────────────────────────────────────────
// 범용 feature flag hook
// ──────────────────────────────────────────────

export function useFeatureFlag(key: FeatureFlagValue): boolean {
  const flags = useConfigStore((s) => s.flags);
  const val = flags[key];
  if (typeof val === 'boolean') return val;
  return (DEFAULT_FLAGS[key] as boolean) ?? false;
}

// ──────────────────────────────────────────────
// 운영 제어 전용 hooks
// ──────────────────────────────────────────────

export function useMaintenanceMode(): boolean {
  return useFeatureFlag(FeatureFlags.MAINTENANCE_MODE);
}

export function useForceUpdate(): boolean {
  return useFeatureFlag(FeatureFlags.FORCE_UPDATE_REQUIRED);
}
