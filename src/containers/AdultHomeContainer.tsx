// AdultHomeContainer.tsx — 성인 홈 컨테이너 (데이터 → 화면 연결)
import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../engines/auth/authStore';
import { useHomeData } from '../hooks/useHomeData';
import { AdultHomeScreen } from '../screens/home/AdultHomeScreen';
import { SkeletonList } from '../components/ui/SkeletonCard';
import { ErrorCard } from '../components/ui/ErrorCard';
import { EmptyState } from '../components/ui/EmptyState';

export function AdultHomeContainer() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const data = useHomeData();

  if (data.loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FAF7F2', padding: 16, paddingTop: 60 }}>
        <SkeletonList count={4} />
      </View>
    );
  }

  if (data.error) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FAF7F2', justifyContent: 'center', padding: 24 }}>
        <ErrorCard message={data.error} onRetry={data.refresh} />
      </View>
    );
  }

  const hasData = data.weekSpent > 0 || data.weekBudget > 0;

  return (
    <AdultHomeScreen
      userName={user?.displayName ?? ''}
      weekBudget={data.weekBudget}
      weekSpent={data.weekSpent}
      passiveIncomeRatio={data.passiveIncomeRatio}
      promiseStage={data.promiseStage}
      aiCoaching={data.aiCoaching ?? undefined}
      notifCount={0}
      showCashGiftEvent={data.showCashGiftEvent}
      cashGiftOccasion={data.cashGiftOccasion ?? undefined}
      onCheckin={() => router.push('/(adult)/checkin')}
      onReview={() => router.push('/(adult)/review')}
      onRequestCard={() => router.push('/(adult)/family')}
      onDreamStudio={() => router.push('/(adult)/dream' as any)}
      onNotif={() => {}}
      onMenu={() => {}}
      onCashGift={() => {}}
    />
  );
}
