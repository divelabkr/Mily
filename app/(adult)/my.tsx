import React, { useState } from 'react';
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

export default function MyScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [deleteStep, setDeleteStep] = useState(0); // 0=숨김, 1=확인1, 2=확인2, 3=삭제중
  const [leaveLoading, setLeaveLoading] = useState(false);

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
