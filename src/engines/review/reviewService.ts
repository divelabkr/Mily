import {
  doc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { getFirebaseDb, getFirebaseFunctions } from '../../lib/firebase';
import { WeeklyReviewOutput } from '../ai/prompts/weeklyReview';
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
  const weekId = getWeekId();
  const callInput = {
    weekId,
    totalBudget: getWeeklyBudget(plan),
    categories: DEFAULT_CATEGORIES.map((cat) => ({
      categoryId: cat.id,
      label: cat.label,
      weeklyLimit: getCategoryWeeklyLimit(plan, cat.id),
      spent: getWeeklyCategoryTotal(checkIns, cat.id),
      spendType: cat.defaultSpendType ?? null,
    })),
    emotionTags: checkIns
      .map((c) => c.emotionTag)
      .filter((t): t is NonNullable<typeof t> => t != null),
  };

  try {
    const fn = httpsCallable<typeof callInput, WeeklyReviewOutput>(
      getFirebaseFunctions(),
      'generateWeeklyReview'
    );
    const result = await fn(callInput);
    return result.data;
  } catch {
    void uid; // uid reserved for future per-user logging
    return {
      good: '이번 주도 기록을 꾸준히 해줬어요!',
      leak: '소비 패턴을 좀 더 살펴볼 수 있어요.',
      suggestion: '다음 주에는 한 카테고리만 집중해볼까요?',
    };
  }
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
