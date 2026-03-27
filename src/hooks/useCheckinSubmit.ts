// useCheckinSubmit.ts — 체크인 제출 훅
import { useState, useCallback } from 'react';
import { useAuthStore } from '../engines/auth/authStore';
import { usePlanStore } from '../engines/plan/planStore';
import { saveCheckIn } from '../engines/checkin/checkinService';
import { getCategoryWeeklyLimit } from '../engines/plan/planService';
import { getWeekId } from '../utils/dateUtils';
import type { SpendType } from '../engines/plan/defaultCategories';

interface CheckinInput {
  amount: number;
  spendType: SpendType;
  categoryId?: string;
  emotionTag?: 'impulse' | 'stress' | 'social' | 'reward';
  memo?: string;
  isCashGift?: boolean;
}

interface CheckinSubmitHook {
  isSubmitting: boolean;
  error: string | null;
  submit: (input: CheckinInput) => Promise<boolean>;
}

export function useCheckinSubmit(): CheckinSubmitHook {
  const user = useAuthStore((s) => s.user);
  const currentPlan = usePlanStore((s) => s.currentPlan);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(async (input: CheckinInput): Promise<boolean> => {
    if (!user?.uid) {
      setError('로그인이 필요해요');
      return false;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const weekId = getWeekId(new Date());
      const categoryId = input.categoryId ?? (input.spendType === 'fixed' ? 'fixed_general' : input.spendType === 'living' ? 'living_general' : 'choice_general');

      // boundary 계산
      let boundary: 'within' | 'similar' | 'outside' = 'within';
      if (currentPlan) {
        const weeklyLimit = getCategoryWeeklyLimit(currentPlan, categoryId);
        if (weeklyLimit > 0) {
          const ratio = input.amount / weeklyLimit;
          if (input.spendType === 'fixed') boundary = 'within';
          else if (input.spendType === 'living') boundary = ratio <= 1.0 ? 'within' : ratio <= 1.5 ? 'similar' : 'outside';
          else boundary = ratio <= 0.8 ? 'within' : ratio <= 1.2 ? 'similar' : 'outside';
        }
      }

      await saveCheckIn({
        uid: user.uid,
        weekId,
        categoryId,
        amount: input.amount,
        spendType: input.spendType,
        emotionTag: input.emotionTag ?? null,
        memo: input.memo,
        boundary,
      });
      return true;
    } catch (e: any) {
      setError(e?.message ?? '기록 저장에 실패했어요');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [user?.uid, currentPlan]);

  return { isSubmitting, error, submit };
}
