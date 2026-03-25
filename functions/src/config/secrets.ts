// ──────────────────────────────────────────────
// secrets.ts — Firebase Secret Manager 중앙 정의
// Cloud Functions v2 + defineSecret() 패턴
//
// 배포 시: firebase functions:secrets:set SECRET_NAME
// 로컬 개발: .env 파일 fallback (process.env)
//
// 사용법:
//   import { ANTHROPIC_SECRET } from '../config/secrets';
//   export const myFn = onCall({ secrets: [ANTHROPIC_SECRET] }, handler);
//   const key = ANTHROPIC_SECRET.value(); // 핸들러 내부에서
// ──────────────────────────────────────────────

import { defineSecret } from 'firebase-functions/params';

// ── AI ────────────────────────────────────────
/** Anthropic Claude API 키. Cloud Functions 전용. 클라이언트 직접 사용 금지. */
export const ANTHROPIC_SECRET = defineSecret('ANTHROPIC_API_KEY');

// ── 모니터링 ──────────────────────────────────
/** PostHog 서버사이드 API 키 (에러/이벤트 분석). */
export const POSTHOG_SECRET = defineSecret('POSTHOG_API_KEY');

// ── 결제 ──────────────────────────────────────
/** RevenueCat 서버 시크릿 키 (구독 검증용). */
export const REVENUECAT_SECRET = defineSecret('REVENUECAT_API_KEY');

// ── 로컬 개발 fallback ──────────────────────────
/**
 * 로컬에서 Functions를 에뮬레이터로 실행할 때 .env 값을 사용.
 * 배포 환경에서는 defineSecret().value()를 사용해야 함.
 */
export function getSecretValue(secret: ReturnType<typeof defineSecret>): string {
  try {
    return secret.value();
  } catch {
    // 로컬 에뮬레이터 또는 테스트 환경
    const envKey = secret.name;
    const val = process.env[envKey];
    if (!val) {
      throw new Error(`Secret '${envKey}' not found. Set via Firebase Secret Manager or .env`);
    }
    return val;
  }
}
