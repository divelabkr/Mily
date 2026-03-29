import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScreenLayout } from '../../src/ui/layouts/ScreenLayout';
import { Button } from '../../src/ui/components/Button';
import { theme } from '../../src/ui/theme';
import { isValidEmail, isValidPassword } from '../../src/utils/validators';
import { signUpWithEmail, getAuthErrorMessage } from '../../src/engines/auth/authService';

export default function RegisterScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const isValid =
    isValidEmail(email) && isValidPassword(password) && name.trim().length > 0;

  const handleRegister = async () => {
    if (!isValid) return;
    setLoading(true);
    try {
      await signUpWithEmail(email, password, name.trim(), 'individual');
      // 가입 성공 → AuthGate가 onboarding/role-select로 자동 이동
    } catch (e: unknown) {
      Alert.alert(t('auth_register'), getAuthErrorMessage((e as { code?: string })?.code ?? ''));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenLayout>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
      <View style={styles.container}>
        <Text style={styles.title}>{t('auth_register')}</Text>

        <TextInput
          style={styles.input}
          placeholder={t('onboarding_child_name_placeholder')}
          placeholderTextColor={theme.colors.textSecondary}
          value={name}
          onChangeText={setName}
        />

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
          title={t('auth_register')}
          onPress={handleRegister}
          disabled={!isValid}
          loading={loading}
        />

        <Button
          title={t('common_back')}
          onPress={() => router.back()}
          variant="outline"
          style={styles.backButton}
        />
      </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  backButton: {
    marginTop: theme.spacing[3],
  },
});
