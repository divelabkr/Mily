import { create } from 'zustand';
import { CategoryId } from './defaultCategories';

export interface CategoryAllocation {
  categoryId: CategoryId;
  percent: number; // 0~100, 전체 합 100
}

export interface Plan {
  planId: string;
  uid: string;
  month: string;
  totalBudget: number;
  categories: CategoryAllocation[];
  weeklyPromise?: string | null;
  createdAt: number;
  updatedAt: number;
}

interface PlanState {
  currentPlan: Plan | null;
  loading: boolean;
  setCurrentPlan: (plan: Plan | null) => void;
  setLoading: (loading: boolean) => void;
  updateCategoryPercent: (categoryId: CategoryId, percent: number) => void;
  setTotalBudget: (budget: number) => void;
  setWeeklyPromise: (promise: string | null) => void;
}

export const usePlanStore = create<PlanState>((set) => ({
  currentPlan: null,
  loading: false,
  setCurrentPlan: (plan) => set({ currentPlan: plan }),
  setLoading: (loading) => set({ loading }),
  updateCategoryPercent: (categoryId, percent) =>
    set((state) => {
      if (!state.currentPlan) return state;
      const categories = state.currentPlan.categories.map((c) =>
        c.categoryId === categoryId ? { ...c, percent } : c
      );
      return {
        currentPlan: {
          ...state.currentPlan,
          categories,
          updatedAt: Date.now(),
        },
      };
    }),
  setTotalBudget: (budget) =>
    set((state) => {
      if (!state.currentPlan) return state;
      return {
        currentPlan: {
          ...state.currentPlan,
          totalBudget: budget,
          updatedAt: Date.now(),
        },
      };
    }),
  setWeeklyPromise: (promise) =>
    set((state) => {
      if (!state.currentPlan) return state;
      return {
        currentPlan: {
          ...state.currentPlan,
          weeklyPromise: promise,
          updatedAt: Date.now(),
        },
      };
    }),
}));
