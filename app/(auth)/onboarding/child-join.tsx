import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScreenLayout } from '../../../src/ui/layouts/ScreenLayout';
import { Button } from '../../../src/ui/components/Button';
import { theme } from '../../../src/ui/theme';
import { isValidInviteCode } from '../../../src/utils/validators';
import { useAuthStore } from '../../../src/engines/auth/authStore';
import { joinFamilyByCode } from '../../../src/engines/family/familyService';
import { isUnder14, createConsent } from '../../../src/engines/consent/consentService';
import { completeOnboarding } from '../../../src/engines/auth/authService';

export default function ChildJoinScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const [inviteCode, setInviteCode] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [guardianEmail, setGuardianEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const currentYear = new Date().getFullYear();
  const birthYearNum = parseInt(birthYear, 10);
  const needsConsent =
    birthYear.length === 4 && birthYearNum > 0 && isUnder14(birthYearNum);

  const canProceed =
    isValidInviteCode(inviteCode) &&
    birthYear.length === 4 &&
    birthYearNum > 0 &&
    (!needsConsent || guardianEmail.trim().length > 0);

  const handleJoin = async () => {
    if (!canProceed || !user) return;
    setLoading(true);
    try {
      const family = await joinFamilyByCode(
        user.uid,
        user.displayName,
        inviteCode
      );

      if (!family) {
        Alert.alert('초대 코드 오류', '유효하지 않거나 만료된 코드예요.');
        return;
      }

      // 14세 미만: 동의 생성
      if (needsConsent) {
        await createConsent(
          family.ownerUid,
          user.uid,
          user.displayName,
          birthYearNum
        );
      }

      await completeOnboarding(user.uid);
      router.replace('/');
    } catch {
      Alert.alert(t('common_error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenLayout>
      <ScrollView style={styles.scroll}>
        <Text style={styles.title}>{t('onboarding_child_invite_title')}</Text>

        <TextInput
          style={styles.input}
          placeholder={t('onboarding_child_invite_placeholder')}
          placeholderTextColor={theme.colors.textSecondary}
          value={inviteCode}
          onChangeText={(v) => setInviteCode(v.toUpperCase())}
          maxLength={6}
          autoCapitalize="characters"
          autoCorrect={false}
        />

        <Text style={styles.label}>출생 연도</Text>
        <TextInput
          style={styles.input}
          placeholder={`예: ${currentYear - 12}`}
          placeholderTextColor={theme.colors.textSecondary}
          value={birthYear}
          onChangeText={setBirthYear}
          keyboardType="numeric"
          maxLength={4}
        />

        {needsConsent && (
          <View style={styles.consentBox}>
            <Text style={styles.consentText}>
              만 14세 미만의 경우, 부모님(법정대리인) 동의가 필요해요.
            </Text>
            <Text style={styles.label}>부모님 이메일</Text>
            <TextInput
              style={styles.input}
              placeholder="부모님 이메일을 입력해주세요"
              placeholderTextColor={theme.colors.textSecondary}
              value={guardianEmail}
              onChangeText={setGuardianEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="참여하기"
          onPress={handleJoin}
          disabled={!canProceed}
          loading={loading}
        />
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    paddingTop: theme.spacing[6],
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing[6],
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing[2],
    marginTop: theme.spacing[4],
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.input,
    paddingHorizontal: theme.spacing[4],
    fontSize: 16,
    color: theme.colors.textPrimary,
    backgroundColor: theme.colors.surface,
  },
  consentBox: {
    marginTop: theme.spacing[4],
    padding: theme.spacing[4],
    backgroundColor: '#FEF9F0',
    borderRadius: theme.borderRadius.card,
    borderWidth: 1,
    borderColor: theme.colors.warning,
  },
  consentText: {
    fontSize: 14,
    color: theme.colors.textPrimary,
    lineHeight: 20,
    marginBottom: theme.spacing[3],
  },
  footer: {
    paddingVertical: theme.spacing[4],
  },
});
