// ──────────────────────────────────────────────
// reconcileService.ts — 월간 정산 (지출 vs 계획)
// choice 우선 코칭. 절대 판단/훈계 금지.
// 외부 서버 전송 없음 — Firestore 로컬 저장만.
// ──────────────────────────────────────────────

import {
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import { getFirebaseDb } from '../../lib/firebase';
import { capture } from '../monitoring/posthogService';
import type { Plan } from '../plan/planStore';
import type { CheckIn } from '../checkin/checkinStore';

// ──────────────────────────────────────────────
// 타입
// ──────────────────────────────────────────────

export interface CategoryReconcile {
  categoryId: string;
  planned: number;      // 계획 금액 (totalBudget × percent/100)
  actual: number;       // 실제 지출
  adherence: number;    // actual/planned (1.0 = 100%)
}

export interface MonthlyReconcile {
  monthId: string;          // "YYYY-MM"
  totalPlanned: number;
  totalActual: number;
  choiceActual: number;     // 선택소비만
  adherenceRate: number;    // totalActual / totalPlanned (0~1, 1이상=초과)
  categories: CategoryReconcile[];
  checkInCount: number;
  createdAt: number;
}

// ──────────────────────────────────────────────
// 1. 월 전체 check-ins 수집 (weekId 순회)
// ──────────────────────────────────────────────

export async function loadMonthlyCheckIns(
  uid: string,
  monthId: string
): Promise<CheckIn[]> {
  const db = getFirebaseDb();

  // checkins/{uid}/* 전체 컬렉션에서 weekId가 해당 월인 것 필터
  // (weekId = "YYYY-Www" — 월 필터는 createdAt으로)
  const result: CheckIn[] = [];

  try {
    // 해당 월의 weekId 범위: "YYYY-W01" ~ "YYYY-W53"
    // 단순하게: checkins/{uid}의 모든 서브컬렉션을 월 기준으로 필터
    // → 여기서는 Firestore collectionGroup 대신 직접 쿼리
    const [year, month] = monthId.split('-').map(Number);
    const startMs = new Date(year, month - 1, 1).getTime();
    const endMs = new Date(year, month, 0, 23, 59, 59, 999).getTime();

    // checkins/{uid}/{weekId}/docs 순회
    // 월에 걸친 week들을 커버하기 위해 weekId 컬렉션 목록 가져오기
    const weekSnaps = await getDocs(collection(db, 'checkins', uid));
    for (const weekDoc of weekSnaps.docs) {
      const weekId = weekDoc.id;
      // weekId가 해당 연도인 것만 처리 (성능 최적화)
      if (!weekId.startsWith(`${year}-W`)) continue;

      const checkInSnaps = await getDocs(
        collection(db, 'checkins', uid, weekId)
      );
      for (const d of checkInSnaps.docs) {
        const data = d.data() as Omit<CheckIn, 'checkInId'>;
        const createdAt = typeof data.createdAt === 'number'
          ? data.createdAt
          : (data.createdAt as { toMillis?: () => number })?.toMillis?.() ?? 0;

        if (createdAt >= startMs && createdAt <= endMs) {
          result.push({ ...data, checkInId: d.id, createdAt });
        }
      }
    }
  } catch {
    // 오류 시 빈 배열 반환
  }

  return result;
}

// ──────────────────────────────────────────────
// 2. 월간 정산 계산 (순수 함수)
// ──────────────────────────────────────────────

export function computeMonthlyReconcile(
  checkIns: CheckIn[],
  plan: Plan,
  monthId: string
): MonthlyReconcile {
  const totalPlanned = plan.totalBudget;

  const actualByCategory: Record<string, number> = {};
  let choiceActual = 0;
  let totalActual = 0;

  for (const ci of checkIns) {
    actualByCategory[ci.categoryId] = (actualByCategory[ci.categoryId] ?? 0) + ci.amount;
    totalActual += ci.amount;
    if (ci.spendType === 'choice') choiceActual += ci.amount;
  }

  const categories: CategoryReconcile[] = plan.categories.map((cat) => {
    const planned = Math.round((totalPlanned * cat.percent) / 100);
    const actual = actualByCategory[cat.categoryId] ?? 0;
    const adherence = planned > 0 ? actual / planned : 0;
    return { categoryId: cat.categoryId, planned, actual, adherence };
  });

  const adherenceRate = totalPlanned > 0 ? totalActual / totalPlanned : 0;

  return {
    monthId,
    totalPlanned,
    totalActual,
    choiceActual,
    adherenceRate,
    categories,
    checkInCount: checkIns.length,
    createdAt: Date.now(),
  };
}

// ──────────────────────────────────────────────
// 3. 월간 스냅샷 저장 (Firestore)
// ──────────────────────────────────────────────

export async function saveMonthlySnapshot(
  uid: string,
  reconcile: MonthlyReconcile
): Promise<void> {
  const db = getFirebaseDb();
  await setDoc(
    doc(db, 'monthlyReconcile', uid, 'snapshots', reconcile.monthId),
    {
      ...reconcile,
      savedAt: serverTimestamp(),
    }
  );

  capture('monthly_reconcile_saved', {
    monthId: reconcile.monthId,
    checkInCount: reconcile.checkInCount,
    adherenceRate: Math.round(reconcile.adherenceRate * 100),
  });
}

// ──────────────────────────────────────────────
// 4. 월간 스냅샷 조회
// ──────────────────────────────────────────────

export async function getMonthlySnapshot(
  uid: string,
  monthId: string
): Promise<MonthlyReconcile | null> {
  const db = getFirebaseDb();
  const snap = await getDoc(
    doc(db, 'monthlyReconcile', uid, 'snapshots', monthId)
  );
  if (!snap.exists()) return null;
  return snap.data() as MonthlyReconcile;
}

// ──────────────────────────────────────────────
// 5. 이전 달 monthId 반환
// ──────────────────────────────────────────────

export function getPrevMonthId(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = date.getMonth(); // 0-indexed, 0 = 1월
  const prevDate = m === 0 ? new Date(y - 1, 11, 1) : new Date(y, m - 1, 1);
  const py = prevDate.getFullYear();
  const pm = String(prevDate.getMonth() + 1).padStart(2, '0');
  return `${py}-${pm}`;
}

// ──────────────────────────────────────────────
// 6. 계획 준수율 요약 텍스트 (훈계형 금지)
// choice 우선, 기간 기반 서술
// ──────────────────────────────────────────────

export function getAdherenceSummary(reconcile: MonthlyReconcile): string {
  const { adherenceRate, choiceActual, totalActual } = reconcile;
  const choiceRatio = totalActual > 0 ? choiceActual / totalActual : 0;

  if (adherenceRate <= 0.8) {
    return `이번 달은 계획보다 여유 있게 지냈어요.`;
  }
  if (adherenceRate <= 1.0) {
    return `이번 달 계획 범위 안에서 잘 지냈어요.`;
  }
  if (choiceRatio < 0.3) {
    return `이번 달은 고정비 위주로 지출이 많았어요.`;
  }
  return `이번 달은 계획보다 조금 더 썼어요. 다음 달 계획에 반영해볼까요?`;
}
