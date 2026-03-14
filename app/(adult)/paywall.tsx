import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScreenLayout } from '../../src/ui/layouts/ScreenLayout';
import { Card } from '../../src/ui/components/Card';
import { Button } from '../../src/ui/components/Button';
import { theme } from '../../src/ui/theme';
import { PLANS } from '../../src/engines/billing/plans';
import { purchasePlan, restorePurchases } from '../../src/engines/billing/billingService';
import { useBillingStore } from '../../src/engines/billing/billingStore';
import { formatCurrency } from '../../src/utils/formatCurrency';
import { trackEvent } from '../../src/engines/analytics/analyticsService';

interface PaywallProps {
  trigger?: string;
}

export default function PaywallScreen({ trigger }: PaywallProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [purchasing, setPurchasing] = useState<'plus' | 'family' | null>(null);
  const loading = useBillingStore((s) => s.loading);

  React.useEffect(() => {
    trackEvent('paywall_viewed', { trigger: trigger ?? 'settings' });
  }, []);

  const handlePurchase = async (planId: 'plus' | 'family') => {
    setPurchasing(planId);
    try {
      const success = await purchasePlan(planId);
      if (success) router.back();
    } finally {
      setPurchasing(null);
    }
  };

  const handleRestore = async () => {
    await restorePurchases();
  };

  return (
    <ScreenLayout>
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <Text style={styles.title}>더 많은 기능</Text>
        <Text style={styles.subtitle}>
          주 1회 5분, 더 깊게 돌아보세요.
        </Text>

        {/* Plus 플랜 */}
        <Card style={[styles.planCard, styles.plusCard] as object}>
          <Text style={styles.planBadge}>PLUS</Text>
          <Text style={styles.planPrice}>
            {formatCurrency(PLANS.plus.price)}
            <Text style={styles.planPeriod}>/월</Text>
          </Text>
          <View style={styles.features}>
            {[
              '📅 무제한 히스토리 (지난 회고 전부)',
              '📊 카테고리 자유 조정',
              '💌 요청 카드 무제한',
            ].map((f) => (
              <Text key={f} style={styles.feature}>
                {f}
              </Text>
            ))}
          </View>
          <Button
            title="Plus 시작하기"
            onPress={() => handlePurchase('plus')}
            loading={purchasing === 'plus'}
            disabled={loading}
          />
        </Card>

        {/* Family 플랜 */}
        <Card style={[styles.planCard, styles.familyCard] as object}>
          <Text style={styles.planBadge}>FAMILY</Text>
          <Text style={styles.planPrice}>
            {formatCurrency(PLANS.family.price)}
            <Text style={styles.planPeriod}>/월</Text>
          </Text>
          <View style={styles.features}>
            {[
              '✅ Plus 전체 기능',
              '👨‍👩‍👧 가족 3명까지',
              '📋 주간 가족 브리핑',
              '🔄 요청 카드 + 응답 히스토리',
            ].map((f) => (
              <Text key={f} style={styles.feature}>
                {f}
              </Text>
            ))}
          </View>
          <Button
            title="Family 시작하기"
            onPress={() => handlePurchase('family')}
            loading={purchasing === 'family'}
            disabled={loading}
            variant="secondary"
          />
        </Card>

        <TouchableOpacity onPress={handleRestore} style={styles.restoreButton}>
          <Text style={styles.restoreText}>구매 복원</Text>
        </TouchableOpacity>

        <Text style={styles.disclaimer}>{t('not_financial_service')}</Text>
      </ScrollView>

      {/* 하단: 무료로 계속 */}
      <TouchableOpacity
        style={styles.freeLink}
        onPress={() => router.back()}
      >
        <Text style={styles.freeLinkText}>무료로 계속 쓸래요 →</Text>
      </TouchableOpacity>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingTop: theme.spacing[6], paddingBottom: theme.spacing[4] },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginBottom: theme.spacing[2],
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing[6],
  },
  planCard: {
    marginBottom: theme.spacing[4],
  },
  plusCard: {
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  familyCard: {
    borderWidth: 2,
    borderColor: theme.colors.secondary,
  },
  planBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.primary,
    letterSpacing: 1,
    marginBottom: theme.spacing[2],
  },
  planPrice: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing[4],
  },
  planPeriod: {
    fontSize: 14,
    fontWeight: '400',
    color: theme.colors.textSecondary,
  },
  features: { marginBottom: theme.spacing[4] },
  feature: {
    fontSize: 14,
    color: theme.colors.textPrimary,
    lineHeight: 22,
    marginBottom: theme.spacing[1],
  },
  restoreButton: {
    alignItems: 'center',
    paddingVertical: theme.spacing[3],
  },
  restoreText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textDecorationLine: 'underline',
  },
  disclaimer: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing[4],
  },
  freeLink: {
    alignItems: 'center',
    paddingVertical: theme.spacing[4],
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  freeLinkText: {
    fontSize: 15,
    color: theme.colors.textSecondary,
  },
});
