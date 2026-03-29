// AchievementScreen.tsx — 업적 도감 (3열 그리드)
// 달성/미달성/숨김 탭
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView,
} from 'react-native';
import { theme } from '../../ui/theme';
import { Achievement } from '../../engines/achievement/achievementTypes';

type AchievementFilter = 'all' | 'unlocked' | 'locked' | 'hidden';

interface AchievementWithStatus extends Achievement {
  unlockedAt?: number;
  isHiddenByUser?: boolean;
  unlockRate?: number;
}

interface AchievementScreenProps {
  achievements: AchievementWithStatus[];
  onSelect?: (id: string) => void;
}

const RARITY_COLORS = {
  common:   '#B5A096',
  uncommon: '#4CAF8C',
  rare:     '#4A6FA5',
  epic:     '#9C27B0',
  hidden:   '#C9A96E',
};

const FILTER_TABS: { key: AchievementFilter; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'unlocked', label: '달성' },
  { key: 'locked', label: '미달성' },
  { key: 'hidden', label: '숨김' },
];

function AchievementCell({ achievement, onPress }: { achievement: AchievementWithStatus; onPress: () => void }) {
  const isUnlocked = !!achievement.unlockedAt;
  const isHidden = achievement.isHidden && !isUnlocked;
  const rarityColor = RARITY_COLORS[achievement.rarity] ?? RARITY_COLORS.common;

  return (
    <TouchableOpacity style={[styles.cell, !isUnlocked && styles.cellLocked]} onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.cellIcon, { borderColor: rarityColor }]}>
        <Text style={[styles.cellEmoji, !isUnlocked && styles.cellEmojiLocked]}>
          {isHidden ? '???' : '🏆'}
        </Text>
      </View>
      <Text style={[styles.cellTitle, !isUnlocked && styles.cellTitleLocked]} numberOfLines={2}>
        {isHidden ? '???' : achievement.title}
      </Text>
      {isUnlocked && achievement.unlockRate != null && (
        <Text style={styles.cellRate}>{achievement.unlockRate.toFixed(1)}%</Text>
      )}
    </TouchableOpacity>
  );
}

export function AchievementScreen({ achievements, onSelect }: AchievementScreenProps) {
  const [filter, setFilter] = useState<AchievementFilter>('all');

  const filtered = achievements.filter((a) => {
    if (filter === 'all') return !a.isHiddenByUser;
    if (filter === 'unlocked') return !!a.unlockedAt && !a.isHiddenByUser;
    if (filter === 'locked') return !a.unlockedAt && !a.isHiddenByUser;
    if (filter === 'hidden') return !!a.isHiddenByUser;
    return true;
  });

  const unlockedCount = achievements.filter((a) => !!a.unlockedAt).length;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>업적 도감</Text>
        <Text style={styles.count}>{unlockedCount} / {achievements.length}</Text>
      </View>

      <View style={styles.filterRow}>
        {FILTER_TABS.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[styles.filterTab, filter === t.key && styles.filterTabActive]}
            onPress={() => setFilter(t.key)}
          >
            <Text style={[styles.filterText, filter === t.key && styles.filterTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
        {filtered.map((a) => (
          <AchievementCell
            key={a.id}
            achievement={a}
            onPress={() => onSelect?.(a.id)}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.milyColors.cream },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  title: { fontSize: 22, fontWeight: '700', color: theme.milyColors.brownDark },
  count: { fontSize: 14, color: theme.milyColors.brownMid },
  filterRow: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 12, gap: 8 },
  filterTab: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: theme.milyColors.surface2 },
  filterTabActive: { backgroundColor: theme.milyColors.coral },
  filterText: { fontSize: 13, color: theme.milyColors.brownMid, fontWeight: '500' },
  filterTextActive: { color: '#fff' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 8, paddingBottom: 24 },
  cell: { width: '30%', backgroundColor: '#fff', borderRadius: theme.borderRadius.card, padding: 12, alignItems: 'center' },
  cellLocked: { opacity: 0.5 },
  cellIcon: { width: 48, height: 48, borderRadius: 24, borderWidth: 2, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  cellEmoji: { fontSize: 22 },
  cellEmojiLocked: { opacity: 0.4 },
  cellTitle: { fontSize: 11, fontWeight: '500', color: theme.milyColors.brownDark, textAlign: 'center', lineHeight: 14 },
  cellTitleLocked: { color: theme.milyColors.brownLight },
  cellRate: { fontSize: 10, color: theme.milyColors.brownMid, marginTop: 2 },
});
