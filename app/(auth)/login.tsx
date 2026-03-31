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
import { SafeAreaView } from 'react-native-safe-area-context';
import { sendPasswordResetEmail } from 'firebase/auth';
import { getFirebaseAuth } from '../../src/lib/firebase';
import { theme } from '../../src/ui/theme';
import { signInWithEmail, getAuthErrorMessage } from '../../src/engines/auth/authService';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const openResetModal = () => {
    setResetEmail(email.trim());
    setShowResetModal(true);
  };

  const handleForgotPassword = async () => {
    const target = resetEmail.trim();
    if (!target) {
      Alert.alert('이메일 입력', '비밀번호를 재설정할 이메일을 입력해주세요', [{ text: '확인' }]);
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
        code === 'auth/user-not-found' ? '등록되지 않은 이메일이에요' :
        code === 'auth/invalid-email' ? '이메일 형식이 맞지 않아요' :
        code === 'auth/too-many-requests' ? '잠시 후 다시 시도해주세요' :
        code === 'auth/network-request-failed' ? '네트워크 연결을 확인해주세요' :
        '문제가 생겼어요. 다시 시도해주세요';
      Alert.alert('오류', msg, [{ text: '확인' }]);
    } finally {
      setResetLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email.trim()) { setError('이메일을 입력해주세요'); return; }
    if (!password) { setError('비밀번호를 입력해주세요'); return; }
    setError('');
    setLoading(true);
    try {
      await signInWithEmail(email.trim(), password);
    } catch (e: unknown) {
      const code = (e as { code?: string })?.code ?? '';
      setError(getAuthErrorMessage(code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.container}>
            {/* 로고 영역 */}
            <View style={styles.logoArea}>
              <Text style={styles.logoEmoji}>🌱</Text>
              <Text style={styles.logoText}>Mily</Text>
              <Text style={styles.slogan}>돈 얘기가 대화가 되는 순간</Text>
            </View>

            {/* 입력 영역 */}
            <View style={styles.formArea}>
              <TextInput
                style={styles.input}
                placeholder="이메일"
                placeholderTextColor={theme.milyColors.brownLight}
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
                  placeholderTextColor={theme.milyColors.brownLight}
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

              <TouchableOpacity
                style={[styles.loginButton, loading && styles.loginButtonDisabled]}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.loginButtonText}>로그인</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={openResetModal}
                style={styles.forgotButton}
                activeOpacity={0.7}
              >
                <Text style={styles.forgotText}>비밀번호를 잊으셨나요?</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.registerButton}
                onPress={() => router.push('/(auth)/register')}
                disabled={loading}
                activeOpacity={0.85}
              >
                <Text style={styles.registerButtonText}>가입하기</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* 비밀번호 재설정 모달 */}
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
              placeholderTextColor={theme.milyColors.brownLight}
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
    </SafeAreaView>
  );
}

export {};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.milyColors.cream,
  },
  container: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: 'center',
  },
  logoArea: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  logoText: {
    fontSize: 48,
    fontWeight: '700',
    color: theme.milyColors.brownDark,
    letterSpacing: -1,
    marginBottom: 10,
  },
  slogan: {
    fontSize: 15,
    color: theme.milyColors.brownMid,
    letterSpacing: 0.2,
  },
  formArea: {
    gap: 0,
  },
  input: {
    height: 52,
    borderWidth: 1.5,
    borderColor: theme.milyColors.surface2,
    borderRadius: theme.borderRadius.input,
    paddingHorizontal: 16,
    fontSize: 16,
    color: theme.milyColors.brownDark,
    backgroundColor: theme.colors.surface,
    marginBottom: 12,
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: theme.milyColors.surface2,
    borderRadius: theme.borderRadius.input,
    backgroundColor: theme.colors.surface,
    marginBottom: 12,
  },
  passwordInput: {
    flex: 1,
    height: 52,
    paddingHorizontal: 16,
    fontSize: 16,
    color: theme.milyColors.brownDark,
  },
  eyeButton: {
    paddingHorizontal: 14,
    height: 52,
    justifyContent: 'center',
  },
  eyeIcon: { fontSize: 18 },
  errorContainer: {
    backgroundColor: '#FFF0ED',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  errorText: {
    color: theme.milyColors.coral,
    fontSize: 13,
    textAlign: 'center',
  },
  loginButton: {
    height: 52,
    borderRadius: theme.borderRadius.button,
    backgroundColor: theme.milyColors.coral,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  loginButtonDisabled: { opacity: 0.55 },
  loginButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  forgotButton: {
    alignSelf: 'center',
    marginBottom: 16,
  },
  forgotText: {
    fontSize: 13,
    color: theme.milyColors.brownMid,
    textDecorationLine: 'underline',
  },
  registerButton: {
    height: 52,
    borderRadius: theme.borderRadius.button,
    borderWidth: 1.5,
    borderColor: theme.milyColors.coral,
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerButtonText: {
    color: theme.milyColors.coral,
    fontSize: 17,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: theme.milyColors.cream,
    borderRadius: 20,
    padding: 28,
    width: '100%',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.milyColors.brownDark,
    marginBottom: 8,
  },
  modalSub: {
    fontSize: 13,
    color: theme.milyColors.brownMid,
    lineHeight: 20,
    marginBottom: 20,
  },
  modalInput: {
    height: 52,
    borderWidth: 1.5,
    borderColor: theme.milyColors.surface2,
    borderRadius: theme.borderRadius.input,
    paddingHorizontal: 16,
    fontSize: 16,
    color: theme.milyColors.brownDark,
    backgroundColor: theme.colors.surface,
    marginBottom: 16,
  },
  sendButton: {
    height: 52,
    borderRadius: theme.borderRadius.button,
    backgroundColor: theme.milyColors.coral,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  sendButtonDisabled: { opacity: 0.6 },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: { alignSelf: 'center' },
  cancelButtonText: {
    fontSize: 14,
    color: theme.milyColors.brownMid,
  },
});
