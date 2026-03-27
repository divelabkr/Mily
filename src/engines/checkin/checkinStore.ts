import { create } from 'zustand';
import { CategoryId, SpendType } from '../plan/defaultCategories';

export type EmotionTag = 'impulse' | 'stress' | 'social' | 'reward';
export type { SpendType }; // re-export for backward compatibility

export interface CheckIn {
  checkInId: string;
  uid: string;
  weekId: string;
  categoryId: CategoryId;
  amount: number;
  spendType?: SpendType | null;
  planId?: string;
  boundary?: 'within' | 'similar' | 'outside';
  memo?: string;
  emotionTag?: EmotionTag | null;
  createdAt: number;
}

interface CheckInState {
  weeklyCheckIns: CheckIn[];
  loading: boolean;
  setWeeklyCheckIns: (checkIns: CheckIn[]) => void;
  addCheckIn: (checkIn: CheckIn) => void;
  setLoading: (loading: boolean) => void;
}

export const useCheckInStore = create<CheckInState>((set) => ({
  weeklyCheckIns: [],
  loading: false,
  setWeeklyCheckIns: (weeklyCheckIns) => set({ weeklyCheckIns }),
  addCheckIn: (checkIn) =>
    set((state) => ({
      weeklyCheckIns: [...state.weeklyCheckIns, checkIn],
    })),
  setLoading: (loading) => set({ loading }),
}));

export function getWeeklyCategoryTotal(
  checkIns: CheckIn[],
  categoryId: CategoryId
): number {
  return checkIns
    .filter((c) => c.categoryId === categoryId)
    .reduce((sum, c) => sum + c.amount, 0);
}

export function getWeeklyTotal(checkIns: CheckIn[]): number {
  return checkIns.reduce((sum, c) => sum + c.amount, 0);
}

/** SpendType별 주간 합계 */
function sumBySpendType(checkIns: CheckIn[], spendType: SpendType): number {
  return checkIns
    .filter((c) => c.spendType === spendType)
    .reduce((sum, c) => sum + c.amount, 0);
}

/** 특정 지출유형 합산 또는 { fixed, living, choice } 전체 반환 */
export function getWeeklyTotalBySpendType(checkIns: CheckIn[], spendType: SpendType): number;
export function getWeeklyTotalBySpendType(checkIns: CheckIn[]): { fixed: number; living: number; choice: number };
export function getWeeklyTotalBySpendType(
  checkIns: CheckIn[],
  spendType?: SpendType
): { fixed: number; living: number; choice: number } | number {
  if (spendType !== undefined) {
    return sumBySpendType(checkIns, spendType);
  }
  return {
    fixed:  sumBySpendType(checkIns, 'fixed'),
    living: sumBySpendType(checkIns, 'living'),
    choice: sumBySpendType(checkIns, 'choice'),
  };
}

/**
 * 선택소비(choice)만 합산 — 홈 메인 표시용
 * CLAUDE.md: 고정비 제외, 선택소비 우선 표시
 */
export function getWeeklyChoiceTotal(checkIns: CheckIn[]): number {
  return sumBySpendType(checkIns, 'choice');
}

/** { fixed, living, choice } 한 번에 반환 */
export function getWeeklySpendBreakdown(checkIns: CheckIn[]): {
  fixed: number;
  living: number;
  choice: number;
} {
  return {
    fixed:  sumBySpendType(checkIns, 'fixed'),
    living: sumBySpendType(checkIns, 'living'),
    choice: sumBySpendType(checkIns, 'choice'),
  };
}
