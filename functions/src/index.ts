import { initializeApp } from 'firebase-admin/app';

// firebase-admin SDK 초기화 — 모든 함수보다 먼저 실행되어야 함
// Cloud Functions v2는 자동 초기화를 보장하지 않으므로 명시적 호출 필요
initializeApp();

export { generateWeeklyReview } from './ai/weeklyReview';
export { bufferRequestCard } from './ai/requestBuffer';
export { useCoupon } from './coupon/useCoupon';
export { expireCoupons } from './coupon/expireCoupons';
