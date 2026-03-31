import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../../../src/ui/theme';
import { useAuthStore } from '../../../src/engines/auth/authStore';
import { completeOnboarding } from '../../../src/engines/auth/authService';

export default function ReadyScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [loading, setLoading] = useState(false);

  const handleStart = async () => {
    if (loading) return;
    setLoading(true);
    try {
      if (user) await completeOnboarding(user.uid);
      router.replace('/');
    } catch {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.goldCard}>
          <Text style={styles.checkEmoji}>✅</Text>
          <Text style={styles.title}>계획을 세웠어요!</Text>
          <Text style={styles.sub}>
            이제 Mily와 함께{'\n'}소비를 돌아볼 준비가 됐어요.
          </Text>

          <View style={styles.hints}>
            <Text style={styles.hint}>📝 기록 → 돌아보기 → 합의</Text>
            <Text style={styles.hint}>⏱ 주 1회, 5분이면 충분해요</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.startButton, loading && styles.startButtonDisabled]}
          onPress={handleStart}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.startButtonText}>Mily 시작하기</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.milyColors.cream,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  goldCard: {
    backgroundColor: theme.milyColors.goldLight,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: theme.milyColors.gold,
    padding: 28,
    alignItems: 'center',
    marginBottom: 28,
  },
  checkEmoji: {
    fontSize: 52,
    marginBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: theme.milyColors.brownDark,
    textAlign: 'center',
    marginBottom: 10,
  },
  sub: {
    fontSize: 16,
    color: theme.milyColors.brownMid,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  hints: {
    gap: 8,
  },
  hint: {
    fontSize: 14,
    color: theme.milyColors.brownDark,
    fontWeight: '500',
    textAlign: 'center',
  },
  startButton: {
    height: 52,
    borderRadius: theme.borderRadius.button,
    backgroundColor: theme.milyColors.coral,
    justifyContent: 'center',
    alignItems: 'center',
  },
  startButtonDisabled: {
    opacity: 0.5,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
