// ──────────────────────────────────────────────
// dailySummaryService.ts — 일별 지출 요약
// 선택소비(choice) 중심 집계. 고정비 제외.
// ──────────────────────────────────────────────

import { collection, getDocs, query, where } from 'firebase/firestore';
import { getFirebaseDb } from '../../lib/firebase';
import { capture } from '../monitoring/posthogService';
import type { CheckIn } from './checkinStore';
import type { SpendType } from '../plan/defaultCategories';

export interface DailySummary {
  date: string;           // "YYYY-MM-DD"
  totalAmount: number;
  choiceAmount: number;   // 선택소비만 (홈 표시용)
  livingAmount: number;
  fixedAmount: number;
  checkInCount: number;
}

// ──────────────────────────────────────────────
// 날짜 → "YYYY-MM-DD" 문자열
// ──────────────────────────────────────────────

export function toDateString(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// ──────────────────────────────────────────────
// checkIns 배열 → DailySummary 계산 (순수 함수)
// ──────────────────────────────────────────────

export function computeDailySummary(
  checkIns: CheckIn[],
  date: string
): DailySummary {
  // createdAt(ms) → dateString과 비교
  const filtered = checkIns.filter((c) => {
    const d = new Date(c.createdAt);
    return toDateString(d) === date;
  });

  const total = filtered.reduce((s, c) => s + c.amount, 0);

  const byType = (type: SpendType) =>
    filtered
      .filter((c) => c.spendType === type)
      .reduce((s, c) => s + c.amount, 0);

  return {
    date,
    totalAmount: total,
    choiceAmount: byType('choice'),
    livingAmount: byType('living'),
    fixedAmount: byType('fixed'),
    checkInCount: filtered.length,
  };
}

// ──────────────────────────────────────────────
// 오늘 일별 요약 조회 (Firestore — weekId 컬렉션)
// ──────────────────────────────────────────────

export async function getTodaySummary(
  uid: string,
  weekId: string
): Promise<DailySummary> {
  const today = toDateString();

  try {
    const colRef = collection(getFirebaseDb(), 'checkins', uid, weekId);
    const snaps = await getDocs(colRef);

    const checkIns: CheckIn[] = snaps.docs.map((d) => ({
      ...(d.data() as Omit<CheckIn, 'checkInId'>),
      checkInId: d.id,
    }));

    return computeDailySummary(checkIns, today);
  } catch {
    return {
      date: today,
      totalAmount: 0,
      choiceAmount: 0,
      livingAmount: 0,
      fixedAmount: 0,
      checkInCount: 0,
    };
  }
}

// ──────────────────────────────────────────────
// 일별 합산 저장 (선택소비 요약 이벤트)
// ──────────────────────────────────────────────

export function trackDailyCheckInCompleted(summary: DailySummary): void {
  capture('daily_checkin_completed', {
    date: summary.date,
    totalAmount: summary.totalAmount,
    choiceAmount: summary.choiceAmount,
    checkInCount: summary.checkInCount,
  });
}

// ──────────────────────────────────────────────
// 다중 카테고리 일괄 저장 (3-step wizard 결과)
// ──────────────────────────────────────────────

export interface DailyBatchEntry {
  categoryId: string;
  amount: number;
  spendType: SpendType;
}

export function applyPercentages(
  totalAmount: number,
  entries: Array<{ categoryId: string; percentage: number; spendType: SpendType }>
): DailyBatchEntry[] {
  const result: DailyBatchEntry[] = [];
  let remaining = totalAmount;

  for (let i = 0; i < entries.length; i++) {
    const isLast = i === entries.length - 1;
    const amount = isLast
      ? remaining
      : Math.round(totalAmount * entries[i].percentage / 100);
    remaining -= amount;

    if (amount > 0) {
      result.push({
        categoryId: entries[i].categoryId,
        amount,
        spendType: entries[i].spendType,
      });
    }
  }

  return result;
}
