import { isPaidPlan } from './billingService';
import { useRequestCardStore } from '../requestCard/requestCardStore';
import { PLANS } from './plans';

export type PaywallTrigger = 'week4_review' | 'family_linked' | 'request_limit';

// ──────────────────────────────────────────────
// 트리거 A: 4주차 회고 완료 직후
// ──────────────────────────────────────────────
export function checkWeek4ReviewTrigger(completedWeekCount: number): boolean {
  if (isPaidPlan()) return false;
  return completedWeekCount >= 4;
}

// ──────────────────────────────────────────────
// 트리거 B: 가족 연결 직후 첫 요약
// ──────────────────────────────────────────────
export function checkFamilyLinkedTrigger(isNewFamilyLink: boolean): boolean {
  if (isPaidPlan()) return false;
  return isNewFamilyLink;
}

// ──────────────────────────────────────────────
// 트리거 C: Free 요청 카드 주 2장 소진
// ──────────────────────────────────────────────
export function checkRequestLimitTrigger(): boolean {
  if (isPaidPlan()) return false;
  const cards = useRequestCardStore.getState().cards;
  const currentWeekCards = cards.filter(
    (c) => Date.now() - c.createdAt < 7 * 24 * 60 * 60 * 1000
  );
  const freeLimit = PLANS.free.requestCardsPerWeek;
  return currentWeekCards.length >= freeLimit;
}

// ──────────────────────────────────────────────
// 트리거 통합 체크 — 어디서든 호출 가능
// ──────────────────────────────────────────────
export function evaluatePaywallTrigger(
  trigger: PaywallTrigger,
  param?: number | boolean
): boolean {
  switch (trigger) {
    case 'week4_review':
      return checkWeek4ReviewTrigger(param as number ?? 0);
    case 'family_linked':
      return checkFamilyLinkedTrigger(param as boolean ?? false);
    case 'request_limit':
      return checkRequestLimitTrigger();
    default:
      return false;
  }
}
