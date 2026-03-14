import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ScreenLayout } from '../../src/ui/layouts/ScreenLayout';
import { Button } from '../../src/ui/components/Button';
import { theme } from '../../src/ui/theme';
import { isValidEmail, isValidPassword } from '../../src/utils/validators';
import { signInWithEmail } from '../../src/engines/auth/authService';
import { useRouter } from 'expo-router';

export default function LoginScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const isValid = isValidEmail(email) && isValidPassword(password);

  const handleLogin = async () => {
    if (!isValid) return;
    setLoading(true);
    try {
      await signInWithEmail(email, password);
      // AuthGate가 자동으로 리다이렉트
    } catch (e: unknown) {
      const msg =
        e instanceof Error ? e.message : t('common_error');
      Alert.alert(t('auth_login'), msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenLayout>
      <View style={styles.container}>
        <Text style={styles.title}>{t('app_name')}</Text>
        <Text style={styles.slogan}>{t('slogan')}</Text>

        <TextInput
          style={styles.input}
          placeholder={t('auth_email_placeholder')}
          placeholderTextColor={theme.colors.textSecondary}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <TextInput
          style={styles.input}
          placeholder={t('auth_password_placeholder')}
          placeholderTextColor={theme.colors.textSecondary}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <Button
          title={t('auth_login')}
          onPress={handleLogin}
          disabled={!isValid}
          loading={loading}
        />

        <Button
          title={t('auth_register')}
          onPress={() => router.push('/(auth)/register')}
          variant="outline"
          style={styles.registerButton}
        />
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
    fontSize: 32,
    fontWeight: '700',
    color: theme.colors.primary,
    textAlign: 'center',
    marginBottom: theme.spacing[2],
  },
  slogan: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing[7],
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
    marginBottom: theme.spacing[3],
  },
  registerButton: {
    marginTop: theme.spacing[3],
  },
});
