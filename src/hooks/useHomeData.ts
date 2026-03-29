// useHomeData.ts — 홈 화면 데이터 페칭 훅
import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../engines/auth/authStore';
import { usePlanStore } from '../engines/plan/planStore';
import { useCheckInStore, getWeeklyChoiceTotal } from '../engines/checkin/checkinStore';

import { loadLatestPlan } from '../engines/plan/planService';
import { loadWeeklyCheckIns } from '../engines/checkin/checkinService';
import { detectCurrentOccasion, OCCASION_LABELS } from '../engines/income/cashGiftService';

interface HomeData {
  loading: boolean;
  error: string | null;
  weekBudget: number;
  weekSpent: number;
  passiveIncomeRatio: number;
  promiseStage: 1 | 2 | 3 | 4;
  aiCoaching: string | null;
  showCashGiftEvent: boolean;
  cashGiftOccasion: string | null;
}

export function useHomeData(): HomeData & { refresh: () => void } {
  const user = useAuthStore((s) => s.user);
  const currentPlan = usePlanStore((s) => s.currentPlan);
  const weeklyCheckIns = useCheckInStore((s) => s.weeklyCheckIns);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!user?.uid) return;
    setLoading(true);
    setError(null);
    try {
      await Promise.all([
        loadLatestPlan(user.uid),
        loadWeeklyCheckIns(user.uid),
      ]);
    } catch (e: any) {
      setError(e?.message ?? '데이터를 불러오지 못했어요');
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const weekBudget = currentPlan ? Math.round(currentPlan.totalBudget / 4) : 0;
  const weekSpent = getWeeklyChoiceTotal(weeklyCheckIns);

  // 명절 감지
  const occasion = detectCurrentOccasion();
  const showCashGiftEvent = occasion !== null;
  const cashGiftOccasion = occasion ? OCCASION_LABELS[occasion] : null;

  return {
    loading,
    error,
    weekBudget,
    weekSpent,
    passiveIncomeRatio: 0, // TODO: cashFlowEngine 연동
    promiseStage: 1,       // TODO: trustScoreService 연동
    aiCoaching: null,      // TODO: messageService 연동
    showCashGiftEvent,
    cashGiftOccasion,
    refresh: fetchData,
  };
}
