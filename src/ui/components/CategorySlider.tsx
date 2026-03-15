// ──────────────────────────────────────────────
// CategorySlider.tsx — 역할별 예산 슬라이더
// isParentManaged 비활성화 + 자동 조정 토글 지원
// 기존 props (emoji, label, value, onChange) 하위 호환 유지
// ──────────────────────────────────────────────

import React, { useState } from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import { theme } from '../theme';
import type { Category } from '../../engines/plan/planTypes';
import { allocate, getRemaining, autoBalance } from '../../engines/plan/budgetAllocator';

// ──────────────────────────────────────────────
// 단일 슬라이더 (기존 API 하위 호환)
// ──────────────────────────────────────────────

interface CategorySliderProps {
  emoji: string;
  label: string;
  value: number; // 0~100
  onChange: (value: number) => void;
  disabled?: boolean;
  badgeLabel?: string; // "함께 정한 금액" 등
}

export function CategorySlider({
  emoji,
  label,
  value,
  onChange,
  disabled = false,
  badgeLabel,
}: CategorySliderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.labelRow}>
          <Text style={[styles.label, disabled && styles.labelDisabled]}>
            {emoji} {label}
          </Text>
          {badgeLabel && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{badgeLabel}</Text>
            </View>
          )}
        </View>
        <Text style={[styles.value, disabled && styles.valueDisabled]}>
          {Math.round(value)}%
        </Text>
      </View>
      <Slider
        style={styles.slider}
        minimumValue={0}
        maximumValue={100}
        step={1}
        value={value}
        onValueChange={disabled ? undefined : onChange}
        disabled={disabled}
        minimumTrackTintColor={
          disabled ? theme.colors.border : theme.colors.primary
        }
        maximumTrackTintColor={theme.colors.border}
        thumbTintColor={disabled ? theme.colors.border : theme.colors.primary}
      />
    </View>
  );
}

// ──────────────────────────────────────────────
// 전체 슬라이더 세트 (자동 조정 토글 포함)
// ──────────────────────────────────────────────

interface BudgetSliderSetProps {
  categories: Category[];
  onChange: (updated: Category[]) => void;
  totalBudget?: number; // 금액 표시용 (선택)
}

export function BudgetSliderSet({
  categories,
  onChange,
  totalBudget,
}: BudgetSliderSetProps) {
  const [autoAdjust, setAutoAdjust] = useState(true);

  const remaining = getRemaining(categories);
  const total = categories.reduce((s, c) => s + c.percentage, 0);
  const isOver = total > 100;

  const handleChange = (changedId: string, newValue: number) => {
    if (autoAdjust) {
      const updated = allocate(categories, changedId, newValue);
      onChange(updated);
    } else {
      const updated = categories.map((c) =>
        c.id === changedId ? { ...c, percentage: Math.round(newValue) } : c
      );
      onChange(updated);
    }
  };

  const handleAutoToggle = (value: boolean) => {
    setAutoAdjust(value);
    if (value) {
      const balanced = autoBalance(categories);
      onChange(balanced);
    }
  };

  return (
    <View>
      {/* 헤더: 총합 + 남은 배분 */}
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>예산 배분</Text>
        <Text style={[styles.summaryRemaining, isOver && styles.summaryOver]}>
          {isOver
            ? `초과 ${Math.abs(remaining)}%`
            : `남은 예산: ${remaining}%`}
        </Text>
      </View>

      {/* 프로그레스바 */}
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${Math.min(total, 100)}%`,
              backgroundColor: isOver
                ? theme.colors.warning
                : theme.colors.primary,
            },
          ]}
        />
      </View>

      {/* 자동 조정 토글 */}
      <View style={styles.autoRow}>
        <Text style={styles.autoLabel}>스마트 자동 조정</Text>
        <Switch
          value={autoAdjust}
          onValueChange={handleAutoToggle}
          trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
        />
      </View>

      {/* 슬라이더 목록 */}
      {categories.map((cat) => {
        const isManaged = cat.isParentManaged;
        const amountLabel =
          totalBudget
            ? `  ≈ ${Math.round((totalBudget * cat.percentage) / 100).toLocaleString()}원`
            : '';

        return (
          <CategorySlider
            key={cat.id}
            emoji={cat.icon}
            label={cat.name + amountLabel}
            value={cat.percentage}
            onChange={(v) => handleChange(cat.id, v)}
            disabled={isManaged}
            badgeLabel={isManaged ? '함께 정한 금액' : undefined}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing[3],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing[1],
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[2],
    flex: 1,
  },
  label: {
    fontSize: 15,
    color: theme.colors.textPrimary,
  },
  labelDisabled: {
    color: theme.colors.textSecondary,
  },
  value: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.primary,
    minWidth: 40,
    textAlign: 'right',
  },
  valueDisabled: {
    color: theme.colors.textSecondary,
  },
  slider: {
    width: '100%',
    height: 44,
  },
  badge: {
    backgroundColor: theme.colors.surface ?? '#F5F5F5',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  badgeText: {
    fontSize: 11,
    color: theme.colors.textSecondary,
  },
  // ── BudgetSliderSet ──
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing[2],
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  summaryRemaining: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  summaryOver: {
    color: theme.colors.warning,
  },
  progressTrack: {
    height: 6,
    backgroundColor: theme.colors.border,
    borderRadius: 3,
    marginBottom: theme.spacing[3],
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  autoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing[4],
    paddingVertical: theme.spacing[2],
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: theme.colors.border,
  },
  autoLabel: {
    fontSize: 14,
    color: theme.colors.textPrimary,
  },
});
