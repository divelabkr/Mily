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

export interface FeatureFlagMap {
  cashflow_engine_enabled?: boolean;
  family_bank_enabled?: boolean;
  millionaire_enabled?: boolean;
  life_events_enabled?: boolean;
  financial_statement_enabled?: boolean;
  agreement_loop_enabled?: boolean;
  sibling_enabled?: boolean;
}

export function getAdultMenuItems(
  t: (key: string) => string,
  isParent: boolean,
  requestBadge = 0,
  flags: FeatureFlagMap = {}
): DrawerMenuItem[] {
  return [
    { key: 'home',        label: '홈',              route: '/(adult)/home',               visible: true },
    { key: 'review',      label: '주간회고',         route: '/(adult)/review',             visible: true },
    { key: 'request',     label: '요청카드',         route: '/(adult)/family',  badge: requestBadge, visible: isParent },
    { key: 'achievement', label: '업적',             route: '/(adult)/my',                 visible: true },
    { key: 'family',      label: '가족',             route: '/(adult)/family',             visible: isParent },
    { key: 'cashflow',    label: '💰 수동소득',      route: '/(adult)/cashflow',           visible: !!flags.cashflow_engine_enabled },
    { key: 'promise',     label: '🤝 가족 약속 기록함', route: '/(adult)/promise',         visible: !!flags.family_bank_enabled },
    { key: 'dream',       label: '🎯 꿈 설계소',     route: '/(adult)/dream',             visible: !!flags.millionaire_enabled },
    { key: 'settings',    label: '설정',             route: '/(adult)/my',                 visible: true },
  ].filter((item) => item.visible);
}

export function getChildMenuItems(
  t: (key: string) => string,
  flags: FeatureFlagMap = {}
): DrawerMenuItem[] {
  return [
    { key: 'home',        label: '홈',               route: '/(child)/home',         visible: true },
    { key: 'report',      label: '리포트',            route: '/(child)/report',       visible: true },
    { key: 'request',     label: '요청카드',          route: '/(child)/request',      visible: true },
    { key: 'dream',       label: '🎯 꿈 설계소',      route: '/(child)/dream',        visible: !!flags.millionaire_enabled },
    { key: 'promise',     label: '🤝 가족 약속 기록함', route: '/(child)/promise',    visible: !!flags.family_bank_enabled },
    { key: 'achievement', label: '업적',              route: '/(child)/me',           visible: true },
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
