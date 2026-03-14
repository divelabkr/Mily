import { CheckIn } from '../checkin/checkinStore';
import { getWeekId } from '../../utils/dateUtils';
import { isPaidPlan } from './billingService';

// ──────────────────────────────────────────────
// Free: 현재 주 기록만 반환
// Paid: 전체 반환
// ──────────────────────────────────────────────

export function filterCheckInsByPlan(checkIns: CheckIn[]): CheckIn[] {
  if (isPaidPlan()) return checkIns;
  const currentWeek = getWeekId();
  return checkIns.filter((c) => c.weekId === currentWeek);
}

// 히스토리 주차 목록 필터
export function filterWeeksByPlan(weekIds: string[]): string[] {
  if (isPaidPlan()) return weekIds;
  const currentWeek = getWeekId();
  return weekIds.filter((w) => w === currentWeek);
}

// 히스토리 잠금 여부 체크 (UI에서 자물쇠 표시용)
export function isWeekLocked(weekId: string): boolean {
  if (isPaidPlan()) return false;
  return weekId !== getWeekId();
}

// 페이월 트리거 여부: Free 사용자가 잠긴 주차 접근 시도
export function shouldShowPaywall(weekId: string): boolean {
  return isWeekLocked(weekId);
}
