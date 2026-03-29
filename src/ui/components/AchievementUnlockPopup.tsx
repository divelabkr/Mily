import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Achievement, AchievementRarity } from '../../engines/achievement/achievementTypes';
import { useAchievementStore } from '../../engines/achievement/achievementStore';
import { theme } from '../theme';

// ──────────────────────────────────────────────
// 해금 팝업 컴포넌트
// CLAUDE.md §21: 체크인/회고 완료 후 하단 슬라이드, 3초 자동 사라짐
// ──────────────────────────────────────────────

const RARITY_COLORS: Record<AchievementRarity, string> = {
  common: '#B0B0B0',    // ⚪ 일상
  uncommon: '#6ABF69',  // 🟢 발견
  rare: '#4A90D9',      // 🔵 도전
  epic: '#9B59B6',      // 🟣 전설
  hidden: '#F4C542',    // 🟡 히든
};

const RARITY_LABELS: Record<AchievementRarity, string> = {
  common: '일상',
  uncommon: '발견',
  rare: '도전',
  epic: '전설',
  hidden: '히든',
};

interface Props {
  achievement: Achievement;
  unlockRate?: string | null; // "3.2%의 밀리 사용자가 발견했어요" 또는 null
  onShare?: () => void;
  onDismiss?: () => void;
}

export function AchievementUnlockPopup({
  achievement,
  unlockRate,
  onShare,
  onDismiss,
}: Props) {
  const translateY = useRef(new Animated.Value(200)).current;
  const setPendingUnlock = useAchievementStore((s) => s.setPendingUnlock);

  const rarityColor = RARITY_COLORS[achievement.rarity];

  const dismiss = () => {
    Animated.timing(translateY, {
      toValue: 200,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setPendingUnlock(null);
      onDismiss?.();
    });
  };

  useEffect(() => {
    // 슬라이드 업
    Animated.spring(translateY, {
      toValue: 0,
      useNativeDriver: true,
      tension: 80,
      friction: 10,
    }).start();

    // 3초 후 자동 사라짐
    const timer = setTimeout(dismiss, 3000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Animated.View
      style={[styles.container, { transform: [{ translateY }] }]}
    >
      <View style={[styles.rarityBar, { backgroundColor: rarityColor }]} />

      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.trophy}>🏆</Text>
          <View>
            <Text style={styles.title}>{achievement.title}</Text>
            <Text style={[styles.rarityLabel, { color: rarityColor }]}>
              {RARITY_LABELS[achievement.rarity]}
            </Text>
          </View>
        </View>

        <Text style={styles.description}>{achievement.description}</Text>

        {unlockRate && (
          <Text style={styles.unlockRate}>{unlockRate}</Text>
        )}

        <View style={styles.actions}>
          <TouchableOpacity style={styles.shareBtn} onPress={onShare ?? dismiss}>
            <Text style={styles.shareBtnText}>공유하기</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.privateBtn} onPress={dismiss}>
            <Text style={styles.privateBtnText}>나만 보기</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.card,
    elevation: 8,
    overflow: 'hidden',
    ...Platform.select({
      web: { boxShadow: '0px -2px 8px rgba(0,0,0,0.12)' },
      default: { shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.12, shadowRadius: 8 },
    }),
  },
  rarityBar: {
    height: 4,
    width: '100%',
  },
  content: {
    padding: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  trophy: {
    fontSize: 28,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  rarityLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  description: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginBottom: 6,
  },
  unlockRate: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginBottom: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  shareBtn: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.button,
    paddingVertical: 10,
    alignItems: 'center',
  },
  shareBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  privateBtn: {
    flex: 1,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.button,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  privateBtnText: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
});
