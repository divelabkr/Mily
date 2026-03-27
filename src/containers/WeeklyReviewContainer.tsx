// WeeklyReviewContainer.tsx — 주간 회고 컨테이너
import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../engines/auth/authStore';
import { usePlanStore } from '../engines/plan/planStore';
import { useCheckInStore } from '../engines/checkin/checkinStore';
import { generateReview } from '../engines/review/reviewService';
import { getWeekId } from '../utils/dateUtils';
import { WeeklyReviewScreen } from '../screens/review/WeeklyReviewScreen';
import { SkeletonList } from '../components/ui/SkeletonCard';
import { ErrorCard } from '../components/ui/ErrorCard';

export function WeeklyReviewContainer() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const currentPlan = usePlanStore((s) => s.currentPlan);
  const weeklyCheckIns = useCheckInStore((s) => s.weeklyCheckIns);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [review, setReview] = useState<{ highlight: string; curious: string; nextStep: string } | null>(null);

  const weekId = getWeekId(new Date());

  useEffect(() => {
    async function load() {
      if (!user?.uid) return;
      setLoading(true);
      try {
        const result = await generateReview(user.uid, weekId, weeklyCheckIns, currentPlan);
        if (result) {
          setReview({
            highlight: result.highlight ?? '이번 주 기록을 잘 남겼어요',
            curious: result.curious ?? '다음 주에는 어떤 변화가 있을까요?',
            nextStep: result.nextStep ?? '작은 습관 하나를 이어가봐요',
          });
        }
      } catch (e: any) {
        setError(e?.message ?? '회고를 불러오지 못했어요');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user?.uid, weekId]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FAF7F2', padding: 16, paddingTop: 60 }}>
        <SkeletonList count={3} />
      </View>
    );
  }

  if (error || !review) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FAF7F2', justifyContent: 'center', padding: 24 }}>
        <ErrorCard message={error ?? '회고 데이터를 준비 중이에요'} onRetry={() => {}} />
      </View>
    );
  }

  return (
    <WeeklyReviewScreen
      weekId={weekId}
      aiReview={review}
      weeklyPromise={currentPlan?.weeklyPromise ?? undefined}
      onComplete={(kept) => router.back()}
      onClose={() => router.back()}
    />
  );
}
