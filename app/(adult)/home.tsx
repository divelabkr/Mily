import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScreenLayout } from '../../src/ui/layouts/ScreenLayout';
import { Card } from '../../src/ui/components/Card';
import { Button } from '../../src/ui/components/Button';
import { ProgressBar } from '../../src/ui/components/ProgressBar';
import { EmptyState } from '../../src/ui/components/EmptyState';
import { AchievementUnlockPopup } from '../../src/ui/components/AchievementUnlockPopup';
import { theme } from '../../src/ui/theme';
import { usePlanStore } from '../../src/engines/plan/planStore';
import { getWeeklyBudget, loadLatestPlan } from '../../src/engines/plan/planService';
import { getHomeCtaType } from '../../src/engines/plan/homeCtaLogic';
import {
  useCheckInStore,
  getWeeklyTotal,
  getWeeklySpendBreakdown,
} from '../../src/engines/checkin/checkinStore';
import { loadWeeklyCheckIns } from '../../src/engines/checkin/checkinService';
import { useAuthStore } from '../../src/engines/auth/authStore';
import { formatCurrency } from '../../src/utils/formatCurrency';
import { useAchievementStore } from '../../src/engines/achievement/achievementStore';
import {
  getNearestAchievement,
  getUnlockRateLabel,
  markAchievementShared,
} from '../../src/engines/achievement/achievementService';
import { AchievementContext } from '../../src/engines/achievement/achievementTypes';
import { getWeekId } from '../../src/utils/dateUtils';

export default function HomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const plan = usePlanStore((s) => s.currentPlan);
  const checkIns = useCheckInStore((s) => s.weeklyCheckIns);
  const {
    pendingUnlock,
    userAchievements,
    nearestCardShownWeek,
    setNearestCardShownWeek,
    statsMap,
  } = useAchievementStore();

  useEffect(() => {
    if (!user) return;
    loadLatestPlan(user.uid);
    loadWeeklyCheckIns(user.uid);
  }, [user?.uid]);

  // 최소 컨텍스트 — 홈에서 이용 가능한 데이터만
  const achievementCtx = useMemo<AchievementContext>(() => ({
    uid: user?.uid ?? '',
    totalCheckIns: checkIns.length,
    consecutiveWeeks: 0,
    reviewCount: 0,
    planCount: plan ? 1 : 0,
    familyLinked: !!user?.familyId,
    praiseCardsSent: 0,
    requestCardsSent: 0,
    requestCardTypes: [],
    emotionTagCount: 0,
    emotionTagTypes: [],
    memoCheckIns: 0,
    promiseKeptCount: 0,
    underBudgetWeeks: 0,
    choiceSpendZeroWeeks: 0,
    earnedBadges: [],
    unlockedAchievements: userAchievements.map((ua) => ua.achievementId),
    todayCheckInCount: 0,
    todayCheckInAmounts: [],
  }), [user, plan, checkIns, userAchievements]);

  // "거의 다 왔어요" — 이번 주에 아직 표시 안 했을 때만
  const currentWeekId = getWeekId();
  const showNearestCard = nearestCardShownWeek !== currentWeekId;
  const nearestAchievement = showNearestCard
    ? getNearestAchievement(achievementCtx)
    : null;

  const handleNearestCardSeen = () => {
    setNearestCardShownWeek(currentWeekId);
  };

  // 팝업 공유 버튼
  const handleShare = async () => {
    if (!pendingUnlock || !user) return;
    await markAchievementShared(user.uid, pendingUnlock.id, true);
    useAchievementStore.getState().setPendingUnlock(null);
  };

  if (!plan) {
    return (
      <ScreenLayout>
        <EmptyState message={t('empty_home_no_plan')} />
        <View style={styles.ctaContainer}>
          <Button
            title={t('home_cta_record')}
            onPress={() => router.push('/(adult)/checkin')}
          />
        </View>
      </ScreenLayout>
    );
  }

  const weeklyBudget = getWeeklyBudget(plan);
  const weeklySpent = getWeeklyTotal(checkIns);
  const breakdown = getWeeklySpendBreakdown(checkIns);
  // 홈 메인 표시: 선택소비(choice) 금액 — CLAUDE.md: 고정비 제외 선택소비 우선
  const choiceSpent = breakdown.choice;
  const choiceProgress = weeklyBudget > 0 ? choiceSpent / weeklyBudget : 0;
  const ctaType = getHomeCtaType();

  return (
    <ScreenLayout>
      <View style={styles.container}>
        <Text style={styles.title}>{t('home_title')}</Text>

        <Card style={styles.summaryCard}>
          {/* 선택소비 메인 — CLAUDE.md: 고정비 제외 선택소비 우선 */}
          <View style={styles.budgetRow}>
            <Text style={styles.budgetLabel}>✨ 이번 주 선택소비</Text>
            <Text style={styles.budgetValue}>
              {formatCurrency(weeklyBudget)} 예산
            </Text>
          </View>

          <View style={styles.progressSection}>
            <View style={styles.progressLabels}>
              <Text style={styles.spentLabel}>
                {formatCurrency(choiceSpent)}
              </Text>
              <Text style={styles.limitLabel}>
                / {formatCurrency(weeklyBudget)}
              </Text>
            </View>
            <ProgressBar
              progress={choiceProgress}
              color={
                choiceProgress > 1 ? theme.colors.warning : theme.colors.primary
              }
            />
          </View>

          {/* SpendType 분리 표시 */}
          <View style={styles.breakdownRow}>
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>🔒 고정</Text>
              <Text style={styles.breakdownValue}>
                {formatCurrency(breakdown.fixed)}
              </Text>
            </View>
            <View style={styles.breakdownDivider} />
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>🛒 생활</Text>
              <Text style={styles.breakdownValue}>
                {formatCurrency(breakdown.living)}
              </Text>
            </View>
            <View style={styles.breakdownDivider} />
            <View style={styles.breakdownItem}>
              <Text style={[styles.breakdownLabel, styles.breakdownChoiceLabel]}>
                ✨ 선택
              </Text>
              <Text style={[styles.breakdownValue, styles.breakdownChoiceValue]}>
                {formatCurrency(breakdown.choice)}
              </Text>
            </View>
          </View>
        </Card>

        <Card style={styles.commentCard}>
          <Text style={styles.aiComment}>{t('home_ai_comment_default')}</Text>
        </Card>

        {/* 거의 다 왔어요 카드 — 주 1회 */}
        {nearestAchievement && (
          <TouchableOpacity
            style={styles.nearestCard}
            onPress={handleNearestCardSeen}
            activeOpacity={0.8}
          >
            <Text style={styles.nearestLabel}>거의 다 왔어요 🎯</Text>
            <Text style={styles.nearestTitle}>{nearestAchievement.title}</Text>
            <Text style={styles.nearestHint}>
              {nearestAchievement.hint ?? '조건을 달성해보세요.'}
            </Text>
          </TouchableOpacity>
        )}

        {checkIns.length === 0 && (
          <EmptyState message={t('empty_home_no_checkin')} />
        )}
      </View>

      <View style={styles.ctaContainer}>
        <Button
          title={
            ctaType === 'record' ? t('home_cta_record') : t('home_cta_review')
          }
          onPress={() =>
            router.push(
              ctaType === 'record' ? '/(adult)/checkin' : '/(adult)/review'
            )
          }
        />
      </View>

      {/* 해금 팝업 — pendingUnlock 있을 때 */}
      {pendingUnlock && (
        <AchievementUnlockPopup
          achievement={pendingUnlock}
          unlockRate={getUnlockRateLabel(pendingUnlock.id, 0)}
          onShare={handleShare}
        />
      )}
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: theme.spacing[6],
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing[5],
  },
  summaryCard: {
    marginBottom: theme.spacing[4],
  },
  budgetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing[4],
  },
  budgetLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  budgetValue: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  progressSection: {
    gap: theme.spacing[2],
  },
  progressLabels: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  spentLabel: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  limitLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing[1],
  },
  commentCard: {
    marginBottom: theme.spacing[4],
  },
  aiComment: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  ctaContainer: {
    paddingVertical: theme.spacing[4],
  },
  nearestCard: {
    backgroundColor: '#FFF8EC',
    borderRadius: theme.borderRadius.card,
    padding: theme.spacing[4],
    marginBottom: theme.spacing[4],
    borderWidth: 1,
    borderColor: '#F4C542',
  },
  nearestLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#C8960A',
    marginBottom: theme.spacing[1],
  },
  nearestTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing[1],
  },
  nearestHint: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing[4],
    paddingTop: theme.spacing[3],
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  breakdownItem: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  breakdownDivider: {
    width: 1,
    height: 28,
    backgroundColor: theme.colors.border,
  },
  breakdownLabel: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  breakdownChoiceLabel: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
  breakdownValue: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  breakdownChoiceValue: {
    color: theme.colors.primary,
  },
});
