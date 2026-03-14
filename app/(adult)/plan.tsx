import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ScreenLayout } from '../../src/ui/layouts/ScreenLayout';
import { Button } from '../../src/ui/components/Button';
import { Card } from '../../src/ui/components/Card';
import { CategorySlider } from '../../src/ui/components/CategorySlider';
import { theme } from '../../src/ui/theme';
import { usePlanStore } from '../../src/engines/plan/planStore';
import { DEFAULT_CATEGORIES } from '../../src/engines/plan/defaultCategories';
import {
  normalizeCategoryPercents,
  savePlan,
} from '../../src/engines/plan/planService';
import { formatCurrency } from '../../src/utils/formatCurrency';

export default function PlanScreen() {
  const { t } = useTranslation();
  const plan = usePlanStore((s) => s.currentPlan);
  const setTotalBudget = usePlanStore((s) => s.setTotalBudget);
  const updateCategoryPercent = usePlanStore((s) => s.updateCategoryPercent);

  const setWeeklyPromise = usePlanStore((s) => s.setWeeklyPromise);

  const [editingBudget, setEditingBudget] = useState(false);
  const [budgetText, setBudgetText] = useState(
    plan?.totalBudget.toString() ?? ''
  );
  const [promiseText, setPromiseText] = useState(plan?.weeklyPromise ?? '');

  if (!plan) {
    return (
      <ScreenLayout>
        <View style={styles.container}>
          <Text style={styles.title}>{t('plan_title')}</Text>
          <Text style={styles.empty}>{t('empty_home_no_plan')}</Text>
        </View>
      </ScreenLayout>
    );
  }

  const totalPercent = plan.categories.reduce((sum, c) => sum + c.percent, 0);

  const handleBudgetSave = () => {
    const num = parseInt(budgetText, 10);
    if (num > 0) {
      setTotalBudget(num);
    }
    setEditingBudget(false);
  };

  const handleNormalize = () => {
    const normalized = normalizeCategoryPercents(plan.categories);
    normalized.forEach((c) => updateCategoryPercent(c.categoryId, c.percent));
  };

  const handleSave = async () => {
    if (totalPercent !== 100) {
      handleNormalize();
    }
    setWeeklyPromise(promiseText.trim() || null);
    await savePlan(usePlanStore.getState().currentPlan!);
  };

  return (
    <ScreenLayout>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{t('plan_title')}</Text>

        <Card style={styles.card}>
          <Text style={styles.label}>{t('plan_monthly_budget')}</Text>
          {editingBudget ? (
            <View style={styles.budgetEdit}>
              <TextInput
                style={styles.input}
                value={budgetText}
                onChangeText={setBudgetText}
                keyboardType="numeric"
                autoFocus
              />
              <Button
                title={t('common_save')}
                onPress={handleBudgetSave}
                style={styles.saveBtn}
              />
            </View>
          ) : (
            <Text
              style={styles.budgetValue}
              onPress={() => setEditingBudget(true)}
            >
              {formatCurrency(plan.totalBudget)}
            </Text>
          )}
        </Card>

        <Card style={styles.card}>
          <Text style={styles.label}>{t('plan_weekly_category')}</Text>
          {plan.categories.map((cat) => {
            const info = DEFAULT_CATEGORIES.find(
              (d) => d.id === cat.categoryId
            );
            if (!info) return null;
            return (
              <CategorySlider
                key={cat.categoryId}
                emoji={info.emoji}
                label={info.label}
                value={cat.percent}
                onChange={(v) =>
                  updateCategoryPercent(cat.categoryId, Math.round(v))
                }
              />
            );
          })}
          <Text
            style={[
              styles.total,
              totalPercent !== 100 && styles.totalWarning,
            ]}
          >
            {t('plan_total_percent')}: {totalPercent}%
          </Text>
        </Card>
        <Card style={styles.card}>
          <Text style={styles.label}>{t('plan_weekly_promise_label')}</Text>
          <TextInput
            style={styles.promiseInput}
            placeholder={t('plan_weekly_promise_placeholder')}
            placeholderTextColor={theme.colors.textSecondary}
            value={promiseText}
            onChangeText={setPromiseText}
            maxLength={40}
            returnKeyType="done"
            accessibilityLabel={t('plan_weekly_promise_label')}
          />
          {promiseText.length > 0 && (
            <Text style={styles.promiseHint}>{t('plan_weekly_promise_hint')}</Text>
          )}
        </Card>
      </ScrollView>

      <View style={styles.footer}>
        <Button title={t('plan_adjust_next_week')} onPress={handleSave} />
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: theme.spacing[6],
  },
  scroll: {
    flex: 1,
    paddingTop: theme.spacing[6],
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing[5],
  },
  empty: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  card: {
    marginBottom: theme.spacing[4],
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing[3],
  },
  budgetEdit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[2],
  },
  input: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.input,
    paddingHorizontal: theme.spacing[3],
    fontSize: 16,
    color: theme.colors.textPrimary,
  },
  saveBtn: {
    minWidth: 60,
  },
  budgetValue: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  total: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary,
    textAlign: 'right',
    marginTop: theme.spacing[2],
  },
  totalWarning: {
    color: theme.colors.warning,
  },
  promiseInput: {
    height: 44,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.input,
    paddingHorizontal: theme.spacing[3],
    fontSize: 15,
    color: theme.colors.textPrimary,
    backgroundColor: theme.colors.surface,
  },
  promiseHint: {
    fontSize: 12,
    color: theme.colors.secondary,
    marginTop: theme.spacing[2],
  },
  footer: {
    paddingVertical: theme.spacing[4],
  },
});
