import {
  doc,
  setDoc,
  getDoc,
  collection,
  getDocs,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import { getFirebaseDb } from '../../lib/firebase';
import { DEFAULT_CATEGORIES, CategoryId } from './defaultCategories';
import { Plan, CategoryAllocation, usePlanStore } from './planStore';
import { getMonthId } from '../../utils/dateUtils';

export function createDefaultAllocations(): CategoryAllocation[] {
  const count = DEFAULT_CATEGORIES.length;
  const base = Math.floor(100 / count);
  const remainder = 100 - base * count;

  return DEFAULT_CATEGORIES.map((cat, i) => ({
    categoryId: cat.id,
    percent: base + (i < remainder ? 1 : 0),
  }));
}

export function createNewPlan(uid: string, totalBudget: number): Plan {
  const now = Date.now();
  return {
    planId: `${uid}_${getMonthId()}`,
    uid,
    month: getMonthId(),
    totalBudget,
    categories: createDefaultAllocations(),
    createdAt: now,
    updatedAt: now,
  };
}

export function getWeeklyBudget(plan: Plan): number {
  return Math.round(plan.totalBudget / 4);
}

export function getCategoryWeeklyLimit(
  plan: Plan,
  categoryId: CategoryId
): number {
  const weeklyBudget = getWeeklyBudget(plan);
  const cat = plan.categories.find((c) => c.categoryId === categoryId);
  if (!cat) return 0;
  return Math.round((weeklyBudget * cat.percent) / 100);
}

export function normalizeCategoryPercents(
  categories: CategoryAllocation[]
): CategoryAllocation[] {
  const total = categories.reduce((sum, c) => sum + c.percent, 0);
  if (total === 0) return createDefaultAllocations();

  // 반올림 후 합계 오차를 첫 번째 항목에 보정
  const normalized = categories.map((c) => ({
    ...c,
    percent: Math.round((c.percent / total) * 100),
  }));
  const roundedTotal = normalized.reduce((s, c) => s + c.percent, 0);
  if (roundedTotal !== 100 && normalized.length > 0) {
    normalized[0] = {
      ...normalized[0],
      percent: normalized[0].percent + (100 - roundedTotal),
    };
  }
  return normalized;
}

// ──────────────────────────────────────────────
// Firestore CRUD
// ──────────────────────────────────────────────

export async function savePlan(plan: Plan): Promise<void> {
  const planRef = doc(
    getFirebaseDb(),
    'plans',
    plan.uid,
    plan.month,
    'data'
  );
  await setDoc(planRef, { ...plan, updatedAt: Date.now() }, { merge: true });
  usePlanStore.getState().setCurrentPlan(plan);
}

export async function loadCurrentPlan(uid: string): Promise<Plan | null> {
  const monthId = getMonthId();
  const planRef = doc(getFirebaseDb(), 'plans', uid, monthId, 'data');
  const snap = await getDoc(planRef);
  if (!snap.exists()) return null;
  const plan = snap.data() as Plan;
  usePlanStore.getState().setCurrentPlan(plan);
  return plan;
}

export async function loadLatestPlan(uid: string): Promise<Plan | null> {
  const current = await loadCurrentPlan(uid);
  if (current) return current;

  const plansCol = collection(getFirebaseDb(), 'plans', uid);
  const q = query(plansCol, orderBy('__name__', 'desc'), limit(1));
  const snaps = await getDocs(q);
  if (snaps.empty) return null;

  const monthSnap = await getDoc(
    doc(getFirebaseDb(), 'plans', uid, snaps.docs[0].id, 'data')
  );
  if (!monthSnap.exists()) return null;
  const plan = monthSnap.data() as Plan;
  usePlanStore.getState().setCurrentPlan(plan);
  return plan;
}
