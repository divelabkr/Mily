import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { useAuthStore } from '../../src/engines/auth/authStore';
import {
  ECONOMIC_BADGES,
  useBadgeStore,
  loadUserBadges,
} from '../../src/engines/badge/badgeService';
import { EconomicBadge } from '../../src/engines/badge/badgeTypes';
import { theme } from '../../src/ui/theme';

// ──────────────────────────────────────────────
// 경제 개념 뱃지 도감 — 9칸 그리드
// CLAUDE.md §20: 수집이지 점수 아님
// ──────────────────────────────────────────────

export default function BadgesScreen() {
  const user = useAuthStore((s) => s.user);
  const { userBadges } = useBadgeStore();

  useEffect(() => {
    if (user?.uid) loadUserBadges(user.uid);
  }, [user?.uid]);

  const earnedIds = new Set(userBadges.map((b) => b.badgeId));
  const earnedCount = earnedIds.size;

  function renderBadge({ item }: { item: EconomicBadge }) {
    const isEarned = earnedIds.has(item.id);
    const earnedAt = userBadges.find((b) => b.badgeId === item.id)?.earnedAt;

    return (
      <View style={[styles.badgeCell, !isEarned && styles.badgeCellLocked]}>
        <View style={[styles.emojiCircle, !isEarned && styles.emojiCircleLocked]}>
          <Text style={[styles.emoji, !isEarned && styles.emojiLocked]}>
            {isEarned ? item.emoji : '?'}
          </Text>
        </View>

        <Text style={[styles.badgeLabel, !isEarned && styles.textDim]}>
          {isEarned ? item.label : '???'}
        </Text>

        {isEarned && (
          <Text style={styles.earnedDate}>
            {new Date(earnedAt!).toLocaleDateString('ko-KR', {
              month: 'short',
              day: 'numeric',
            })}
          </Text>
        )}

        {!isEarned && (
          <Text style={styles.hint} numberOfLines={2}>
            {item.triggerHint}
          </Text>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>경제 개념 뱃지</Text>
        <Text style={styles.headerCount}>{earnedCount} / 9</Text>
      </View>

      <Text style={styles.subtitle}>
        이해한 경제 개념의 흔적을 모아요. 점수가 아니에요.
      </Text>

      {/* 3열 그리드 */}
      <FlatList
        data={ECONOMIC_BADGES}
        keyExtractor={(item) => item.id}
        renderItem={renderBadge}
        numColumns={3}
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
        columnWrapperStyle={styles.row}
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
    paddingBottom: 4,
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
  subtitle: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    paddingHorizontal: 20,
    marginBottom: 20,
    lineHeight: 18,
  },
  grid: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  badgeCell: {
    width: '31%',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.card,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    minHeight: 120,
  },
  badgeCellLocked: {
    opacity: 0.55,
  },
  emojiCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EEF4FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emojiCircleLocked: {
    backgroundColor: '#F0F0F0',
  },
  emoji: {
    fontSize: 24,
  },
  emojiLocked: {
    fontSize: 18,
    color: '#B0B0B0',
  },
  badgeLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 4,
    textAlign: 'center',
  },
  textDim: {
    color: theme.colors.textSecondary,
  },
  earnedDate: {
    fontSize: 10,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  hint: {
    fontSize: 9,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 13,
    marginTop: 2,
  },
});
