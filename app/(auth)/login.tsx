import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { sendPasswordResetEmail } from 'firebase/auth';
import { getFirebaseAuth } from '../../src/lib/firebase';
import { ScreenLayout } from '../../src/ui/layouts/ScreenLayout';
import { Button } from '../../src/ui/components/Button';
import { theme } from '../../src/ui/theme';
import { signInWithEmail, getAuthErrorMessage } from '../../src/engines/auth/authService';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setError('이메일을 먼저 입력해주세요');
      return;
    }
    try {
      await sendPasswordResetEmail(getFirebaseAuth(), email.trim());
      setError('');
      Alert.alert(
        '이메일을 보냈어요',
        `${email.trim()}로 비밀번호 재설정 링크를 보냈어요`
      );
    } catch (e: unknown) {
      setError(getAuthErrorMessage((e as { code?: string })?.code ?? ''));
    }
  };

  const handleLogin = async () => {
    if (!email.trim()) {
      setError('이메일을 입력해주세요');
      return;
    }
    if (!password) {
      setError('비밀번호를 입력해주세요');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await signInWithEmail(email.trim(), password);
      // AuthGate가 자동으로 리다이렉트
    } catch (e: unknown) {
      setError(getAuthErrorMessage((e as { code?: string })?.code ?? ''));
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
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
      <View style={styles.container}>
        <Text style={styles.title}>Mily</Text>
        <Text style={styles.slogan}>미루지 않는 경제 대화, Mily</Text>

        <TextInput
          style={styles.input}
          placeholder="이메일"
          placeholderTextColor={theme.colors.textSecondary}
          value={email}
          onChangeText={(text) => { setEmail(text); setError(''); }}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <View style={styles.passwordRow}>
          <TextInput
            style={styles.passwordInput}
            placeholder="비밀번호"
            placeholderTextColor={theme.colors.textSecondary}
            value={password}
            onChangeText={(text) => { setPassword(text); setError(''); }}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowPassword((v) => !v)}
            accessibilityLabel={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
          >
            <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁'}</Text>
          </TouchableOpacity>
        </View>

        {error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : null}

        <Button
          title="로그인"
          onPress={handleLogin}
          disabled={loading}
          loading={loading}
          style={styles.loginButton}
        />

        <TouchableOpacity
          onPress={handleForgotPassword}
          style={styles.forgotButton}
          activeOpacity={0.7}
        >
          <Text style={styles.forgotText}>비밀번호를 잊으셨나요?</Text>
        </TouchableOpacity>

        <Button
          title="가입하기"
          onPress={() => router.push('/(auth)/register')}
          variant="outline"
          disabled={loading}
          style={styles.registerButton}
        />
      </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenLayout>
  );
}

// re-export so tests can import cleanly
export {};

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
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.input,
    backgroundColor: theme.colors.surface,
    marginBottom: theme.spacing[3],
  },
  passwordInput: {
    flex: 1,
    height: 48,
    paddingHorizontal: theme.spacing[4],
    fontSize: 16,
    color: theme.colors.textPrimary,
  },
  eyeButton: {
    paddingHorizontal: theme.spacing[3],
    height: 48,
    justifyContent: 'center',
  },
  eyeIcon: {
    fontSize: 18,
  },
  errorText: {
    color: '#E8503A',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: theme.spacing[3],
  },
  loginButton: {
    marginTop: theme.spacing[2],
  },
  forgotButton: {
    alignSelf: 'center',
    marginTop: theme.spacing[3],
  },
  forgotText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    textDecorationLine: 'underline',
  },
  registerButton: {
    marginTop: theme.spacing[3],
  },
});
