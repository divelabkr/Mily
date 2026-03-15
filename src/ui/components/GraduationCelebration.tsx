// ──────────────────────────────────────────────
// GraduationCelebration.tsx — 성년 전환 축하 모달
// 축하 + 제안형만. 판단/훈계 금지.
// "함께 해줘서 고마워요" 톤.
// ──────────────────────────────────────────────

import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { theme } from '../theme';

interface GraduationCelebrationProps {
  visible: boolean;
  onClose: () => void;
  achievementsUnlocked?: string[];
}

const ACHIEVEMENT_LABELS: Record<string, { title: string; emoji: string }> = {
  graduation_achieved: { title: '어른이 됐어요!', emoji: '🎓' },
  graduation_journey: { title: '함께한 시간', emoji: '🌳' },
  graduation_planner: { title: '내 예산, 내가 정해요', emoji: '📋' },
};

export function GraduationCelebration({
  visible,
  onClose,
  achievementsUnlocked = [],
}: GraduationCelebrationProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* 축하 헤더 */}
            <Text style={styles.emoji}>🎉</Text>
            <Text style={styles.title}>성년이 되셨네요!</Text>
            <Text style={styles.subtitle}>
              Mily와 함께한 시간이 앞으로도 도움이 되길 바라요.{'\n'}
              이제 내 예산을 직접 설계해볼까요?
            </Text>

            {/* 해금된 업적 목록 */}
            {achievementsUnlocked.length > 0 && (
              <View style={styles.achievementsSection}>
                <Text style={styles.achievementsTitle}>새 업적 해금!</Text>
                {achievementsUnlocked.map((id) => {
                  const info = ACHIEVEMENT_LABELS[id];
                  if (!info) return null;
                  return (
                    <View key={id} style={styles.achievementRow}>
                      <Text style={styles.achievementEmoji}>{info.emoji}</Text>
                      <Text style={styles.achievementTitle}>{info.title}</Text>
                    </View>
                  );
                })}
              </View>
            )}

            {/* 앞으로의 제안 (제안형만) */}
            <View style={styles.suggestionsSection}>
              <Text style={styles.suggestionItem}>
                💡 이번 달 예산을 새로 설정해볼까요?
              </Text>
              <Text style={styles.suggestionItem}>
                💡 선택소비 카테고리를 다시 정해볼까요?
              </Text>
            </View>
          </ScrollView>

          <TouchableOpacity
            style={styles.button}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="확인"
          >
            <Text style={styles.buttonText}>시작해볼게요!</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing[5],
  },
  sheet: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.card,
    padding: theme.spacing[6],
    width: '100%',
    maxHeight: '85%',
  },
  emoji: {
    fontSize: 48,
    textAlign: 'center',
    marginBottom: theme.spacing[3],
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginBottom: theme.spacing[3],
  },
  subtitle: {
    fontSize: 15,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: theme.spacing[5],
  },
  achievementsSection: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.card,
    padding: theme.spacing[4],
    marginBottom: theme.spacing[4],
  },
  achievementsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing[3],
  },
  achievementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[3],
    paddingVertical: theme.spacing[2],
  },
  achievementEmoji: {
    fontSize: 22,
  },
  achievementTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  suggestionsSection: {
    gap: theme.spacing[2],
    marginBottom: theme.spacing[5],
  },
  suggestionItem: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  button: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.button,
    paddingVertical: theme.spacing[4],
    alignItems: 'center',
    minHeight: 44,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
