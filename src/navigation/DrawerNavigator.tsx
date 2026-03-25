// ──────────────────────────────────────────────
// DrawerNavigator.tsx — 햄버거 Drawer 네비게이션
// Remote Config: drawer_nav_enabled 플래그로 제어
// 성인/자녀 역할별 메뉴 분기
// ──────────────────────────────────────────────

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../engines/auth/authStore';
import { theme } from '../ui/theme';

// ── 메뉴 아이템 정의 ──────────────────────────

export interface DrawerMenuItem {
  key: string;
  label: string;
  route: string;
  badge?: number;
  visible: boolean;
}

export function getAdultMenuItems(
  t: (key: string) => string,
  isParent: boolean,
  requestBadge = 0
): DrawerMenuItem[] {
  return [
    { key: 'home',        label: t('drawer_home'),        route: '/(adult)/home',    visible: true },
    { key: 'report',      label: t('drawer_report'),      route: '/(adult)/review',  visible: true },
    { key: 'plan',        label: t('drawer_plan'),        route: '/(adult)/plan',    visible: true },
    { key: 'request',     label: t('drawer_request'),     route: '/(adult)/family',  badge: requestBadge, visible: isParent },
    { key: 'achievement', label: t('drawer_achievement'), route: '/(adult)/my',      visible: true },
    { key: 'family',      label: t('drawer_family'),      route: '/(adult)/family',  visible: isParent },
    { key: 'settings',    label: t('drawer_settings'),    route: '/(adult)/my',      visible: true },
  ].filter((item) => item.visible);
}

export function getChildMenuItems(
  t: (key: string) => string
): DrawerMenuItem[] {
  return [
    { key: 'home',        label: t('drawer_home'),        route: '/(child)/home',    visible: true },
    { key: 'plan',        label: t('drawer_plan'),        route: '/(child)/plan',    visible: true },
    { key: 'request',     label: t('drawer_request'),     route: '/(child)/request', visible: true },
    { key: 'achievement', label: t('drawer_achievement'), route: '/(child)/me',      visible: true },
    { key: 'privacy',     label: t('drawer_privacy'),     route: '/(child)/me',      visible: true },
  ].filter((item) => item.visible);
}

// ── Drawer Content 컴포넌트 ─────────────────

interface DrawerContentProps {
  items: DrawerMenuItem[];
  onSelect: (route: string) => void;
  onClose: () => void;
}

export function DrawerContent({ items, onSelect, onClose }: DrawerContentProps) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>Mily</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.menu}>
        {items.map((item) => (
          <TouchableOpacity
            key={item.key}
            style={styles.menuItem}
            onPress={() => onSelect(item.route)}
          >
            <Text style={styles.menuLabel}>{item.label}</Text>
            {item.badge != null && item.badge > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{item.badge}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

// ── 스타일 ─────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  logo: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  closeBtn: {
    padding: 8,
  },
  closeText: {
    fontSize: 18,
    color: theme.colors.textSecondary,
  },
  menu: {
    flex: 1,
    paddingTop: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  menuLabel: {
    fontSize: 16,
    color: theme.colors.textPrimary,
  },
  badge: {
    backgroundColor: theme.colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});
