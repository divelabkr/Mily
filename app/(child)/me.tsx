import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Switch, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ScreenLayout } from '../../src/ui/layouts/ScreenLayout';
import { Card } from '../../src/ui/components/Card';
import { theme } from '../../src/ui/theme';
import { DEFAULT_CATEGORIES, CategoryId } from '../../src/engines/plan/defaultCategories';
import { useAuthStore } from '../../src/engines/auth/authStore';
import {
  PrivacySettings,
  defaultPrivacySettings,
  loadPrivacySettings,
  savePrivacySettings,
} from '../../src/engines/family/privacySettings';
import { useRewardStore } from '../../src/engines/reward/rewardStore';
import { getRewardSettings, updateRewardSettings } from '../../src/engines/reward/rewardService';
import {
  scheduleDailyCheckInReminder,
  cancelDailyCheckInReminder,
} from '../../src/engines/notification/notificationService';

export default function ChildMeScreen() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const [privacy, setPrivacy] = useState<PrivacySettings | null>(null);
  const [dailyReminderOn, setDailyReminderOn] = useState(false);
  const rewardSettings = useRewardStore((s) => s.rewardSettings);
  const updateSettingsStore = useRewardStore((s) => s.updateSettings);

  useEffect(() => {
    if (user?.uid && user?.familyId) {
      loadPrivacySettings(user.familyId, user.uid).then(setPrivacy);
    } else if (user?.uid) {
      setPrivacy(defaultPrivacySettings(user.uid, ''));
    }
  }, [user]);

  // 쿠폰 알림 설정 로드
  useEffect(() => {
    if (!user?.uid) return;
    getRewardSettings(user.uid).then(updateSettingsStore).catch(() => {});
  }, [user?.uid]);

  const handleDailyReminderToggle = async (value: boolean) => {
    setDailyReminderOn(value);
    if (value) {
      await scheduleDailyCheckInReminder().catch(() => {});
    } else {
      await cancelDailyCheckInReminder().catch(() => {});
    }
  };

  const handleNotifyParentToggle = async (value: boolean) => {
    if (!user?.uid) return;
    const updated = { notifyParentOnCoupon: value };
    updateSettingsStore(updated);
    await updateRewardSettings(user.uid, updated);
  };

  const toggleCategory = async (categoryId: CategoryId) => {
    if (!privacy || !user) return;

    const isShared = privacy.sharedCategories.includes(categoryId);
    const newShared = isShared
      ? privacy.sharedCategories.filter((c) => c !== categoryId)
      : [...privacy.sharedCategories, categoryId];

    const updated: PrivacySettings = {
      ...privacy,
      sharedCategories: newShared,
    };
    setPrivacy(updated);
    if (user.familyId) await savePrivacySettings(updated);
  };

  const toggleReview = async () => {
    if (!privacy || !user) return;
    const updated: PrivacySettings = {
      ...privacy,
      shareReview: !privacy.shareReview,
    };
    setPrivacy(updated);
    if (user.familyId) await savePrivacySettings(updated);
  };

  return (
    <ScreenLayout>
      <ScrollView style={styles.scroll}>
        <Text style={styles.title}>{t('tab_my')}</Text>

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>{t('child_privacy_title')}</Text>

          {DEFAULT_CATEGORIES.map((cat) => (
            <View key={cat.id} style={styles.privacyRow}>
              <Text style={styles.privacyLabel}>
                {cat.emoji} {cat.label}
              </Text>
              <Switch
                value={privacy?.sharedCategories.includes(cat.id) ?? false}
                onValueChange={() => toggleCategory(cat.id)}
                trackColor={{
                  false: theme.colors.border,
                  true: theme.colors.primary,
                }}
              />
            </View>
          ))}

          <View style={styles.privacyRow}>
            <Text style={styles.privacyLabel}>📋 이번 주 회고 공유</Text>
            <Switch
              value={privacy?.shareReview ?? false}
              onValueChange={toggleReview}
              trackColor={{
                false: theme.colors.border,
                true: theme.colors.primary,
              }}
            />
          </View>
        </Card>

        {/* 🔔 알림 설정 */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>🔔 알림 설정</Text>
          <View style={styles.privacyRow}>
            <View style={styles.settingTextWrapper}>
              <Text style={styles.privacyLabel}>매일 저녁 기록 알림</Text>
              <Text style={styles.settingHint}>평일 저녁 9시에 오늘 기록 알림이 와요</Text>
            </View>
            <Switch
              value={dailyReminderOn}
              onValueChange={handleDailyReminderToggle}
              trackColor={{
                false: theme.colors.border,
                true: theme.colors.primary,
              }}
            />
          </View>
        </Card>

        {/* 🎁 선물 알림 설정 — 자녀가 결정 (역전된 프라이버시 원칙) */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>🎁 선물 알림 설정</Text>
          <View style={styles.privacyRow}>
            <View style={styles.settingTextWrapper}>
              <Text style={styles.privacyLabel}>부모님께 선물 받은 거 알리기</Text>
              <Text style={styles.settingHint}>ON이면 부모님도 함께 기뻐할 수 있어요 🎉</Text>
            </View>
            <Switch
              value={rewardSettings.notifyParentOnCoupon}
              onValueChange={handleNotifyParentToggle}
              trackColor={{
                false: theme.colors.border,
                true: theme.colors.primary,
              }}
            />
          </View>
        </Card>

        <Text style={styles.disclaimer}>{t('not_financial_service')}</Text>
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
    marginBottom: theme.spacing[4],
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing[4],
  },
  privacyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing[2],
    minHeight: 44,
  },
  privacyLabel: {
    fontSize: 15,
    color: theme.colors.textPrimary,
  },
  disclaimer: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing[6],
    marginBottom: theme.spacing[6],
  },
  settingTextWrapper: {
    flex: 1,
    marginRight: theme.spacing[3],
  },
  settingHint: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
});
