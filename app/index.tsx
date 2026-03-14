import { Redirect } from 'expo-router';
import { useAuthStore } from '../src/engines/auth/authStore';

export default function Index() {
  const user = useAuthStore((s) => s.user);

  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  if (!user.onboardingComplete) {
    return <Redirect href="/(auth)/onboarding/role-select" />;
  }

  if (user.role === 'child') {
    return <Redirect href="/(child)/home" />;
  }

  return <Redirect href="/(adult)/home" />;
}
