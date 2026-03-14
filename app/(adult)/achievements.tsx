import React, { useEffect, useState } from 'react';
import {
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAchievementStore } from '../../src/engines/achievement/achievementStore';
import { ACHIEVEMENTS } from '../../src/engines/achievement/achievementDefinitions';
import {
  Achievement,
  AchievementCategory,
  AchievementRarity,
} from '../../src/engines/achievement/achievementTypes';
import { theme } from '../../src/ui/theme';

// ──────────────────────────────────────────────
// 업적 도감 화면
// CLAUDE.md §21: 카테고리 탭 + 해금/미해금 + 히든 "???"
// ──────────────────────────────────────────────

const CATEGORY_LABELS: Record<AchievementCategory, string> = {
  record: '기록',
  plan: '계획',
  review: '회고',
  family: '가족',
  time: '시간',
  quirky: '엉뚱',
  badge: '뱃지',
  milestone: '마일스톤',
  season: '시즌',
};

const RARITY_COLORS: Record<AchievementRarity, string> = {
  common: '#B0B0B0',
  uncommon: '#6ABF69',
  rare: '#4A90D9',
  epic: '#9B59B6',
  hidden: '#F4C542',
};

const ALL_CATEGORIES = Object.keys(CATEGORY_LABELS) as AchievementCategory[];

export default function AchievementsScreen() {
  const { userAchievements, statsMap } = useAchievementStore();
  const [selectedCategory, setSelectedCategory] = useState<AchievementCategory | 'all'>('all');

  const unlockedIds = new Set(userAchievements.map((ua) => ua.achievementId));

  const filtered =
    selectedCategory === 'all'
      ? ACHIEVEMENTS
      : ACHIEVEMENTS.filter((a) => a.category === selectedCategory);

  const unlocked = filtered.filter((a) => unlockedIds.has(a.id));
  const locked = filtered.filter((a) => !unlockedIds.has(a.id));

  // 해금 순으로 정렬
  const sortedUnlocked = [...unlocked].sort((a, b) => {
    const ua = userAchievements.find((u) => u.achievementId === a.id);
    const ub = userAchievements.find((u) => u.achievementId === b.id);
    return (ub?.unlockedAt ?? 0) - (ua?.unlockedAt ?? 0);
  });

  const displayList: Achievement[] = [...sortedUnlocked, ...locked];

  function renderItem({ item }: { item: Achievement }) {
    const isUnlocked = unlockedIds.has(item.id);
    const ua = userAchievements.find((u) => u.achievementId === item.id);
    const stats = statsMap[item.id];
    const rarityColor = RARITY_COLORS[item.rarity];

    // 히든 미해금 → "???" 처리
    const showHidden = item.isHidden && !isUnlocked;

    return (
      <View style={[styles.card, !isUnlocked && styles.cardLocked]}>
        <View style={[styles.rarityDot, { backgroundColor: rarityColor }]} />

        <View style={styles.cardBody}>
          <Text style={[styles.cardTitle, !isUnlocked && styles.textDim]}>
            {showHidden ? '???' : item.title}
          </Text>
          <Text style={[styles.cardDesc, !isUnlocked && styles.textDim]}>
            {showHidden
              ? '이 업적은 아직 숨겨져 있어요.'
              : isUnlocked
              ? item.description
              : item.hint ?? '조건을 달성해보세요.'}
          </Text>

          {isUnlocked && ua && (
            <Text style={styles.unlockedAt}>
              {new Date(ua.unlockedAt).toLocaleDateString('ko-KR')} 해금
            </Text>
          )}

          {isUnlocked && stats && (
            <Text style={styles.unlockRate}>
              {(stats.unlockRate * 100).toFixed(1)}%의 밀리 사용자가 발견했어요
            </Text>
          )}
        </View>

        {isUnlocked && (
          <Text style={styles.checkmark}>✓</Text>
        )}
      </View>
    );
  }

  const totalCount = ACHIEVEMENTS.length;
  const myCount = unlockedIds.size;

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>업적 도감</Text>
        <Text style={styles.headerCount}>
          {myCount} / {totalCount}
        </Text>
      </View>

      {/* 카테고리 탭 */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabScroll}
        contentContainerStyle={styles.tabContainer}
      >
        <TouchableOpacity
          style={[styles.tab, selectedCategory === 'all' && styles.tabActive]}
          onPress={() => setSelectedCategory('all')}
        >
          <Text style={[styles.tabText, selectedCategory === 'all' && styles.tabTextActive]}>
            전체
          </Text>
        </TouchableOpacity>
        {ALL_CATEGORIES.filter((c) =>
          ACHIEVEMENTS.some((a) => a.category === c)
        ).map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.tab, selectedCategory === cat && styles.tabActive]}
            onPress={() => setSelectedCategory(cat)}
          >
            <Text style={[styles.tabText, selectedCategory === cat && styles.tabTextActive]}>
              {CATEGORY_LABELS[cat]}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* 목록 */}
      <FlatList
        data={displayList}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  headerCount: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  tabScroll: {
    flexGrow: 0,
  },
  tabContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  tabActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  tabText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  list: {
    padding: 16,
    gap: 10,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.card,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cardLocked: {
    opacity: 0.5,
  },
  rarityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 4,
    flexShrink: 0,
  },
  cardBody: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 3,
  },
  cardDesc: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    lineHeight: 17,
  },
  textDim: {
    color: theme.colors.textSecondary,
  },
  unlockedAt: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  unlockRate: {
    fontSize: 11,
    color: theme.colors.primary,
    marginTop: 2,
  },
  checkmark: {
    fontSize: 16,
    color: theme.colors.success,
    fontWeight: '700',
  },
});
