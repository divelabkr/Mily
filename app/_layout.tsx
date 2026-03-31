import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import '../src/i18n/i18n';
import { initAuthListener } from '../src/engines/auth/authService';
import { useAuthStore } from '../src/engines/auth/authStore';
import { initRevenueCat, syncSubscription } from '../src/engines/billing/billingService';
import { initAnalytics } from '../src/engines/analytics/analyticsService';
import { initNotificationHandler, scheduleWeeklyReviewReminder } from '../src/engines/notification/notificationService';
import * as posthogService from '../src/engines/monitoring/posthogService';
import * as remoteConfigService from '../src/engines/config/remoteConfigService';
import { useMaintenanceMode, useForceUpdate } from '../src/engines/config/useFeatureFlag';
import { useMasterPermissions } from '../src/engines/auth/masterGuard';
import { theme } from '../src/ui/theme';

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync();

// ── 점검 중 화면 ──────────────────────────────
function MaintenanceScreen() {
  return (
    <View style={overlayStyles.container}>
      <Text style={overlayStyles.emoji}>🔧</Text>
      <Text style={overlayStyles.title}>점검 중입니다</Text>
      <Text style={overlayStyles.body}>
        더 나은 서비스를 위해 점검 중입니다.{'\n'}잠시 후 다시 이용해 주세요.
      </Text>
    </View>
  );
}

// ── 강제 업데이트 화면 ─────────────────────────
function ForceUpdateScreen() {
  return (
    <View style={overlayStyles.container}>
      <Text style={overlayStyles.emoji}>🆕</Text>
      <Text style={overlayStyles.title}>업데이트가 필요합니다</Text>
      <Text style={overlayStyles.body}>
        앱을 최신 버전으로 업데이트한 후{'\n'}이용해 주세요.
      </Text>
    </View>
  );
}

const overlayStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    padding: 32,
  },
  emoji: { fontSize: 48, marginBottom: 16 },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
  },
  body: {
    fontSize: 15,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
});

// ── AuthGate ──────────────────────────────────
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
    // onboarding 하위 경로(role-select → first-plan → child-join) 진행 중인지 확인
    // setRole() 호출 시 user 객체가 교체되어 이 effect가 재실행되는데,
    // 이미 onboarding 흐름 안에 있으면 role-select로 되돌리면 안 됨
    const inOnboarding = inAuth && segments[1] === 'onboarding';
    console.log('[AuthGate] user:', user?.uid ?? 'null', '| inAuth:', inAuth, '| inOnboarding:', inOnboarding, '| path:', segments.join('/'));

    if (!user && !inAuth) {
      console.log('[AuthGate] → /(auth)/login (비로그인)');
      router.replace('/(auth)/login');
    } else if (user && inAuth) {
      // 마스터 계정: 온보딩 건너뛰고 바로 홈
      if (user.isMaster) {
        console.log('[AuthGate] → /(adult)/home (마스터)');
        router.replace('/(adult)/home');
      } else if (!user.onboardingComplete && !inOnboarding) {
        // 온보딩 미완료이고 아직 onboarding 흐름 진입 전일 때만 진입점으로 보냄
        // inOnboarding=true이면 이미 흐름 중이므로 현재 화면 유지
        console.log('[AuthGate] → 온보딩 진입 (onboardingComplete=false)');
        router.replace('/(auth)/onboarding/role-select');
      } else if (user.onboardingComplete) {
        if (user.role === 'child') {
          console.log('[AuthGate] → /(child)/home');
          router.replace('/(child)/home');
        } else {
          console.log('[AuthGate] → /(adult)/home (role:', user.role, ')');
          router.replace('/(adult)/home');
        }
      }
      // inOnboarding=true && onboardingComplete=false: 흐름 진행 중 → 아무것도 안 함
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

// ── RootLayout ────────────────────────────────
export default function RootLayout() {
  const authLoading = useAuthStore((s) => s.loading);
  const permissions = useMasterPermissions();
  const isMaintenance = useMaintenanceMode();
  const isForceUpdate = useForceUpdate();

  useEffect(() => {
    posthogService.init();
    remoteConfigService.init().catch(() => {}); // fire-and-forget
    initNotificationHandler();
    const unsubscribe = initAuthListener();
    SplashScreen.hideAsync();
    return unsubscribe;
  }, []);

  // 강제 업데이트: 마스터도 우회 불가
  if (isForceUpdate) {
    return <ForceUpdateScreen />;
  }

  // 점검 중: 마스터 계정은 우회 가능 (auth 로딩 중엔 숨김)
  if (isMaintenance && !authLoading && !permissions.accessAllScreens) {
    return <MaintenanceScreen />;
  }

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
