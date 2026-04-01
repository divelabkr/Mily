import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScreenLayout } from '../../src/ui/layouts/ScreenLayout';
import { EmptyState } from '../../src/ui/components/EmptyState';
import { AchievementUnlockPopup } from '../../src/ui/components/AchievementUnlockPopup';
import { GiftIcon } from '../../src/ui/components/CouponInbox';
import { DarkCard } from '../../src/components/ui/DarkCard';
import { GoldCard } from '../../src/components/ui/GoldCard';
import { FABZone } from '../../src/components/ui/FABZone';
import { theme } from '../../src/ui/theme';
import { useRewardStore } from '../../src/engines/reward/rewardStore';
import { hasActiveCoupons, getCoupons, checkAndExpireCoupons } from '../../src/engines/reward/rewardService';
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
import { DEFAULT_CATEGORIES } from '../../src/engines/plan/defaultCategories';

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
  } = useAchievementStore();

  const setCoupons = useRewardStore((s) => s.setCoupons);
  const rewardCoupons = useRewardStore((s) => s.coupons);
  const activeCouponCount = rewardCoupons.filter(
    (c) => c.status === 'active' && c.isVisible
  ).length;

  useEffect(() => {
    if (!user) return;
    loadLatestPlan(user.uid);
    loadWeeklyCheckIns(user.uid);
    checkAndExpireCoupons(user.uid).catch(() => {});
    getCoupons(user.uid).then(setCoupons).catch(() => {});
  }, [user?.uid]);

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
    praiseCardsReceived: 0,
    giveCheckIns: 0,
    daysSinceLastCheckIn: 0,
    economyTipsViewed: 0,
    dailyCheckInStreak: 0,
    requestCardsResolved: 0,
    savingsCheckIns: 0,
    choiceSpendDecreased: false,
    contractsCompleted: 0,
    ageBandUpgraded: false,
    isGraduated: false,
    freedomIndex: 0,
    familyBankCompleted: false,
    totalMilyXp: 0,
  }), [user, plan, checkIns, userAchievements]);

  const currentWeekId = getWeekId();
  const showNearestCard = nearestCardShownWeek !== currentWeekId;
  const nearestAchievement = showNearestCard ? getNearestAchievement(achievementCtx) : null;

  const handleNearestCardSeen = () => setNearestCardShownWeek(currentWeekId);

  const handleShare = async () => {
    if (!pendingUnlock || !user) return;
    await markAchievementShared(user.uid, pendingUnlock.id, true);
    useAchievementStore.getState().setPendingUnlock(null);
  };

  const breakdown = getWeeklySpendBreakdown(checkIns);
  const weeklyBudget = plan ? getWeeklyBudget(plan) : 0;
  const totalSpent = getWeeklyTotal(checkIns);
  const breakdownTotal = breakdown.fixed + breakdown.living + breakdown.choice;

  // 최근 3개 기록
  const recentThree = [...checkIns]
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 3);

  const ctaType = getHomeCtaType();

  const fabMain = {
    key: 'record',
    label: '오늘 기록하기',
    onPress: () => router.push('/(adult)/checkin'),
  };
  const fabSecondary = [
    { key: 'review', label: '주간 회고', emoji: '📊', onPress: () => router.push('/(adult)/review') },
    { key: 'dream', label: '꿈 설계소', emoji: '🌟', onPress: () => router.push('/(adult)/dream') },
  ];

  if (!plan) {
    return (
      <ScreenLayout>
        <View style={styles.container}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>{t('home_title')}</Text>
            {user && <GiftIcon uid={user.uid} activeCount={activeCouponCount} />}
          </View>
          <EmptyState message={t('empty_home_no_plan')} />
        </View>
        <FABZone mainAction={fabMain} />
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

  return (
    <ScreenLayout>
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* 헤더 */}
        <View style={styles.headerRow}>
          <Text style={styles.title}>{t('home_title')}</Text>
          {user && <GiftIcon uid={user.uid} activeCount={activeCouponCount} />}
        </View>

        {/* DarkCard — 이번 주 선택소비 큰 숫자 */}
        <DarkCard style={styles.darkCard}>
          <Text style={styles.darkCardLabel}>✨ 이번 주 선택소비</Text>
          <Text style={styles.darkCardAmount}>
            {formatCurrency(breakdown.choice)}
          </Text>

          {/* 3분할 바 */}
          {breakdownTotal > 0 && (
            <View style={styles.breakdownBarContainer}>
              <View style={styles.breakdownBar}>
                <View
                  style={[
                    styles.barSegment,
                    styles.barFixed,
                    { flex: breakdown.fixed / breakdownTotal },
                  ]}
                />
                <View
                  style={[
                    styles.barSegment,
                    styles.barLiving,
                    { flex: breakdown.living / breakdownTotal },
                  ]}
                />
                <View
                  style={[
                    styles.barSegment,
                    styles.barChoice,
                    { flex: breakdown.choice / breakdownTotal },
                  ]}
                />
              </View>
              <View style={styles.breakdownLabels}>
                <Text style={styles.breakdownItem}>
                  🔒 {formatCurrency(breakdown.fixed)}
                </Text>
                <Text style={styles.breakdownItem}>
                  🛒 {formatCurrency(breakdown.living)}
                </Text>
                <Text style={[styles.breakdownItem, styles.breakdownChoiceItem]}>
                  ✨ {formatCurrency(breakdown.choice)}
                </Text>
              </View>
            </View>
          )}

          {weeklyBudget > 0 && (
            <Text style={styles.darkCardBudget}>
              주간 예산 {formatCurrency(weeklyBudget)}
            </Text>
          )}
        </DarkCard>

        {/* GoldCard — AI 인사이트 (터치 → 주간회고) */}
        <TouchableOpacity
          onPress={() => router.push('/(adult)/review')}
          activeOpacity={0.8}
        >
          <GoldCard style={styles.goldCard}>
            <Text style={styles.goldCardEmoji}>💬</Text>
            <View style={styles.goldCardBody}>
              <Text style={styles.goldCardText}>{t('home_ai_comment_default')}</Text>
              <Text style={styles.goldCardCta}>가족이랑 얘기해볼까요? →</Text>
            </View>
          </GoldCard>
        </TouchableOpacity>

        {/* 거의 다 왔어요 카드 */}
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

        {/* 연속기록 카드 → 업적 도감 */}
        {checkIns.length > 0 && (
          <TouchableOpacity
            style={styles.streakCard}
            onPress={() => router.push('/(adult)/achievements')}
            activeOpacity={0.8}
          >
            <Text style={styles.streakText}>🔥 {checkIns.length}일 연속 기록</Text>
            <Text style={styles.streakArrow}>›</Text>
          </TouchableOpacity>
        )}

        {/* 최근 기록 3개 */}
        {recentThree.length > 0 ? (
          <View style={styles.recentSection}>
            <View style={styles.recentHeader}>
              <Text style={styles.recentTitle}>최근 기록</Text>
              <TouchableOpacity
                onPress={() => router.push('/(adult)/records')}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.recentViewAll}>전체보기 →</Text>
              </TouchableOpacity>
            </View>
            {recentThree.map((ci) => {
              const cat = DEFAULT_CATEGORIES.find((c) => c.id === ci.categoryId);
              return (
                <View key={ci.checkInId} style={styles.recentRow}>
                  <Text style={styles.recentEmoji}>{cat?.emoji ?? '📝'}</Text>
                  <Text style={styles.recentCat}>{cat?.label ?? ci.categoryId}</Text>
                  <Text style={styles.recentAmount}>
                    {formatCurrency(ci.amount)}
                  </Text>
                </View>
              );
            })}
          </View>
        ) : (
          <EmptyState message={t('empty_home_no_checkin')} />
        )}

        {/* FAB 여백 */}
        <View style={{ height: 80 }} />
      </ScrollView>

      <FABZone mainAction={fabMain} secondaryActions={fabSecondary} />

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
  scroll: { flex: 1 },
  scrollContent: { paddingTop: 24 },
  container: { flex: 1, paddingTop: 24 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: theme.milyColors.brownDark,
  },
  darkCard: {
    marginBottom: 14,
  },
  darkCardLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
    marginBottom: 4,
  },
  darkCardAmount: {
    fontSize: 38,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  breakdownBarContainer: {
    marginBottom: 12,
  },
  breakdownBar: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginBottom: 10,
  },
  barSegment: {
    height: '100%',
  },
  barFixed: {
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  barLiving: {
    backgroundColor: 'rgba(201,169,110,0.8)',
  },
  barChoice: {
    backgroundColor: theme.milyColors.coral,
  },
  breakdownLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  breakdownItem: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '500',
  },
  breakdownChoiceItem: {
    color: '#FFBDAD',
    fontWeight: '700',
  },
  darkCardBudget: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 8,
  },
  goldCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  goldCardEmoji: {
    fontSize: 18,
    marginRight: 10,
    marginTop: 1,
  },
  goldCardBody: {
    flex: 1,
  },
  goldCardText: {
    fontSize: 14,
    color: theme.milyColors.brownDark,
    lineHeight: 21,
    fontWeight: '500',
    marginBottom: 6,
  },
  goldCardCta: {
    fontSize: 13,
    color: theme.milyColors.brownDark,
    fontWeight: '700',
    opacity: 0.7,
  },
  nearestCard: {
    backgroundColor: '#FFF8EC',
    borderRadius: theme.borderRadius.card,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#F4C542',
  },
  nearestLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#C8960A',
    marginBottom: 4,
  },
  nearestTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.milyColors.brownDark,
    marginBottom: 4,
  },
  nearestHint: {
    fontSize: 12,
    color: theme.milyColors.brownMid,
  },
  streakCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF3E0',
    borderRadius: theme.borderRadius.card,
    borderWidth: 1,
    borderColor: '#FFCC80',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 14,
  },
  streakText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.milyColors.brownDark,
  },
  streakArrow: {
    fontSize: 20,
    color: theme.milyColors.brownMid,
  },
  recentSection: {
    marginTop: 4,
    marginBottom: 8,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  recentTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.milyColors.brownMid,
    letterSpacing: 0.3,
  },
  recentViewAll: {
    fontSize: 13,
    color: theme.milyColors.coral,
    fontWeight: '600',
  },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.milyColors.surface2,
  },
  recentEmoji: {
    fontSize: 18,
    marginRight: 12,
  },
  recentCat: {
    flex: 1,
    fontSize: 15,
    color: theme.milyColors.brownDark,
    fontWeight: '500',
  },
  recentAmount: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.milyColors.brownDark,
  },
});
