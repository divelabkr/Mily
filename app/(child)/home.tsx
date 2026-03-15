import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScreenLayout } from '../../src/ui/layouts/ScreenLayout';
import { Card } from '../../src/ui/components/Card';
import { Button } from '../../src/ui/components/Button';
import { ProgressBar } from '../../src/ui/components/ProgressBar';
import { GiftIcon } from '../../src/ui/components/CouponInbox';
import { theme } from '../../src/ui/theme';
import { usePlanStore } from '../../src/engines/plan/planStore';
import { getWeeklyBudget } from '../../src/engines/plan/planService';
import {
  useCheckInStore,
  getWeeklyTotal,
} from '../../src/engines/checkin/checkinStore';
import {
  getTodaySummary,
  type DailySummary,
} from '../../src/engines/checkin/dailySummaryService';
import {
  getMonthlySnapshot,
  getPrevMonthId,
  type MonthlyReconcile,
} from '../../src/engines/review/reconcileService';
import { getWeekId } from '../../src/utils/dateUtils';
import { formatCurrency } from '../../src/utils/formatCurrency';
import { usePraiseCardStore } from '../../src/engines/praiseCard/praiseCardStore';
import { loadPraiseCards } from '../../src/engines/praiseCard/praiseCardService';
import { useAuthStore } from '../../src/engines/auth/authStore';
import { useRewardStore } from '../../src/engines/reward/rewardStore';
import { getCoupons, checkAndExpireCoupons } from '../../src/engines/reward/rewardService';

const PRAISE_EMOJI: Record<string, string> = {
  well_saved: '🌟',
  good_effort: '💪',
  thank_you: '💛',
};

export default function ChildHomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const plan = usePlanStore((s) => s.currentPlan);
  const checkIns = useCheckInStore((s) => s.weeklyCheckIns);
  const praiseCards = usePraiseCardStore((s) => s.cards);
  const setCoupons = useRewardStore((s) => s.setCoupons);
  const rewardCoupons = useRewardStore((s) => s.coupons);
  const activeCouponCount = rewardCoupons.filter(
    (c) => c.status === 'active' && c.isVisible
  ).length;

  const [todaySummary, setTodaySummary] = useState<DailySummary | null>(null);
  const [prevMonthReconcile, setPrevMonthReconcile] = useState<MonthlyReconcile | null>(null);

  useEffect(() => {
    if (user?.familyId) {
      loadPraiseCards(user.familyId);
    }
  }, [user?.familyId]);

  // 만료 쿠폰 처리 + 쿠폰 목록 로드
  useEffect(() => {
    if (!user) return;
    checkAndExpireCoupons(user.uid).catch(() => {});
    getCoupons(user.uid).then(setCoupons).catch(() => {});
  }, [user?.uid]);

  // 오늘 일별 요약
  useEffect(() => {
    if (!user) return;
    getTodaySummary(user.uid, getWeekId()).then(setTodaySummary).catch(() => {});
  }, [user?.uid, checkIns.length]);

  // 이전 달 월간 정산 (월초 7일간 표시)
  useEffect(() => {
    if (!user) return;
    const today = new Date();
    if (today.getDate() <= 7) {
      getMonthlySnapshot(user.uid, getPrevMonthId(today))
        .then(setPrevMonthReconcile)
        .catch(() => {});
    }
  }, [user?.uid]);

  // 이번 주(최근 7일) 받은 칭찬 카드만 표시
  const recentPraise = praiseCards.filter(
    (c) => c.toUid === user?.uid && Date.now() - c.createdAt < 7 * 24 * 60 * 60 * 1000
  );

  const weeklyBudget = plan ? getWeeklyBudget(plan) : 0;
  const weeklySpent = getWeeklyTotal(checkIns);
  const remaining = Math.max(0, weeklyBudget - weeklySpent);
  const progress = weeklyBudget > 0 ? weeklySpent / weeklyBudget : 0;

  return (
    <ScreenLayout>
      <View style={styles.container}>
        {/* 헤더: 인사말 + 선물함 아이콘 (활성 쿠폰 있을 때만 표시) */}
        <View style={styles.headerRow}>
          <Text style={styles.greeting}>{t('child_home_doing_great')}</Text>
          {user && (
            <GiftIcon uid={user.uid} activeCount={activeCouponCount} />
          )}
        </View>

        {/* 칭찬 카드 알림 */}
        {recentPraise.length > 0 && (
          <View style={styles.praiseContainer}>
            {recentPraise.slice(0, 3).map((card) => (
              <Card key={card.cardId} style={styles.praiseCard}>
                <Text style={styles.praiseEmoji}>
                  {PRAISE_EMOJI[card.type] ?? '🎉'}
                </Text>
                <Text style={styles.praiseText}>
                  {t(`praise_card_${card.type}`)}
                </Text>
              </Card>
            ))}
          </View>
        )}

        <Card style={styles.card}>
          <Text style={styles.remainLabel}>{t('child_home_remaining')}</Text>
          <Text style={styles.remainAmount}>{formatCurrency(remaining)}</Text>
          <ProgressBar progress={progress} />
        </Card>

        {/* 오늘 선택소비 요약 (기록 있을 때만) */}
        {todaySummary && todaySummary.choiceAmount > 0 && (
          <Card style={styles.dailyCard}>
            <Text style={styles.dailyLabel}>오늘 선택소비</Text>
            <Text style={styles.dailyAmount}>
              {formatCurrency(todaySummary.choiceAmount)}
            </Text>
            {todaySummary.checkInCount > 0 && (
              <Text style={styles.dailyCount}>
                {todaySummary.checkInCount}건 기록됨
              </Text>
            )}
          </Card>
        )}

        {/* 이전 달 월간 정산 카드 (월초 7일간) */}
        {prevMonthReconcile && (
          <Card style={styles.monthlyCard}>
            <Text style={styles.monthlyLabel}>
              📊 {prevMonthReconcile.monthId} 돌아보기
            </Text>
            <Text style={styles.monthlyAmount}>
              {formatCurrency(prevMonthReconcile.choiceActual)}
            </Text>
            <Text style={styles.monthlyHint}>선택소비 합계</Text>
          </Card>
        )}
      </View>

      <View style={styles.footer}>
        <Button
          title={t('home_cta_record')}
          onPress={() => {
            // TODO: 자녀 체크인 화면
          }}
        />
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: theme.spacing[6],
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing[5],
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  card: {
    alignItems: 'center',
    gap: theme.spacing[3],
  },
  remainLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  remainAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  praiseContainer: {
    marginBottom: theme.spacing[4],
    gap: theme.spacing[2],
  },
  praiseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[3],
    paddingVertical: theme.spacing[3],
    backgroundColor: '#FFFBF0',
    borderColor: theme.colors.accent,
    borderWidth: 1,
  },
  praiseEmoji: {
    fontSize: 22,
  },
  praiseText: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  dailyCard: {
    marginTop: theme.spacing[3],
    alignItems: 'center',
    gap: theme.spacing[1],
    backgroundColor: '#F0F9F7',
    borderColor: theme.colors.secondary,
    borderWidth: 1,
  },
  dailyLabel: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  dailyAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.secondary,
  },
  dailyCount: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  monthlyCard: {
    marginTop: theme.spacing[3],
    alignItems: 'center',
    gap: theme.spacing[1],
    backgroundColor: '#F5F0FF',
    borderColor: theme.colors.accent,
    borderWidth: 1,
  },
  monthlyLabel: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  monthlyAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.accent,
  },
  monthlyHint: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  footer: {
    paddingVertical: theme.spacing[4],
  },
});
