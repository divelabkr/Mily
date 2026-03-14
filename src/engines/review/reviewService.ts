import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { getFirebaseDb } from '../../lib/firebase';
import { generateWeeklyReview } from '../ai/aiToneService';
import { WeeklyReviewOutput, WeeklyReviewInput } from '../ai/prompts/weeklyReview';
import { Plan } from '../plan/planStore';
import { CheckIn } from '../checkin/checkinStore';
import { DEFAULT_CATEGORIES } from '../plan/defaultCategories';
import { getCategoryWeeklyLimit, getWeeklyBudget } from '../plan/planService';
import {
  getWeeklyCategoryTotal,
  getWeeklyTotal,
} from '../checkin/checkinStore';
import { getWeekId } from '../../utils/dateUtils';

export interface Review {
  uid: string;
  weekId: string;
  good: string;
  leak: string;
  suggestion: string;
  aiUsed: boolean;
  promiseKept: boolean | null;
  createdAt: unknown;
}

// ──────────────────────────────────────────────
// 회고 생성
// ──────────────────────────────────────────────

export async function generateReview(
  uid: string,
  plan: Plan,
  checkIns: CheckIn[]
): Promise<WeeklyReviewOutput> {
  const input: WeeklyReviewInput = {
    categories: DEFAULT_CATEGORIES.map((cat) => ({
      categoryId: cat.id,
      label: cat.label,
      planned: getCategoryWeeklyLimit(plan, cat.id),
      actual: getWeeklyCategoryTotal(checkIns, cat.id),
      spendType: cat.defaultSpendType,
    })),
    emotionTags: checkIns
      .map((c) => c.emotionTag)
      .filter((t): t is NonNullable<typeof t> => t != null),
    totalBudget: getWeeklyBudget(plan),
    totalSpent: getWeeklyTotal(checkIns),
  };

  const result = await generateWeeklyReview(input);
  return result;
}

// ──────────────────────────────────────────────
// 회고 저장
// ──────────────────────────────────────────────

export async function saveReview(
  uid: string,
  review: WeeklyReviewOutput,
  aiUsed: boolean,
  promiseKept: boolean | null = null
): Promise<void> {
  const weekId = getWeekId();
  const reviewRef = doc(
    getFirebaseDb(),
    'reviews',
    uid,
    weekId,
    'data'
  );

  await setDoc(reviewRef, {
    uid,
    weekId,
    ...review,
    aiUsed,
    promiseKept,
    createdAt: serverTimestamp(),
  });
}

// ──────────────────────────────────────────────
// 작은 승리 조건
// ──────────────────────────────────────────────

export function detectSmallWin(
  plan: Plan,
  checkIns: CheckIn[]
): string | null {
  const weeklyBudget = getWeeklyBudget(plan);
  const totalSpent = getWeeklyTotal(checkIns);

  if (totalSpent <= weeklyBudget * 0.8) {
    return '이번 주 예산의 80% 이내로 잘 지켰어요!';
  }

  const underCategories = DEFAULT_CATEGORIES.filter((cat) => {
    const limit = getCategoryWeeklyLimit(plan, cat.id);
    const spent = getWeeklyCategoryTotal(checkIns, cat.id);
    return limit > 0 && spent <= limit * 0.6;
  });

  if (underCategories.length >= 2) {
    return `${underCategories.map((c) => c.label).join(', ')} 절약 성공!`;
  }

  return null;
}
