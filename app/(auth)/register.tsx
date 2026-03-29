import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
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
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isValid =
    isValidEmail(email) && isValidPassword(password) && name.trim().length > 0;

  const handleRegister = async () => {
    if (!isValid) return;
    setError('');
    setLoading(true);
    console.log('[SignUp] 시도:', email);
    try {
      console.log('[SignUp] signUpWithEmail 호출 시작');
      await signUpWithEmail(email, password, name.trim(), 'individual');
      console.log('[SignUp] 성공 → AuthGate가 onboarding으로 이동');
      // 가입 성공 → AuthGate가 onboarding/role-select로 자동 이동
    } catch (e: unknown) {
      const code = (e as { code?: string })?.code ?? '';
      const message = (e as { message?: string })?.message ?? '';
      console.log('[SignUp] 에러 코드:', code);
      console.log('[SignUp] 에러 메시지:', message);
      setError(getAuthErrorMessage(code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenLayout>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.container}>
            <Text style={styles.title}>{t('auth_register')}</Text>

            <TextInput
              style={styles.input}
              placeholder={t('onboarding_child_name_placeholder')}
              placeholderTextColor={theme.colors.textSecondary}
              value={name}
              onChangeText={(text) => { setName(text); setError(''); }}
            />

            <TextInput
              style={styles.input}
              placeholder={t('auth_email_placeholder')}
              placeholderTextColor={theme.colors.textSecondary}
              value={email}
              onChangeText={(text) => { setEmail(text); setError(''); }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <TextInput
              style={styles.input}
              placeholder={t('auth_password_placeholder')}
              placeholderTextColor={theme.colors.textSecondary}
              value={password}
              onChangeText={(text) => { setPassword(text); setError(''); }}
              secureTextEntry
            />

            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <Button
              title={t('auth_register')}
              onPress={handleRegister}
              disabled={!isValid || loading}
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
  errorContainer: {
    backgroundColor: '#FFF0ED',
    borderRadius: 10,
    padding: 12,
    marginTop: 4,
    marginBottom: theme.spacing[3],
  },
  errorText: {
    color: '#E8503A',
    fontSize: 13,
    textAlign: 'center',
  },
  backButton: {
    marginTop: theme.spacing[3],
  },
});
