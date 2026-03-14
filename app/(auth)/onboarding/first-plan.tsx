import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScreenLayout } from '../../../src/ui/layouts/ScreenLayout';
import { Button } from '../../../src/ui/components/Button';
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
import { completeOnboarding } from '../../../src/engines/auth/authService';
import { CategoryAllocation } from '../../../src/engines/plan/planStore';

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

  const handleDone = async () => {
    const budgetNum = parseInt(budget, 10);
    if (!budgetNum || !user) return;

    const normalized = normalizeCategoryPercents(categories);
    const plan = createNewPlan(user.uid, budgetNum);
    plan.categories = normalized;
    await savePlan(plan);
    await completeOnboarding(user.uid);
    router.replace('/');
  };

  const handleSkip = async () => {
    if (user) await completeOnboarding(user.uid);
    router.replace('/');
  };

  return (
    <ScreenLayout>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{t('onboarding_plan_title')}</Text>

        <Text style={styles.label}>{t('onboarding_plan_budget_label')}</Text>
        <TextInput
          style={styles.input}
          placeholder={t('onboarding_plan_budget_placeholder')}
          placeholderTextColor={theme.colors.textSecondary}
          value={budget}
          onChangeText={setBudget}
          keyboardType="numeric"
        />

        <Text style={styles.label}>{t('plan_weekly_category')}</Text>
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

        <Text style={styles.total}>
          {t('plan_total_percent')}: {totalPercent}%
        </Text>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title={t('onboarding_plan_done')}
          onPress={handleDone}
          disabled={!budget || parseInt(budget, 10) <= 0}
        />
        <Button
          title={t('onboarding_plan_skip')}
          onPress={handleSkip}
          variant="outline"
          style={styles.skipButton}
        />
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    paddingTop: theme.spacing[6],
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing[6],
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing[2],
    marginTop: theme.spacing[4],
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.input,
    paddingHorizontal: theme.spacing[4],
    fontSize: 16,
    color: theme.colors.textPrimary,
    backgroundColor: theme.colors.surface,
  },
  total: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary,
    textAlign: 'right',
    marginTop: theme.spacing[3],
    marginBottom: theme.spacing[4],
  },
  footer: {
    paddingVertical: theme.spacing[4],
  },
  skipButton: {
    marginTop: theme.spacing[2],
  },
});
