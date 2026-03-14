import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ScreenLayout } from '../../src/ui/layouts/ScreenLayout';
import { Card } from '../../src/ui/components/Card';
import { ProgressBar } from '../../src/ui/components/ProgressBar';
import { LockedFeatureCard } from '../../src/ui/components/LockedFeatureCard';
import { ReadinessDialog } from '../../src/ui/components/ReadinessDialog';
import { theme } from '../../src/ui/theme';
import { usePlanStore } from '../../src/engines/plan/planStore';
import { DEFAULT_CATEGORIES } from '../../src/engines/plan/defaultCategories';
import { getCategoryWeeklyLimit } from '../../src/engines/plan/planService';
import {
  useCheckInStore,
  getWeeklyCategoryTotal,
} from '../../src/engines/checkin/checkinStore';
import { formatCurrency } from '../../src/utils/formatCurrency';
import { useAuthStore } from '../../src/engines/auth/authStore';
import {
  useUnlockStore,
  loadUnlockStatus,
  getReadinessDialog,
  applyEarlyUnlock,
  notifyParentEarlyUnlock,
  calcAge,
} from '../../src/engines/unlock/unlockService';
import { AGE_BANDS, ReadinessDialog as ReadinessDialogType } from '../../src/engines/unlock/unlockTypes';

// ──────────────────────────────────────────────
// 자녀 계획 탭 — 해금 시스템 연동
// ──────────────────────────────────────────────

export default function ChildPlanScreen() {
  const { t } = useTranslation();
  const plan = usePlanStore((s) => s.currentPlan);
  const checkIns = useCheckInStore((s) => s.weeklyCheckIns);
  const user = useAuthStore((s) => s.user);
  const { unlockStatus, isFeatureUnlocked } = useUnlockStore();

  const [dialogVisible, setDialogVisible] = useState(false);
  const [activeDialog, setActiveDialog] = useState<ReadinessDialogType | null>(null);

  useEffect(() => {
    if (user?.uid) loadUnlockStatus(user.uid);
  }, [user?.uid]);

  const birthYear = unlockStatus?.birthYear;
  const currentAge = birthYear ? calcAge(birthYear) : null;

  // plan_simple이 잠겨 있고, 조기 해금 대화가 있는지 확인
  const isPlanLocked = !isFeatureUnlocked('plan_simple');
  const childYoungBand = AGE_BANDS['child_young'];
  const hasEarlyDialog = childYoungBand.earlyUnlockDialogId !== null;

  function handleTryEarly() {
    const dialogId = childYoungBand.earlyUnlockDialogId;
    if (!dialogId) return;
    const dialog = getReadinessDialog(dialogId);
    if (!dialog) return;
    setActiveDialog(dialog);
    setDialogVisible(true);
  }

  async function handleDialogPass() {
    setDialogVisible(false);
    if (!user?.uid || !birthYear) return;

    await applyEarlyUnlock(user.uid, 'plan_simple', birthYear);
    await notifyParentEarlyUnlock(user.displayName ?? '자녀', 'plan_simple');

    Alert.alert(
      '월 계획이 열렸어요! 🎉',
      '부모님께도 알려드렸어요. 응원 카드가 올 수도 있어요.',
      [{ text: '확인' }]
    );
  }

  // 잠긴 화면: plan_simple 미해금
  if (isPlanLocked) {
    return (
      <ScreenLayout>
        <ScrollView style={styles.scroll}>
          <Text style={styles.title}>{t('plan_title')}</Text>

          <LockedFeatureCard
            featureId="plan_simple"
            currentAge={currentAge ?? 9}
            hasEarlyUnlockDialog={hasEarlyDialog}
            onTryEarly={handleTryEarly}
          />

          {/* 미리보기: 흐릿한 카테고리 카드들 */}
          <View style={styles.previewSection}>
            <Text style={styles.previewHint}>이런 화면이 열려요</Text>
            {DEFAULT_CATEGORIES.slice(0, 2).map((cat) => (
              <View key={cat.id} style={styles.previewCard} pointerEvents="none">
                <View style={styles.row}>
                  <Text style={styles.catLabelDim}>{cat.emoji} {cat.label}</Text>
                  <Text style={styles.catAmountDim}>— / —</Text>
                </View>
                <ProgressBar progress={0.5} color={theme.colors.border} />
              </View>
            ))}
          </View>
        </ScrollView>

        {activeDialog && (
          <ReadinessDialog
            visible={dialogVisible}
            dialog={activeDialog}
            onPass={handleDialogPass}
            onClose={() => setDialogVisible(false)}
          />
        )}
      </ScreenLayout>
    );
  }

  // 해금된 화면: 기존 계획 화면
  return (
    <ScreenLayout>
      <ScrollView style={styles.scroll}>
        <Text style={styles.title}>{t('plan_title')}</Text>

        {plan?.categories.map((cat) => {
          const info = DEFAULT_CATEGORIES.find((d) => d.id === cat.categoryId);
          if (!info) return null;
          const limit = getCategoryWeeklyLimit(plan, cat.categoryId);
          const spent = getWeeklyCategoryTotal(checkIns, cat.categoryId);
          const progress = limit > 0 ? spent / limit : 0;

          return (
            <Card key={cat.categoryId} style={styles.card}>
              <View style={styles.row}>
                <Text style={styles.catLabel}>
                  {info.emoji} {info.label}
                </Text>
                <Text style={styles.catAmount}>
                  {formatCurrency(spent)} / {formatCurrency(limit)}
                </Text>
              </View>
              <ProgressBar progress={progress} />
            </Card>
          );
        })}
      </ScrollView>
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
    marginBottom: theme.spacing[5],
  },
  card: {
    marginBottom: theme.spacing[3],
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing[2],
  },
  catLabel: {
    fontSize: 15,
    color: theme.colors.textPrimary,
  },
  catAmount: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  previewSection: {
    marginTop: theme.spacing[5],
    opacity: 0.35,
  },
  previewHint: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing[2],
    textAlign: 'center',
  },
  previewCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.card,
    padding: 14,
    marginBottom: theme.spacing[3],
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  catLabelDim: {
    fontSize: 15,
    color: theme.colors.textSecondary,
  },
  catAmountDim: {
    fontSize: 13,
    color: theme.colors.border,
  },
});
