import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="role-select" />
      <Stack.Screen name="first-plan" />
      <Stack.Screen name="child-join" />
      <Stack.Screen name="ready" />
    </Stack>
  );
}
