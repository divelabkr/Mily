// ──────────────────────────────────────────────
// StepCategorySlider.tsx — Step 2: 카테고리별 비율 배분
// BudgetSliderSet 재사용
// ──────────────────────────────────────────────

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../theme';
import { BudgetSliderSet } from '../CategorySlider';
import { formatCurrency } from '../../../utils/formatCurrency';
import type { Category } from '../../../engines/plan/planTypes';

interface StepCategorySliderProps {
  totalAmount: number;
  categories: Category[];
  onChange: (updated: Category[]) => void;
}

export function StepCategorySlider({
  totalAmount,
  categories,
  onChange,
}: StepCategorySliderProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.stepLabel}>2 / 3</Text>
      <Text style={styles.title}>어디에 썼나요?</Text>
      <Text style={styles.totalBadge}>총 {formatCurrency(totalAmount)}</Text>

      <BudgetSliderSet
        categories={categories}
        onChange={onChange}
        totalBudget={totalAmount}
      />

      <Text style={styles.hint}>비율을 대략 맞춰도 괜찮아요.</Text>
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
    marginBottom: theme.spacing[2],
    textAlign: 'center',
  },
  totalBadge: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.primary,
    textAlign: 'center',
    marginBottom: theme.spacing[5],
  },
  hint: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing[3],
  },
});
