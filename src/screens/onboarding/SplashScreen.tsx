// SplashScreen.tsx — 스플래시 / 시작 화면
// dark brown 배경, Mily 로고, 소셜 로그인
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { theme } from '../../ui/theme';

interface SplashScreenProps {
  onStart: () => void;
  onLogin: () => void;
  onKakao?: () => void;
  onApple?: () => void;
}

export function SplashScreen({ onStart, onLogin, onKakao, onApple }: SplashScreenProps) {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.milyColors.brownDark} />
      <View style={styles.center}>
        <Text style={styles.icon}>🌱</Text>
        <Text style={styles.logo}>Mily</Text>
        <Text style={styles.slogan}>미루지 않는 경제 대화</Text>
      </View>
      <View style={styles.actions}>
        {onKakao && (
          <TouchableOpacity style={styles.kakaoBtn} onPress={onKakao} activeOpacity={0.8}>
            <Text style={styles.kakaoBtnText}>카카오로 시작하기</Text>
          </TouchableOpacity>
        )}
        {onApple && (
          <TouchableOpacity style={styles.appleBtn} onPress={onApple} activeOpacity={0.8}>
            <Text style={styles.appleBtnText}>Apple로 시작하기</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.startBtn} onPress={onStart} activeOpacity={0.8}>
          <Text style={styles.startBtnText}>시작하기</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.loginLink} onPress={onLogin} activeOpacity={0.7}>
          <Text style={styles.loginLinkText}>이미 계정 있어요</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.milyColors.brownDark },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  icon: { fontSize: 64, marginBottom: 16 },
  logo: { fontSize: 48, fontWeight: '700', color: theme.milyColors.cream, letterSpacing: 2 },
  slogan: { fontSize: 16, color: theme.milyColors.brownLight, marginTop: 12 },
  actions: { paddingHorizontal: 24, paddingBottom: 40, gap: 12 },
  kakaoBtn: { backgroundColor: '#FEE500', borderRadius: theme.borderRadius.button, paddingVertical: 14, alignItems: 'center' },
  kakaoBtnText: { fontSize: 16, fontWeight: '600', color: '#3C1E1E' },
  appleBtn: { backgroundColor: '#000', borderRadius: theme.borderRadius.button, paddingVertical: 14, alignItems: 'center' },
  appleBtnText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  startBtn: { backgroundColor: theme.milyColors.coral, borderRadius: theme.borderRadius.button, paddingVertical: 14, alignItems: 'center' },
  startBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  loginLink: { alignItems: 'center', paddingVertical: 8 },
  loginLinkText: { fontSize: 14, color: theme.milyColors.brownLight },
});
