import React from 'react';
import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { theme } from '../../src/ui/theme';
import { useAuthStore } from '../../src/engines/auth/authStore';

export default function AdultLayout() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const isParent = user?.role === 'parent';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{ title: t('tab_home'), tabBarIcon: () => null }}
      />
      <Tabs.Screen
        name="plan"
        options={{ title: t('tab_plan'), tabBarIcon: () => null }}
      />
      <Tabs.Screen
        name="family"
        options={{
          title: t('tab_family'),
          tabBarIcon: () => null,
          href: isParent ? '/(adult)/family' : null,
        }}
      />
      <Tabs.Screen
        name="my"
        options={{ title: t('tab_my'), tabBarIcon: () => null }}
      />
      <Tabs.Screen
        name="checkin"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="review"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="paywall"
        options={{ href: null }}
      />
    </Tabs>
  );
}
