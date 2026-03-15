// ──────────────────────────────────────────────
// StepTotalAmount.tsx — Step 1: 오늘 총 지출 입력
// ──────────────────────────────────────────────

import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { theme } from '../../theme';
import { formatCurrency } from '../../../utils/formatCurrency';

interface StepTotalAmountProps {
  value: string;
  onChange: (value: string) => void;
  todayPrevTotal?: number; // 이미 기록된 오늘 금액 (있으면 표시)
}

export function StepTotalAmount({
  value,
  onChange,
  todayPrevTotal = 0,
}: StepTotalAmountProps) {
  const parsed = parseInt(value, 10);
  const valid = !isNaN(parsed) && parsed > 0;

  return (
    <View style={styles.container}>
      <Text style={styles.stepLabel}>1 / 3</Text>
      <Text style={styles.title}>오늘 얼마 썼어요?</Text>

      {todayPrevTotal > 0 && (
        <Text style={styles.prevHint}>
          이미 기록된 금액: {formatCurrency(todayPrevTotal)}
        </Text>
      )}

      <TextInput
        style={[styles.input, valid && styles.inputValid]}
        placeholder="0"
        placeholderTextColor={theme.colors.textSecondary}
        value={value}
        onChangeText={onChange}
        keyboardType="numeric"
        autoFocus
        accessibilityLabel="오늘 지출 총액"
      />
      <Text style={styles.unit}>원</Text>

      <Text style={styles.hint}>선택소비 위주로 입력해도 괜찮아요.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingTop: theme.spacing[8],
  },
  stepLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing[3],
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing[6],
    textAlign: 'center',
  },
  prevHint: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing[4],
  },
  input: {
    fontSize: 44,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    textAlign: 'center',
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.border,
    minWidth: 160,
    paddingVertical: theme.spacing[2],
  },
  inputValid: {
    borderBottomColor: theme.colors.primary,
  },
  unit: {
    fontSize: 18,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing[2],
  },
  hint: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing[6],
    textAlign: 'center',
  },
});
