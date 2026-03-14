import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import '../src/i18n/i18n';
import { initAuthListener } from '../src/engines/auth/authService';
import { useAuthStore } from '../src/engines/auth/authStore';
import { initRevenueCat, syncSubscription } from '../src/engines/billing/billingService';
import { initAnalytics } from '../src/engines/analytics/analyticsService';
import { initNotificationHandler, scheduleWeeklyReviewReminder } from '../src/engines/notification/notificationService';
import { theme } from '../src/ui/theme';

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync();

function AuthGate({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);
  const router = useRouter();
  const segments = useSegments();

  // 로그인 성공 시 RevenueCat/Analytics 초기화
  useEffect(() => {
    if (!user) return;
    initRevenueCat(user.uid);
    syncSubscription();
    initAnalytics(user.uid);
    scheduleWeeklyReviewReminder();
  }, [user?.uid]);

  useEffect(() => {
    if (loading) return;

    const inAuth = segments[0] === '(auth)';

    if (!user && !inAuth) {
      router.replace('/(auth)/login');
    } else if (user && inAuth) {
      if (!user.onboardingComplete) {
        router.replace('/(auth)/onboarding/role-select');
      } else if (user.role === 'child') {
        router.replace('/(child)/home');
      } else {
        router.replace('/(adult)/home');
      }
    }
  }, [user, loading, segments]);

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: theme.colors.background,
        }}
      >
        <ActivityIndicator color={theme.colors.primary} size="large" />
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  useEffect(() => {
    initNotificationHandler();
    const unsubscribe = initAuthListener();
    SplashScreen.hideAsync();
    return unsubscribe;
  }, []);

  return (
    <>
      <StatusBar style="dark" />
      <AuthGate>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(adult)" />
          <Stack.Screen name="(child)" />
          <Stack.Screen name="index" />
        </Stack>
      </AuthGate>
    </>
  );
}
