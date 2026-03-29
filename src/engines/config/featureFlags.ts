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

  // UX 개편
  DRAWER_NAV_ENABLED: 'drawer_nav_enabled',
  UNIFIED_CHECKIN_ENABLED: 'unified_checkin_enabled',

  // 콘텐츠 엔진
  REPORT_V2_ENABLED: 'report_v2_enabled',
  GOAL_SIMULATOR_ENABLED: 'goal_simulator_enabled',
  PROMISE_LOOP_ENABLED: 'promise_loop_enabled',

  // 밀리의 밀리어네어
  MILLIONAIRE_ENABLED: 'millionaire_enabled',
  DREAM_SCENARIO_ENABLED: 'dream_scenario_enabled',

  // 패밀리뱅크
  FAMILY_BANK_ENABLED: 'family_bank_enabled',
  TRUST_SCORE_ENABLED: 'trust_score_enabled',

  // 캐시플로우
  CASHFLOW_ENGINE_ENABLED: 'cashflow_engine_enabled',
  LIFE_EVENTS_ENABLED: 'life_events_enabled',
  FINANCIAL_STATEMENT_ENABLED: 'financial_statement_enabled',
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
  graduation_coupon_value: '5000',
  // 기능 5~6
  smart_budget_enabled: true,
  daily_checkin_enabled: true,
  monthly_reconcile_enabled: true,

  // 체크인 모드 기본값
  daily_checkin_default_mode: 'standard',

  // UX 개편
  drawer_nav_enabled: false,
  unified_checkin_enabled: false,

  // 콘텐츠 엔진
  report_v2_enabled: true,
  goal_simulator_enabled: true,
  promise_loop_enabled: true,

  // 밀리의 밀리어네어
  millionaire_enabled: false,
  dream_scenario_enabled: false,

  // 패밀리뱅크
  family_bank_enabled: false,
  trust_score_enabled: false,

  // 캐시플로우
  cashflow_engine_enabled: false,
  life_events_enabled: false,
  financial_statement_enabled: false,
};
