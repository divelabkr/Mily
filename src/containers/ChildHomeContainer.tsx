// ChildHomeContainer.tsx — 자녀 홈 컨테이너
import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../engines/auth/authStore';
import { useHomeData } from '../hooks/useHomeData';
import { usePraiseCardStore } from '../engines/praiseCard/praiseCardStore';
import { ChildHomeScreen } from '../screens/home/ChildHomeScreen';
import { SkeletonList } from '../components/ui/SkeletonCard';
import { ErrorCard } from '../components/ui/ErrorCard';

export function ChildHomeContainer() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const data = useHomeData();
  const praiseCards = usePraiseCardStore((s) => s.cards);
  const unseenPraise = praiseCards.filter((c: any) => !c.seen).length;

  if (data.loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FAF7F2', padding: 16, paddingTop: 60 }}>
        <SkeletonList count={3} />
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

  return (
    <ChildHomeScreen
      displayName={user?.displayName ?? ''}
      weeklyBudget={data.weekBudget}
      weeklySpent={data.weekSpent}
      piggyBankAmount={0}
      goalTitle={undefined}
      goalProgress={0}
      coachingMessage={data.aiCoaching ?? undefined}
      pendingPraiseCount={unseenPraise}
      notifCount={0}
      onCheckin={() => router.push('/(child)/checkin' as any)}
      onRequestCard={() => router.push('/(child)/request')}
      onDreamStudio={() => router.push('/(child)/dream' as any)}
      onNotif={() => {}}
      onMenu={() => {}}
      onPraise={() => {}}
    />
  );
}
