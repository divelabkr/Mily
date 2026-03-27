// app/(child)/achievement.tsx
import React from 'react';
import { View } from 'react-native';
import { useAchievementStore } from '../../src/engines/achievement/achievementStore';
import { AchievementScreen } from '../../src/screens/achievement/AchievementScreen';
import { EmptyState } from '../../src/components/ui/EmptyState';

export default function ChildAchievementRoute() {
  const achievements = useAchievementStore((s) => s.userAchievements ?? []);

  if (achievements.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FAF7F2' }}>
        <EmptyState context="achievement" />
      </View>
    );
  }

  return <AchievementScreen achievements={achievements} />;
}
