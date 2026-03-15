export const FeatureFlags = {
  // 핵심 기능
  REQUEST_CARD_ENABLED: 'request_card_enabled',
  WEEKLY_REVIEW_ENABLED: 'weekly_review_enabled',
  PRAISE_CARD_ENABLED: 'praise_card_enabled',

  // 실험적 기능
  NEW_ONBOARDING_ENABLED: 'new_onboarding_enabled',
  PAYWALL_V2_ENABLED: 'paywall_v2_enabled',

  // 운영 제어
  MAINTENANCE_MODE: 'maintenance_mode',
  FORCE_UPDATE_REQUIRED: 'force_update_required',
  MIN_APP_VERSION: 'min_app_version',

  // 성년 전환 (Feature 3)
  GRADUATION_CELEBRATION_ENABLED: 'graduation_celebration_enabled',
  GRADUATION_COUPON_ENABLED: 'graduation_coupon_enabled',
  GRADUATION_COUPON_VALUE: 'graduation_coupon_value',

  // 기능 5~6
  SMART_BUDGET_ENABLED: 'smart_budget_enabled',
  DAILY_CHECKIN_ENABLED: 'daily_checkin_enabled',
  MONTHLY_RECONCILE_ENABLED: 'monthly_reconcile_enabled',

  // 체크인 모드
  DAILY_CHECKIN_DEFAULT_MODE: 'daily_checkin_default_mode',
} as const;

export type FeatureFlagKey = keyof typeof FeatureFlags;
export type FeatureFlagValue = (typeof FeatureFlags)[FeatureFlagKey];

// Firebase 연결 실패 시 폴백 + Remote Config 기본값 등록용
export const DEFAULT_FLAGS: Record<string, boolean | string> = {
  request_card_enabled: true,
  weekly_review_enabled: true,
  praise_card_enabled: true,
  new_onboarding_enabled: false,
  paywall_v2_enabled: false,
  maintenance_mode: false,
  force_update_required: false,
  min_app_version: '1.0.0',
  // 성년 전환
  graduation_celebration_enabled: true,
  graduation_coupon_enabled: false,
  graduation_coupon_value: 5000,
  // 기능 5~6
  smart_budget_enabled: true,
  daily_checkin_enabled: true,
  monthly_reconcile_enabled: true,

  // 체크인 모드 기본값
  daily_checkin_default_mode: 'standard',
};
