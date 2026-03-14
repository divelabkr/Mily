import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScreenLayout } from '../../src/ui/layouts/ScreenLayout';
import { Card } from '../../src/ui/components/Card';
import { Button } from '../../src/ui/components/Button';
import { theme } from '../../src/ui/theme';
import { useAuthStore } from '../../src/engines/auth/authStore';
import { softDeleteAccount } from '../../src/engines/auth/deleteAccount';
import {
  removeMemberFromFamily,
} from '../../src/engines/auth/deleteAccount';
import { useMasterPermissions } from '../../src/engines/auth/masterGuard';
import { screen as posthogScreen, capture } from '../../src/engines/monitoring/posthogService';
import { useBillingStore } from '../../src/engines/billing/billingStore';
import type { UserRole } from '../../src/engines/auth/authStore';
import type { PlanId } from '../../src/engines/billing/plans';

// 역할 표시 레이블
const ROLE_LABELS: Record<UserRole, string> = {
  individual: '성인',
  parent: '부모',
  child: '자녀',
};

export default function MyScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const setRole = useAuthStore((s) => s.setRole);
  const subscription = useBillingStore((s) => s.subscription);
  const setSubscription = useBillingStore((s) => s.setSubscription);
  const permissions = useMasterPermissions();
  const [deleteStep, setDeleteStep] = useState(0); // 0=숨김, 1=확인1, 2=확인2, 3=삭제중
  const [leaveLoading, setLeaveLoading] = useState(false);

  useEffect(() => {
    posthogScreen('MyTab');
  }, []);

  // ── 탈퇴 3단계 ──
  const handleDeleteStep1 = () => setDeleteStep(1);
  const handleDeleteStep2 = () => setDeleteStep(2);
  const handleDeleteConfirm = async () => {
    if (!user) return;
    setDeleteStep(3);
    try {
      await softDeleteAccount(user.uid);
      router.replace('/(auth)/login');
    } catch {
      Alert.alert(t('common_error'));
      setDeleteStep(0);
    }
  };

  // ── 가족 연결 해제 ──
  const handleLeaveFamily = () => {
    Alert.alert(
      '가족에서 나가기',
      '가족 연결을 해제하면 요청 카드와 가족 데이터에 접근할 수 없어요. 계속할까요?',
      [
        { text: t('common_cancel'), style: 'cancel' },
        {
          text: '나가기',
          style: 'destructive',
          onPress: async () => {
            if (!user?.familyId) return;
            setLeaveLoading(true);
            try {
              await removeMemberFromFamily(user.uid, user.familyId);
            } finally {
              setLeaveLoading(false);
            }
          },
        },
      ]
    );
  };

  // ── 개발자 도구 핸들러 ──
  const handleRoleSwitch = (role: UserRole) => {
    setRole(role);
    capture('dev_tools_role_switch', { role });
  };

  const handleSubscriptionToggle = () => {
    const nextPlanId: PlanId = subscription.planId === 'free' ? 'plus' : 'free';
    setSubscription({
      ...subscription,
      planId: nextPlanId,
      isActive: nextPlanId !== 'free',
    });
    capture('dev_tools_subscription_toggle', { planId: nextPlanId });
  };

  const handleUnlockAllAchievements = () => {
    Alert.alert('업적 전체 해금', '모든 업적이 해금되었습니다. (개발 전용)');
  };

  const handlePostHogTest = () => {
    capture('dev_tools_test', { timestamp: Date.now() });
    Alert.alert('PostHog', 'dev_tools_test 이벤트가 발송되었습니다.');
  };

  const menuItems = [
    { label: t('my_profile'), onPress: () => {} },
    {
      label: t('my_subscription'),
      onPress: () => router.push('/(adult)/paywall'),
    },
    {
      label: '업적 도감',
      onPress: () => router.push('/(adult)/achievements'),
    },
    {
      label: '뱃지 도감',
      onPress: () => router.push('/(adult)/badges'),
    },
    {
      label: t('my_family_manage'),
      onPress: user?.familyId ? handleLeaveFamily : () => {},
    },
    {
      label: t('my_notification'),
      onPress: () => {},
    },
    {
      label: t('my_share_scope'),
      onPress: () => {},
    },
    {
      label: '이용약관 / 개인정보처리방침',
      onPress: () => router.push('/(auth)/terms'),
    },
    { label: t('my_delete_account'), onPress: handleDeleteStep1 },
  ];

  return (
    <ScreenLayout>
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>{t('my_title')}</Text>

        <Card style={styles.profileCard}>
          <Text style={styles.name}>{user?.displayName ?? ''}</Text>
          <Text style={styles.email}>{user?.email ?? ''}</Text>
        </Card>

        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.label}
            style={styles.menuItem}
            onPress={item.onPress}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.menuText,
                item.label === t('my_delete_account') && styles.menuTextDanger,
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}

        <Text style={styles.disclaimer}>{t('my_not_financial_service')}</Text>

        {/* ── 개발자 도구 — 마스터 전용 (일반 유저 절대 노출 금지) ── */}
        {permissions.accessAllScreens && (
          <View style={styles.devSection}>
            <View style={styles.devHeader}>
              <Text style={styles.devWarning}>⚠️ 개발자 전용</Text>
              <Text style={styles.devTitle}>🔧 개발자 도구</Text>
            </View>

            {/* 역할 전환 */}
            <View style={styles.devBlock}>
              <Text style={styles.devLabel}>
                현재 역할: {ROLE_LABELS[user?.role ?? 'individual']}
              </Text>
              <View style={styles.devButtonRow}>
                {(['individual', 'parent', 'child'] as UserRole[]).map((role) => (
                  <TouchableOpacity
                    key={role}
                    style={[
                      styles.devRoleButton,
                      user?.role === role && styles.devRoleButtonActive,
                    ]}
                    onPress={() => handleRoleSwitch(role)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.devRoleButtonText,
                        user?.role === role && styles.devRoleButtonTextActive,
                      ]}
                    >
                      {ROLE_LABELS[role]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* 구독 전환 */}
            <View style={styles.devBlock}>
              <Text style={styles.devLabel}>
                구독 상태: {subscription.planId.toUpperCase()}
              </Text>
              <TouchableOpacity
                style={styles.devActionButton}
                onPress={handleSubscriptionToggle}
                activeOpacity={0.7}
              >
                <Text style={styles.devActionButtonText}>
                  {subscription.planId === 'free' ? 'Free → Plus 전환' : 'Plus → Free 전환'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* 업적 전체 해금 */}
            <View style={styles.devBlock}>
              <TouchableOpacity
                style={styles.devActionButton}
                onPress={handleUnlockAllAchievements}
                activeOpacity={0.7}
              >
                <Text style={styles.devActionButtonText}>업적 전체 해금</Text>
              </TouchableOpacity>
            </View>

            {/* PostHog 테스트 */}
            <View style={styles.devBlock}>
              <Text style={styles.devLabel}>PostHog 이벤트 테스트</Text>
              <TouchableOpacity
                style={styles.devActionButton}
                onPress={handlePostHogTest}
                activeOpacity={0.7}
              >
                <Text style={styles.devActionButtonText}>테스트 이벤트 발송</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* 탈퇴 모달 — 2단계 */}
      <Modal
        visible={deleteStep >= 1}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteStep(0)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            {deleteStep === 1 && (
              <>
                <Text style={styles.modalTitle}>정말 탈퇴하실 건가요?</Text>
                <Text style={styles.modalBody}>
                  탈퇴 후 30일 이내에 모든 데이터가 삭제됩니다.
                </Text>
                <Button
                  title="탈퇴 계속하기"
                  onPress={handleDeleteStep2}
                  variant="outline"
                />
                <Button
                  title={t('common_cancel')}
                  onPress={() => setDeleteStep(0)}
                  style={styles.modalCancelButton}
                />
              </>
            )}
            {deleteStep === 2 && (
              <>
                <Text style={styles.modalTitle}>마지막 확인</Text>
                <Text style={styles.modalBody}>
                  가족 연결, 기록, 계획이 모두 삭제됩니다. 이 작업은 되돌릴 수
                  없어요.
                </Text>
                <Button
                  title="탈퇴하기"
                  onPress={handleDeleteConfirm}
                  variant="outline"
                />
                <Button
                  title={t('common_cancel')}
                  onPress={() => setDeleteStep(0)}
                  style={styles.modalCancelButton}
                />
              </>
            )}
            {deleteStep === 3 && (
              <Text style={styles.modalTitle}>탈퇴 처리 중...</Text>
            )}
          </View>
        </View>
      </Modal>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, paddingTop: theme.spacing[6] },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing[5],
  },
  profileCard: { marginBottom: theme.spacing[5] },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing[1],
  },
  email: { fontSize: 14, color: theme.colors.textSecondary },
  menuItem: {
    paddingVertical: theme.spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    minHeight: 44,
    justifyContent: 'center',
  },
  menuText: { fontSize: 16, color: theme.colors.textPrimary },
  menuTextDanger: { color: '#E55' },
  disclaimer: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing[6],
    marginBottom: theme.spacing[6],
  },
  // ── 개발자 도구 ──
  devSection: {
    marginTop: theme.spacing[4],
    marginBottom: theme.spacing[8],
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#f59e0b',
    backgroundColor: '#1a1a2e',
    overflow: 'hidden',
  },
  devHeader: {
    backgroundColor: '#f59e0b',
    paddingVertical: theme.spacing[2],
    paddingHorizontal: theme.spacing[4],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  devWarning: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1a1a2e',
    letterSpacing: 0.5,
  },
  devTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a1a2e',
  },
  devBlock: {
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: '#2d2d44',
  },
  devLabel: {
    fontSize: 12,
    color: '#a0a0c0',
    marginBottom: theme.spacing[2],
  },
  devButtonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  devRoleButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#3d3d5c',
    alignItems: 'center',
  },
  devRoleButtonActive: {
    backgroundColor: '#f59e0b',
    borderColor: '#f59e0b',
  },
  devRoleButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#a0a0c0',
  },
  devRoleButtonTextActive: {
    color: '#1a1a2e',
  },
  devActionButton: {
    paddingVertical: 10,
    borderRadius: 6,
    backgroundColor: '#2d2d44',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3d3d5c',
  },
  devActionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#e0e0f0',
  },
  // ── 모달 ──
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: theme.spacing[5],
  },
  modalBox: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.card,
    padding: theme.spacing[6],
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing[3],
  },
  modalBody: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 22,
    marginBottom: theme.spacing[5],
  },
  modalCancelButton: { marginTop: theme.spacing[2] },
});
