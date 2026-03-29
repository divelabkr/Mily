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
  Modal,
  ActivityIndicator,
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

  // ── 비밀번호 재설정 모달 상태 ──
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const openResetModal = () => {
    setResetEmail(email.trim()); // 로그인 폼 이메일 자동 채우기
    setShowResetModal(true);
  };

  const handleForgotPassword = async () => {
    const target = resetEmail.trim();

    if (!target) {
      Alert.alert('이메일 입력', '비밀번호를 재설정할 이메일을 입력해주세요', [
        { text: '확인' },
      ]);
      return;
    }

    setResetLoading(true);
    try {
      await sendPasswordResetEmail(getFirebaseAuth(), target, {
        url: 'https://mily-lab-dev.web.app',
        handleCodeInApp: false,
      });
      Alert.alert(
        '이메일을 보냈어요 ✉️',
        `${target}으로 비밀번호 재설정 링크를 보냈어요.\n\n이메일이 안 오면 스팸함을 확인해주세요.`,
        [{ text: '확인', onPress: () => setShowResetModal(false) }]
      );
    } catch (e: unknown) {
      const code = (e as { code?: string })?.code ?? '';
      const msg =
        code === 'auth/user-not-found'
          ? '등록되지 않은 이메일이에요'
          : code === 'auth/invalid-email'
          ? '이메일 형식이 맞지 않아요'
          : code === 'auth/too-many-requests'
          ? '잠시 후 다시 시도해주세요'
          : code === 'auth/network-request-failed'
          ? '네트워크 연결을 확인해주세요'
          : '문제가 생겼어요. 다시 시도해주세요';
      Alert.alert('오류', msg, [{ text: '확인' }]);
    } finally {
      setResetLoading(false);
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
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
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
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <Button
              title="로그인"
              onPress={handleLogin}
              disabled={loading}
              loading={loading}
              style={styles.loginButton}
            />

            <TouchableOpacity
              onPress={openResetModal}
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

      {/* ── 비밀번호 재설정 모달 ── */}
      <Modal
        visible={showResetModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowResetModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>비밀번호 재설정</Text>
            <Text style={styles.modalSub}>
              가입할 때 사용한 이메일을 입력하면{'\n'}재설정 링크를 보내드려요.
            </Text>

            <TextInput
              style={styles.modalInput}
              value={resetEmail}
              onChangeText={setResetEmail}
              placeholder="이메일 주소"
              placeholderTextColor={theme.colors.textSecondary}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
            />

            <TouchableOpacity
              style={[styles.sendButton, resetLoading && styles.sendButtonDisabled]}
              onPress={handleForgotPassword}
              disabled={resetLoading}
              activeOpacity={0.8}
            >
              {resetLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.sendButtonText}>재설정 링크 보내기</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowResetModal(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelButtonText}>취소</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  errorContainer: {
    backgroundColor: '#FFF0ED',
    borderRadius: 10,
    padding: 12,
    marginTop: 4,
    marginBottom: theme.spacing[2],
  },
  errorText: {
    color: '#E8503A',
    fontSize: 13,
    textAlign: 'center',
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
  // ── 모달 ──
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: theme.colors.background,
    borderRadius: 20,
    padding: 28,
    width: '100%',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 8,
  },
  modalSub: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 20,
    marginBottom: 20,
  },
  modalInput: {
    height: 48,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.input,
    paddingHorizontal: theme.spacing[4],
    fontSize: 16,
    color: theme.colors.textPrimary,
    backgroundColor: theme.colors.surface,
    marginBottom: theme.spacing[4],
  },
  sendButton: {
    height: 48,
    borderRadius: theme.borderRadius.button ?? 12,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing[3],
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    alignSelf: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
});
