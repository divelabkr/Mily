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
import { useConfigStore } from '../../src/engines/config/configStore';
import { FeatureFlags, DEFAULT_FLAGS } from '../../src/engines/config/featureFlags';
import { getToken, requestPermission } from '../../src/engines/notification/pushTokenService';
import * as Clipboard from 'expo-clipboard';
import type { UserRole } from '../../src/engines/auth/authStore';
import type { PlanId } from '../../src/engines/billing/plans';
import { sendCoupon, getEligibleUsers } from '../../src/engines/reward/rewardService';
import type { CouponBrand, CouponValue } from '../../src/engines/reward/rewardTypes';
import { TextInput } from 'react-native';

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
  const configFlags = useConfigStore((s) => s.flags);
  const setConfigFlag = useConfigStore((s) => s.setFlag);
  const [deleteStep, setDeleteStep] = useState(0); // 0=숨김, 1=확인1, 2=확인2, 3=삭제중
  const [leaveLoading, setLeaveLoading] = useState(false);
  const [fcmToken, setFcmToken] = useState<string | null>(null);

  // ── 쿠폰 발송 (마스터 전용) ──
  const [couponTargetUid, setCouponTargetUid] = useState('');
  const [couponBrand, setCouponBrand] = useState<CouponBrand>('스타벅스');
  const [couponValue, setCouponValue] = useState<CouponValue>(5000);
  const [couponCode, setCouponCode] = useState('');
  const [couponMessage, setCouponMessage] = useState(
    '약속을 잘 지켜줬어요! Mily가 보내는 작은 선물이에요 🎁'
  );
  const [eligibleUsers, setEligibleUsers] = useState<string[] | null>(null);
  const [eligibleLoading, setEligibleLoading] = useState(false);
  const [couponSending, setCouponSending] = useState(false);

  useEffect(() => {
    posthogScreen('MyTab');
  }, []);

  // 개발자 도구: FCM 토큰 자동 로드 (마스터 전용)
  useEffect(() => {
    if (!permissions.accessAllScreens) return;
    getToken().then(setFcmToken).catch(() => {});
  }, [permissions.accessAllScreens]);

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

  const handleMaintenanceToggle = () => {
    const next = !configFlags[FeatureFlags.MAINTENANCE_MODE];
    setConfigFlag(FeatureFlags.MAINTENANCE_MODE, next);
    capture('dev_tools_maintenance_toggle', { value: next });
  };

  // ── 쿠폰 핸들러 ──
  const handleFetchEligible = async () => {
    setEligibleLoading(true);
    try {
      const uids = await getEligibleUsers();
      setEligibleUsers(uids);
    } catch {
      Alert.alert('오류', '조건 충족 유저 조회에 실패했습니다.');
    } finally {
      setEligibleLoading(false);
    }
  };

  const handleSendCoupon = async () => {
    if (!couponTargetUid.trim()) {
      Alert.alert('오류', '유저 UID를 입력해주세요.');
      return;
    }
    if (!couponCode.trim()) {
      Alert.alert('오류', '쿠폰 코드를 입력해주세요.');
      return;
    }
    setCouponSending(true);
    try {
      await sendCoupon(couponTargetUid.trim(), {
        title: '🎁 Mily 깜짝 선물',
        description: couponMessage,
        couponCode: couponCode.trim(),
        brand: couponBrand,
        value: couponValue,
        recipientUid: couponTargetUid.trim(),
        isMinor: true, // 마스터 UI에서는 isMinor=true로 기본 처리 (자녀 대상)
        sentAt: new Date(),
      });
      Alert.alert('발송 완료', `${couponBrand} ${couponValue.toLocaleString()}원 쿠폰이 발송됐습니다.`);
      setCouponTargetUid('');
      setCouponCode('');
    } catch (err) {
      const message = err instanceof Error ? err.message : '발송 실패';
      if (message.includes('미충족')) {
        Alert.alert('발송 조건 미충족', '5개월 이상 / 이행률 90% / 활성 구독자 조건을 확인하세요.');
      } else {
        Alert.alert('오류', message);
      }
    } finally {
      setCouponSending(false);
    }
  };

  const handleCopyToken = async () => {
    if (!fcmToken) {
      Alert.alert('토큰 없음', '아직 FCM 토큰이 발급되지 않았습니다.');
      return;
    }
    await Clipboard.setStringAsync(fcmToken);
    Alert.alert('복사 완료', '토큰이 클립보드에 복사됐습니다.');
  };

  const handlePushTest = async () => {
    if (!fcmToken) {
      Alert.alert('토큰 없음', '먼저 [권한 재요청]을 눌러 토큰을 발급받으세요.');
      return;
    }
    await Clipboard.setStringAsync(fcmToken);
    capture('dev_push_test', { timestamp: Date.now() });
    Alert.alert(
      '테스트 발송 안내',
      'FCM 토큰이 복사됐습니다.\nFirebase Console → Messaging → 알림 테스트에서 토큰을 붙여넣어 발송하세요.'
    );
  };

  const handleRequestPermission = async () => {
    const granted = await requestPermission();
    if (granted) {
      const token = await getToken();
      setFcmToken(token);
      Alert.alert('권한 허용됨', token ? '토큰이 발급됐습니다.' : '토큰 발급에 실패했습니다.');
    } else {
      Alert.alert('권한 거부됨', '설정에서 알림 권한을 허용해 주세요.');
    }
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

            {/* 🚩 Feature Flags */}
            <View style={styles.devBlock}>
              <Text style={styles.devLabel}>🚩 Feature Flags</Text>
              {Object.entries(FeatureFlags).map(([name, key]) => {
                const val = configFlags[key] ?? DEFAULT_FLAGS[key];
                return (
                  <View key={key} style={styles.devFlagRow}>
                    <Text style={styles.devFlagKey} numberOfLines={1}>
                      {key}
                    </Text>
                    <Text
                      style={[
                        styles.devFlagValue,
                        val === true && styles.devFlagValueTrue,
                        val === false && styles.devFlagValueFalse,
                      ]}
                    >
                      {String(val)}
                    </Text>
                  </View>
                );
              })}
            </View>

            {/* 📱 푸시 알림 테스트 */}
            <View style={styles.devBlock}>
              <Text style={styles.devLabel}>📱 푸시 알림 테스트</Text>
              <Text style={styles.devFcmToken} numberOfLines={1}>
                {fcmToken
                  ? `${fcmToken.slice(0, 20)}...`
                  : '(토큰 없음 — 권한 재요청 필요)'}
              </Text>
              <View style={styles.devButtonRow}>
                <TouchableOpacity
                  style={[styles.devActionButton, styles.devButtonFlex]}
                  onPress={handleCopyToken}
                  activeOpacity={0.7}
                >
                  <Text style={styles.devActionButtonText}>토큰 복사</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.devActionButton, styles.devButtonFlex]}
                  onPress={handlePushTest}
                  activeOpacity={0.7}
                >
                  <Text style={styles.devActionButtonText}>테스트 발송</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={[styles.devActionButton, { marginTop: 6 }]}
                onPress={handleRequestPermission}
                activeOpacity={0.7}
              >
                <Text style={styles.devActionButtonText}>권한 재요청</Text>
              </TouchableOpacity>
            </View>

            {/* maintenance_mode 로컬 토글 */}
            <View style={styles.devBlock}>
              <Text style={styles.devLabel}>maintenance_mode 로컬 테스트</Text>
              <TouchableOpacity
                style={[
                  styles.devActionButton,
                  configFlags[FeatureFlags.MAINTENANCE_MODE] === true &&
                    styles.devActionButtonActive,
                ]}
                onPress={handleMaintenanceToggle}
                activeOpacity={0.7}
              >
                <Text style={styles.devActionButtonText}>
                  {configFlags[FeatureFlags.MAINTENANCE_MODE]
                    ? '🔴 점검모드 ON → OFF로 전환'
                    : '⚪ 점검모드 OFF → ON으로 전환'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* 🎁 쿠폰 발송 (마스터 전용) */}
            <View style={styles.devBlock}>
              <Text style={styles.devLabel}>🎁 쿠폰 발송</Text>

              {/* 조건 충족 유저 조회 */}
              <TouchableOpacity
                style={styles.devActionButton}
                onPress={handleFetchEligible}
                disabled={eligibleLoading}
                activeOpacity={0.7}
              >
                <Text style={styles.devActionButtonText}>
                  {eligibleLoading ? '조회 중...' : '조건 충족 유저 조회'}
                </Text>
              </TouchableOpacity>
              {eligibleUsers !== null && (
                <Text style={[styles.devFcmToken, { marginTop: 4 }]}>
                  {eligibleUsers.length}명 충족
                  {eligibleUsers.length > 0 ? `: ${eligibleUsers.slice(0, 2).join(', ')}${eligibleUsers.length > 2 ? ' ...' : ''}` : ''}
                </Text>
              )}

              {/* 유저 UID 입력 */}
              <TextInput
                style={styles.devInput}
                placeholder="유저 UID"
                placeholderTextColor={theme.colors.textSecondary}
                value={couponTargetUid}
                onChangeText={setCouponTargetUid}
                autoCapitalize="none"
              />

              {/* 브랜드 선택 */}
              <Text style={[styles.devFcmToken, { marginBottom: 4 }]}>브랜드</Text>
              <View style={styles.devButtonRow}>
                {(['스타벅스', 'CU', 'GS25', '기타'] as CouponBrand[]).map((b) => (
                  <TouchableOpacity
                    key={b}
                    style={[
                      styles.devRoleButton,
                      couponBrand === b && styles.devRoleButtonActive,
                    ]}
                    onPress={() => setCouponBrand(b)}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.devRoleButtonText,
                      couponBrand === b && styles.devRoleButtonTextActive,
                    ]}>
                      {b}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* 금액 선택 */}
              <Text style={[styles.devFcmToken, { marginBottom: 4, marginTop: 8 }]}>금액</Text>
              <View style={styles.devButtonRow}>
                {([2000, 3000, 5000] as CouponValue[]).map((v) => (
                  <TouchableOpacity
                    key={v}
                    style={[
                      styles.devRoleButton,
                      couponValue === v && styles.devRoleButtonActive,
                    ]}
                    onPress={() => setCouponValue(v)}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.devRoleButtonText,
                      couponValue === v && styles.devRoleButtonTextActive,
                    ]}>
                      {v.toLocaleString()}원
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* 쿠폰 코드 입력 */}
              <TextInput
                style={[styles.devInput, { marginTop: 8 }]}
                placeholder="쿠폰 코드 (예: STBK-2025-ABCD)"
                placeholderTextColor={theme.colors.textSecondary}
                value={couponCode}
                onChangeText={setCouponCode}
                autoCapitalize="characters"
              />

              {/* 메시지 입력 */}
              <TextInput
                style={[styles.devInput, { height: 64, textAlignVertical: 'top' }]}
                placeholder="메시지"
                placeholderTextColor={theme.colors.textSecondary}
                value={couponMessage}
                onChangeText={setCouponMessage}
                multiline
              />

              {/* 발송 버튼 */}
              <TouchableOpacity
                style={[styles.devActionButton, couponSending && styles.devActionButtonActive]}
                onPress={handleSendCoupon}
                disabled={couponSending}
                activeOpacity={0.7}
              >
                <Text style={styles.devActionButtonText}>
                  {couponSending ? '발송 중...' : '🎁 발송'}
                </Text>
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
  devActionButtonActive: {
    backgroundColor: '#7f1d1d',
    borderColor: '#ef4444',
  },
  devFlagRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#23233a',
  },
  devFlagKey: {
    fontSize: 11,
    color: '#8080a0',
    flex: 1,
    marginRight: 8,
  },
  devFlagValue: {
    fontSize: 11,
    fontWeight: '700',
    color: '#a0a0c0',
  },
  devFlagValueTrue: { color: '#4ade80' },
  devFlagValueFalse: { color: '#6b7280' },
  devFcmToken: {
    fontSize: 11,
    color: '#60a5fa',
    fontFamily: 'monospace' as const,
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  devButtonFlex: { flex: 1 },
  devInput: {
    backgroundColor: '#2a2a3e',
    borderWidth: 1,
    borderColor: '#4a4a6a',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: '#e2e8f0',
    fontSize: 13,
    marginTop: 6,
    minHeight: 40,
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
