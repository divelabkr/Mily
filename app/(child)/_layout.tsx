import React from 'react';
import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { theme } from '../../src/ui/theme';

export default function ChildLayout() {
  const { t } = useTranslation();

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
        name="request"
        options={{ title: t('tab_request'), tabBarIcon: () => null }}
      />
      <Tabs.Screen
        name="me"
        options={{ title: t('tab_my'), tabBarIcon: () => null }}
      />
      <Tabs.Screen
        name="dream"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="promise"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="achievement"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="simulator"
        options={{ href: null }}
      />
    </Tabs>
  );
}
