// TriggerPicker.tsx — 체크인 트리거 4종 선택 카드
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { theme } from '../../ui/theme';

export type TriggerType = 'purposeful' | 'scheduled' | 'planned' | 'impulse';

export const TRIGGER_OPTIONS: {
  type: TriggerType;
  emoji: string;
  label: string;
  sub: string;
}[] = [
  { type: 'purposeful', emoji: '🎯', label: '목적이 있었어요', sub: '필요해서 샀어요' },
  { type: 'scheduled',  emoji: '📅', label: '정해진 날이었어요', sub: '약속이나 기념일' },
  { type: 'planned',    emoji: '📋', label: '계획했었어요', sub: '미리 생각해뒀어요' },
  { type: 'impulse',   emoji: '⚡', label: '그냥 샀어요', sub: '즉흥적으로' },
];

interface TriggerPickerProps {
  onSelect: (type: TriggerType) => void;
}

export function TriggerPicker({ onSelect }: TriggerPickerProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.question}>어떤 소비예요?</Text>
      {TRIGGER_OPTIONS.map((opt) => (
        <TouchableOpacity
          key={opt.type}
          style={styles.card}
          onPress={() => onSelect(opt.type)}
          activeOpacity={0.75}
          accessibilityRole="button"
          accessibilityLabel={opt.label}
        >
          <Text style={styles.emoji}>{opt.emoji}</Text>
          <View style={styles.textBlock}>
            <Text style={styles.label}>{opt.label}</Text>
            <Text style={styles.sub}>{opt.sub}</Text>
          </View>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 12,
  },
  question: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.milyColors.brownDark,
    marginBottom: 24,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.card,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    minHeight: 72,
  },
  emoji: {
    fontSize: 26,
    marginRight: 14,
  },
  textBlock: {
    flex: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.milyColors.brownDark,
    marginBottom: 2,
  },
  sub: {
    fontSize: 13,
    color: theme.milyColors.brownMid,
  },
  arrow: {
    fontSize: 22,
    color: theme.milyColors.brownLight,
    fontWeight: '300',
  },
});
