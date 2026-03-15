// ──────────────────────────────────────────────
// StepMoodMemo.tsx — Step 3: 오늘 기분 + 메모
// ──────────────────────────────────────────────

import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { theme } from '../../theme';
import type { EmotionTag } from '../../../engines/checkin/checkinStore';

const MOOD_OPTIONS: { tag: EmotionTag; emoji: string; label: string }[] = [
  { tag: 'reward', emoji: '😊', label: '기분 좋았어요' },
  { tag: 'social', emoji: '👫', label: '같이 써서요' },
  { tag: 'stress', emoji: '😮‍💨', label: '스트레스 받았어요' },
  { tag: 'impulse', emoji: '⚡', label: '충동적이었어요' },
];

interface StepMoodMemoProps {
  mood: EmotionTag | null;
  memo: string;
  onMoodChange: (mood: EmotionTag | null) => void;
  onMemoChange: (memo: string) => void;
  weeklyPromise?: string | null;
}

export function StepMoodMemo({
  mood,
  memo,
  onMoodChange,
  onMemoChange,
  weeklyPromise,
}: StepMoodMemoProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.stepLabel}>3 / 3</Text>
      <Text style={styles.title}>오늘 소비 기분은요?</Text>
      <Text style={styles.subtitle}>건너뛰어도 괜찮아요.</Text>

      {!!weeklyPromise && (
        <View style={styles.promiseBanner}>
          <Text style={styles.promiseBannerLabel}>이번 주 약속</Text>
          <Text style={styles.promiseBannerText}>{weeklyPromise}</Text>
        </View>
      )}

      <View style={styles.moodGrid}>
        {MOOD_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.tag}
            style={[
              styles.moodChip,
              mood === opt.tag && styles.moodChipSelected,
            ]}
            onPress={() => onMoodChange(mood === opt.tag ? null : opt.tag)}
            accessibilityLabel={opt.label}
            accessibilityRole="button"
            accessibilityState={{ selected: mood === opt.tag }}
          >
            <Text style={styles.moodEmoji}>{opt.emoji}</Text>
            <Text
              style={[
                styles.moodLabel,
                mood === opt.tag && styles.moodLabelSelected,
              ]}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TextInput
        style={styles.memoInput}
        placeholder="오늘 하루 한 줄 메모 (선택)"
        placeholderTextColor={theme.colors.textSecondary}
        value={memo}
        onChangeText={onMemoChange}
        multiline
        maxLength={100}
        accessibilityLabel="오늘 메모"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: theme.spacing[6],
  },
  stepLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing[3],
    textAlign: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing[1],
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing[5],
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing[2],
    marginBottom: theme.spacing[5],
    justifyContent: 'center',
  },
  moodChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[1],
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[2],
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    minHeight: 44,
  },
  moodChipSelected: {
    borderColor: theme.colors.accent,
    backgroundColor: '#FEF3E5',
  },
  moodEmoji: {
    fontSize: 18,
  },
  moodLabel: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  moodLabelSelected: {
    color: theme.colors.textPrimary,
    fontWeight: '600',
  },
  memoInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.input,
    padding: theme.spacing[3],
    fontSize: 14,
    color: theme.colors.textPrimary,
    backgroundColor: theme.colors.surface,
    textAlignVertical: 'top',
    minHeight: 80,
  },
  promiseBanner: {
    backgroundColor: '#EDF2F9',
    borderRadius: theme.borderRadius.input,
    padding: theme.spacing[3],
    marginBottom: theme.spacing[4],
  },
  promiseBannerLabel: {
    fontSize: 11,
    color: theme.colors.primary,
    fontWeight: '600',
    marginBottom: 2,
  },
  promiseBannerText: {
    fontSize: 13,
    color: theme.colors.textPrimary,
  },
});
