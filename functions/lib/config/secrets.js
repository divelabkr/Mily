"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ANTHROPIC_SECRET = void 0;
exports.getSecretValue = getSecretValue;
const params_1 = require("firebase-functions/params");
// ── AI ────────────────────────────────────────
/** Anthropic Claude API 키. Cloud Functions 전용. 클라이언트 직접 사용 금지. */
exports.ANTHROPIC_SECRET = (0, params_1.defineSecret)('ANTHROPIC_API_KEY');
// ── 로컬 개발 fallback ──────────────────────────
// POSTHOG_SECRET, REVENUECAT_SECRET — 미사용(P2). 필요 시 여기서 defineSecret 추가.
/**
 * 로컬에서 Functions를 에뮬레이터로 실행할 때 .env 값을 사용.
 * 배포 환경에서는 defineSecret().value()를 사용해야 함.
 */
function getSecretValue(secret) {
    try {
        return secret.value();
    }
    catch (_a) {
        // 로컬 에뮬레이터 또는 테스트 환경
        const envKey = secret.name;
        const val = process.env[envKey];
        if (!val) {
            throw new Error(`Secret '${envKey}' not found. Set via Firebase Secret Manager or .env`);
        }
        return val;
    }
}
//# sourceMappingURL=secrets.js.map