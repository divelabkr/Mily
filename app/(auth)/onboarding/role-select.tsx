import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScreenLayout } from '../../../src/ui/layouts/ScreenLayout';
import { Button } from '../../../src/ui/components/Button';
import { Card } from '../../../src/ui/components/Card';
import { theme } from '../../../src/ui/theme';
import { useAuthStore } from '../../../src/engines/auth/authStore';

export default function RoleSelectScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const setRole = useAuthStore((s) => s.setRole);

  const handleIndividual = () => {
    setRole('individual');
    router.push('/(auth)/onboarding/first-plan');
  };

  const handleParent = () => {
    setRole('parent');
    router.push('/(auth)/onboarding/first-plan');
  };

  const handleChild = () => {
    setRole('child');
    router.push('/(auth)/onboarding/child-join');
  };

  return (
    <ScreenLayout>
      <View style={styles.container}>
        <Text style={styles.title}>{t('onboarding_role_title')}</Text>

        <Card style={styles.card}>
          <Button
            title={t('onboarding_role_individual')}
            onPress={handleIndividual}
            variant="outline"
            style={styles.roleButton}
          />
        </Card>

        <Card style={styles.card}>
          <Button
            title={t('onboarding_role_family')}
            onPress={handleParent}
            variant="outline"
            style={styles.roleButton}
          />
        </Card>

        <Card style={styles.card}>
          <Button
            title="자녀로 참여하기"
            onPress={handleChild}
            variant="outline"
            style={styles.roleButton}
          />
        </Card>
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing[4],
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginBottom: theme.spacing[7],
  },
  card: {
    marginBottom: theme.spacing[4],
  },
  roleButton: {
    borderWidth: 0,
  },
});
