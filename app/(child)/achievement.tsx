// app/(child)/achievement.tsx
import React from 'react';
import { View } from 'react-native';
import { useAchievementStore } from '../../src/engines/achievement/achievementStore';
import { ACHIEVEMENTS } from '../../src/engines/achievement/achievementDefinitions';
import { AchievementScreen } from '../../src/screens/achievement/AchievementScreen';
import { EmptyState } from '../../src/components/ui/EmptyState';

export default function ChildAchievementRoute() {
  const userAchievements = useAchievementStore((s) => s.userAchievements ?? []);
  const statsMap = useAchievementStore((s) => s.statsMap);

  const achievements = ACHIEVEMENTS.map((a) => {
    const ua = userAchievements.find((u) => u.achievementId === a.id);
    return {
      ...a,
      unlockedAt: ua?.unlockedAt,
      isHiddenByUser: false,
      unlockRate: statsMap[a.id]?.unlockRate != null ? statsMap[a.id].unlockRate * 100 : undefined,
    };
  });

  if (userAchievements.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FAF7F2' }}>
        <EmptyState context="achievement" />
      </View>
    );
  }

  return <AchievementScreen achievements={achievements} />;
}
