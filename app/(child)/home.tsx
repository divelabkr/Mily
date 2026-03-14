import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScreenLayout } from '../../src/ui/layouts/ScreenLayout';
import { Card } from '../../src/ui/components/Card';
import { Button } from '../../src/ui/components/Button';
import { ProgressBar } from '../../src/ui/components/ProgressBar';
import { theme } from '../../src/ui/theme';
import { usePlanStore } from '../../src/engines/plan/planStore';
import { getWeeklyBudget } from '../../src/engines/plan/planService';
import {
  useCheckInStore,
  getWeeklyTotal,
} from '../../src/engines/checkin/checkinStore';
import { usePraiseCardStore } from '../../src/engines/praiseCard/praiseCardStore';
import { loadPraiseCards } from '../../src/engines/praiseCard/praiseCardService';
import { useAuthStore } from '../../src/engines/auth/authStore';
import { formatCurrency } from '../../src/utils/formatCurrency';

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

  useEffect(() => {
    if (user?.familyId) {
      loadPraiseCards(user.familyId);
    }
  }, [user?.familyId]);

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
        <Text style={styles.greeting}>{t('child_home_doing_great')}</Text>

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
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing[5],
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
  footer: {
    paddingVertical: theme.spacing[4],
  },
});
