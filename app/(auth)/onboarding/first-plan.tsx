import React, { useState } from 'react';
import {
  View, Text, TextInput, ScrollView, StyleSheet, TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CategorySlider } from '../../../src/ui/components/CategorySlider';
import { theme } from '../../../src/ui/theme';
import { DEFAULT_CATEGORIES } from '../../../src/engines/plan/defaultCategories';
import {
  createDefaultAllocations,
  createNewPlan,
  normalizeCategoryPercents,
  savePlan,
} from '../../../src/engines/plan/planService';
import { useAuthStore } from '../../../src/engines/auth/authStore';
import { CategoryAllocation } from '../../../src/engines/plan/planStore';

const QUICK_BUDGETS = [
  { label: '30만', value: 300000 },
  { label: '50만', value: 500000 },
  { label: '100만', value: 1000000 },
  { label: '200만', value: 2000000 },
];

export default function FirstPlanScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const [budget, setBudget] = useState('');
  const [categories, setCategories] = useState<CategoryAllocation[]>(
    createDefaultAllocations()
  );

  const totalPercent = categories.reduce((sum, c) => sum + c.percent, 0);

  const handleCategoryChange = (categoryId: string, value: number) => {
    setCategories((prev) =>
      prev.map((c) =>
        c.categoryId === categoryId ? { ...c, percent: Math.round(value) } : c
      )
    );
  };

  const handleQuickBudget = (value: number) => {
    setBudget(String(value));
  };

  const handleDone = async () => {
    const budgetNum = parseInt(budget, 10);
    if (!budgetNum || !user) return;
    const normalized = normalizeCategoryPercents(categories);
    const plan = createNewPlan(user.uid, budgetNum);
    plan.categories = normalized;
    await savePlan(plan);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    router.push('/(auth)/onboarding/ready' as any);
  };

  const handleSkip = async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    router.push('/(auth)/onboarding/ready' as any);
  };

  const budgetNum = parseInt(budget, 10);
  const isValid = !isNaN(budgetNum) && budgetNum > 0;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>{t('onboarding_plan_title')}</Text>

        {/* 큰 숫자 예산 입력 */}
        <View style={styles.budgetArea}>
          <Text style={styles.budgetLabel}>{t('onboarding_plan_budget_label')}</Text>
          <View style={styles.budgetInputRow}>
            <TextInput
              style={styles.budgetInput}
              placeholder="0"
              placeholderTextColor={theme.milyColors.brownLight}
              value={budget ? Number(budget).toLocaleString() : ''}
              onChangeText={(text) => {
                const raw = text.replace(/,/g, '');
                if (/^\d*$/.test(raw)) setBudget(raw);
              }}
              keyboardType="numeric"
              autoFocus
            />
            <Text style={styles.budgetWon}>원</Text>
          </View>

          {/* 빠른 선택 칩 */}
          <View style={styles.quickChips}>
            {QUICK_BUDGETS.map((q) => (
              <TouchableOpacity
                key={q.value}
                style={[
                  styles.quickChip,
                  budget === String(q.value) && styles.quickChipSelected,
                ]}
                onPress={() => handleQuickBudget(q.value)}
                activeOpacity={0.75}
              >
                <Text
                  style={[
                    styles.quickChipText,
                    budget === String(q.value) && styles.quickChipTextSelected,
                  ]}
                >
                  {q.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 카테고리 슬라이더 */}
        <Text style={styles.sectionLabel}>{t('plan_weekly_category')}</Text>
        {categories.map((cat) => {
          const info = DEFAULT_CATEGORIES.find((d) => d.id === cat.categoryId);
          if (!info) return null;
          return (
            <CategorySlider
              key={cat.categoryId}
              emoji={info.emoji}
              label={info.label}
              value={cat.percent}
              onChange={(v) => handleCategoryChange(cat.categoryId, v)}
            />
          );
        })}

        <Text style={styles.totalPercent}>
          합계: {totalPercent}%
        </Text>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.doneButton, !isValid && styles.doneButtonDisabled]}
          onPress={handleDone}
          disabled={!isValid}
          activeOpacity={0.85}
        >
          <Text style={styles.doneButtonText}>{t('onboarding_plan_done')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleSkip}
          activeOpacity={0.7}
        >
          <Text style={styles.skipButtonText}>{t('onboarding_plan_skip')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.milyColors.cream,
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.milyColors.brownDark,
    marginBottom: 28,
  },
  budgetArea: {
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  budgetLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.milyColors.brownMid,
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  budgetInputRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 16,
  },
  budgetInput: {
    fontSize: 38,
    fontWeight: '700',
    color: theme.milyColors.brownDark,
    flex: 1,
    padding: 0,
  },
  budgetWon: {
    fontSize: 22,
    fontWeight: '600',
    color: theme.milyColors.brownMid,
    marginLeft: 6,
  },
  quickChips: {
    flexDirection: 'row',
    gap: 8,
  },
  quickChip: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  quickChipSelected: {
    borderColor: theme.milyColors.coral,
    backgroundColor: '#FFF0ED',
  },
  quickChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.milyColors.brownMid,
  },
  quickChipTextSelected: {
    color: theme.milyColors.coral,
    fontWeight: '700',
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.milyColors.brownMid,
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  totalPercent: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.milyColors.coral,
    textAlign: 'right',
    marginTop: 8,
    marginBottom: 8,
  },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 10,
    backgroundColor: theme.milyColors.cream,
  },
  doneButton: {
    height: 52,
    borderRadius: theme.borderRadius.button,
    backgroundColor: theme.milyColors.coral,
    justifyContent: 'center',
    alignItems: 'center',
  },
  doneButtonDisabled: { opacity: 0.4 },
  doneButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  skipButton: {
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: 15,
    color: theme.milyColors.brownMid,
  },
});
