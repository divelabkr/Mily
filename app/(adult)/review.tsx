import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScreenLayout } from '../../src/ui/layouts/ScreenLayout';
import { Card } from '../../src/ui/components/Card';
import { Button } from '../../src/ui/components/Button';
import { EmptyState } from '../../src/ui/components/EmptyState';
import { SmallWinCard } from '../../src/ui/components/SmallWinCard';
import { CategorySlider } from '../../src/ui/components/CategorySlider';
import { theme } from '../../src/ui/theme';
import { useCheckInStore } from '../../src/engines/checkin/checkinStore';
import { usePlanStore } from '../../src/engines/plan/planStore';
import {
  generateReview,
  saveReview,
  detectSmallWin,
} from '../../src/engines/review/reviewService';
import { savePlan, normalizeCategoryPercents } from '../../src/engines/plan/planService';
import { useAuthStore } from '../../src/engines/auth/authStore';
import { evaluatePaywallTrigger } from '../../src/engines/billing/paywallTriggers';
import { Events } from '../../src/engines/analytics/analyticsService';
import type { WeeklyReviewOutput } from '../../src/engines/ai/prompts/weeklyReview';
import { DEFAULT_CATEGORIES } from '../../src/engines/plan/defaultCategories';
import {
  getMonthlySnapshot,
  getPrevMonthId,
  getAdherenceSummary,
  type MonthlyReconcile,
} from '../../src/engines/review/reconcileService';
import { formatCurrency } from '../../src/utils/formatCurrency';

export default function ReviewScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const checkIns = useCheckInStore((s) => s.weeklyCheckIns);
  const plan = usePlanStore((s) => s.currentPlan);
  const updateCategoryPercent = usePlanStore((s) => s.updateCategoryPercent);

  const [review, setReview] = useState<WeeklyReviewOutput | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiUsed, setAiUsed] = useState(false);
  const [smallWin, setSmallWin] = useState<string | null>(null);
  const [promiseKept, setPromiseKept] = useState<boolean | null>(null);
  const [prevMonthReconcile, setPrevMonthReconcile] = useState<MonthlyReconcile | null>(null);

  // 이전 달 정산 스냅샷 로드 (월초에만 표시)
  useEffect(() => {
    if (!user) return;
    const today = new Date();
    if (today.getDate() <= 7) { // 월초 7일간 이전 달 정산 표시
      const prevMonthId = getPrevMonthId(today);
      getMonthlySnapshot(user.uid, prevMonthId)
        .then(setPrevMonthReconcile)
        .catch(() => {});
    }
  }, [user?.uid]);

  if (checkIns.length === 0) {
    return (
      <ScreenLayout>
        <View style={styles.container}>
          <Text style={styles.title}>{t('review_title')}</Text>
          <EmptyState message={t('empty_review_no_data')} />
        </View>
      </ScreenLayout>
    );
  }

  const handleGenerateReview = async () => {
    if (!plan || !user) return;
    setAiLoading(true);
    try {
      const result = await generateReview(user.uid, plan, checkIns);
      setReview(result);
      setAiUsed(true);
      const win = detectSmallWin(plan, checkIns);
      setSmallWin(win);
    } finally {
      setAiLoading(false);
    }
  };

  const handleDone = async () => {
    if (!user) return;
    const weekId = new Date().toISOString().slice(0, 10);
    if (review) {
      await saveReview(user.uid, review, aiUsed, promiseKept);
    }
    await Events.reviewCompleted(weekId, aiUsed, promiseKept);

    // 다음 주 조정 저장
    if (plan) {
      const normalized = normalizeCategoryPercents(plan.categories);
      normalized.forEach((c) =>
        updateCategoryPercent(c.categoryId, c.percent)
      );
      await savePlan(usePlanStore.getState().currentPlan!);
    }

    // 트리거 A: 4주차 회고 완료 → 페이월
    // TODO: completedWeekCount를 Firestore에서 조회
    const completedWeekCount = 4; // placeholder
    if (evaluatePaywallTrigger('week4_review', completedWeekCount)) {
      router.replace('/(adult)/paywall');
      return;
    }
    router.back();
  };

  return (
    <ScreenLayout>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{t('review_title')}</Text>

        {/* 이번 주 한 가지 약속 자가체크 */}
        {plan?.weeklyPromise && (
          <Card style={styles.card}>
            <Text style={styles.promiseTitle}>{t('review_promise_title')}</Text>
            <Text style={styles.promiseText}>{plan.weeklyPromise}</Text>
            <View style={styles.promiseButtons}>
              <TouchableOpacity
                style={[
                  styles.promiseBtn,
                  promiseKept === true && styles.promiseBtnKept,
                ]}
                onPress={() => setPromiseKept(true)}
                accessibilityRole="button"
                accessibilityState={{ selected: promiseKept === true }}
              >
                <Text
                  style={[
                    styles.promiseBtnLabel,
                    promiseKept === true && styles.promiseBtnLabelKept,
                  ]}
                >
                  {t('review_promise_kept')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.promiseBtn,
                  promiseKept === false && styles.promiseBtnNotKept,
                ]}
                onPress={() => setPromiseKept(false)}
                accessibilityRole="button"
                accessibilityState={{ selected: promiseKept === false }}
              >
                <Text
                  style={[
                    styles.promiseBtnLabel,
                    promiseKept === false && styles.promiseBtnLabelNotKept,
                  ]}
                >
                  {t('review_promise_not_kept')}
                </Text>
              </TouchableOpacity>
            </View>
            {promiseKept === false && (
              <Text style={styles.promiseRetry}>{t('review_promise_retry')}</Text>
            )}
          </Card>
        )}

        {!review && !aiLoading && (
          <Button
            title="AI 회고 보기"
            onPress={handleGenerateReview}
            style={styles.aiButton}
          />
        )}

        {aiLoading && (
          <View style={styles.loading}>
            <ActivityIndicator color={theme.colors.primary} />
            <Text style={styles.loadingText}>분석 중...</Text>
          </View>
        )}

        {review && (
          <Card style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.rowEmoji}>✅</Text>
              <View style={styles.rowContent}>
                <Text style={styles.rowLabel}>{t('review_good')}</Text>
                <Text style={styles.rowValue}>{review.good}</Text>
              </View>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowEmoji}>💸</Text>
              <View style={styles.rowContent}>
                <Text style={styles.rowLabel}>{t('review_leak')}</Text>
                <Text style={styles.rowValue}>{review.leak}</Text>
              </View>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowEmoji}>💡</Text>
              <View style={styles.rowContent}>
                <Text style={styles.rowLabel}>{t('review_suggestion')}</Text>
                <Text style={styles.rowValue}>{review.suggestion}</Text>
              </View>
            </View>
          </Card>
        )}

        {smallWin && <SmallWinCard message={smallWin} />}

        {plan && (
          <Card style={styles.card}>
            <Text style={styles.sliderTitle}>{t('review_adjust_slider')}</Text>
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
          </Card>
        )}
        {/* 이전 달 월간 정산 (월초 7일간 표시) */}
        {prevMonthReconcile && (
          <Card style={styles.card}>
            <Text style={styles.sliderTitle}>
              📊 {prevMonthReconcile.monthId} 월간 정산
            </Text>
            <Text style={styles.reconcileSummary}>
              {getAdherenceSummary(prevMonthReconcile)}
            </Text>
            <View style={styles.reconcileRow}>
              <Text style={styles.reconcileLabel}>계획</Text>
              <Text style={styles.reconcileValue}>
                {formatCurrency(prevMonthReconcile.totalPlanned)}
              </Text>
            </View>
            <View style={styles.reconcileRow}>
              <Text style={styles.reconcileLabel}>실제 지출</Text>
              <Text style={styles.reconcileValue}>
                {formatCurrency(prevMonthReconcile.totalActual)}
              </Text>
            </View>
            <View style={styles.reconcileRow}>
              <Text style={styles.reconcileLabel}>선택소비</Text>
              <Text style={[styles.reconcileValue, styles.reconcileChoiceValue]}>
                {formatCurrency(prevMonthReconcile.choiceActual)}
              </Text>
            </View>
            <View style={styles.reconcileRow}>
              <Text style={styles.reconcileLabel}>기록 수</Text>
              <Text style={styles.reconcileValue}>
                {prevMonthReconcile.checkInCount}건
              </Text>
            </View>
          </Card>
        )}

        {/* AI 면책 고지 — 하단 고정 */}
        {review && (
          <Text style={styles.aiDisclaimer}>
            AI 코치의 제안은 참고용이며 최종 결정은 사용자에게 있습니다.
          </Text>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Button title={t('review_done')} onPress={handleDone} />
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
  aiButton: {
    marginBottom: theme.spacing[4],
  },
  loading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing[3],
    paddingVertical: theme.spacing[5],
  },
  loadingText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  card: {
    marginBottom: theme.spacing[4],
  },
  row: {
    flexDirection: 'row',
    marginBottom: theme.spacing[4],
    gap: theme.spacing[3],
  },
  rowEmoji: {
    fontSize: 20,
    marginTop: 2,
  },
  rowContent: {
    flex: 1,
  },
  rowLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing[1],
  },
  rowValue: {
    fontSize: 15,
    color: theme.colors.textPrimary,
    lineHeight: 22,
  },
  sliderTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing[4],
  },
  footer: {
    paddingVertical: theme.spacing[4],
  },
  reconcileSummary: {
    fontSize: 14,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing[3],
    lineHeight: 20,
  },
  reconcileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  reconcileLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  reconcileValue: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  reconcileChoiceValue: {
    color: theme.colors.primary,
  },
  aiDisclaimer: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing[3],
    marginBottom: theme.spacing[4],
    lineHeight: 16,
  },
  promiseTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing[2],
  },
  promiseText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing[4],
  },
  promiseButtons: {
    flexDirection: 'row',
    gap: theme.spacing[3],
  },
  promiseBtn: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.button,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  promiseBtnKept: {
    borderColor: theme.colors.success,
    backgroundColor: '#F0FAF0',
  },
  promiseBtnNotKept: {
    borderColor: theme.colors.secondary,
    backgroundColor: '#F0F9F7',
  },
  promiseBtnLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  promiseBtnLabelKept: {
    color: theme.colors.success,
    fontWeight: '600',
  },
  promiseBtnLabelNotKept: {
    color: theme.colors.secondary,
    fontWeight: '600',
  },
  promiseRetry: {
    fontSize: 13,
    color: theme.colors.secondary,
    marginTop: theme.spacing[3],
    textAlign: 'center',
  },
});
