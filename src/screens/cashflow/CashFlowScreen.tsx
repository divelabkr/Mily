// ──────────────────────────────────────────────
// CashFlowScreen.tsx — 캐시플로우 대시보드
// freedomIndex % + WealthLevel 배지 + 수입/지출 시각화
// Feature Flag: CASHFLOW_ENGINE_ENABLED
// ──────────────────────────────────────────────

import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { ScreenLayout } from '../../ui/layouts/ScreenLayout';
import { theme } from '../../ui/theme';
import { filterDna } from '../../engines/message/dnaFilter';
import {
  getWealthEmoji,
  getWealthLabel,
  getFreedomIndexLabel,
  CashFlowData,
  WealthLevel,
} from '../../engines/cashflow/cashFlowEngine';

// ── 타입 ──────────────────────────────────────

export interface CashFlowScreenProps {
  cashFlowData: CashFlowData | null;
  loading?: boolean;
}

// ── 방향 화살표 ──────────────────────────────

function DirectionArrow({ value, label }: { value: number; label: string }) {
  const arrow = value >= 0 ? '↑' : '↓';
  const color = value >= 0 ? theme.colors.success : '#E57373';
  const safeLabel = filterDna(label).passed ? label : '항목';

  return (
    <View style={styles.arrowRow}>
      <Text style={[styles.arrowIcon, { color }]}>{arrow}</Text>
      <Text style={styles.arrowLabel}>{safeLabel}</Text>
      <Text style={[styles.arrowValue, { color }]}>
        {Math.abs(value).toLocaleString()}원
      </Text>
    </View>
  );
}

// ── WealthLevel 배지 ────────────────────────

function WealthBadge({ level }: { level: WealthLevel }) {
  const emoji = getWealthEmoji(level);
  const label = getWealthLabel(level);
  return (
    <View style={styles.badgeContainer}>
      <Text style={styles.badgeEmoji}>{emoji}</Text>
      <Text style={styles.badgeLabel}>{label}</Text>
    </View>
  );
}

// ── 자유 지수 프로그레스 바 ───────────────────

function FreedomIndexBar({ index }: { index: number }) {
  const pct = Math.round(index * 100);
  const label = getFreedomIndexLabel(index);

  return (
    <View style={styles.freedomCard}>
      <Text style={styles.freedomTitle}>래트레이스 탈출 진행률</Text>
      <View style={styles.progressBarBg}>
        <View style={[styles.progressBarFill, { width: `${pct}%` }]} />
      </View>
      <Text style={styles.freedomPct}>{pct}%</Text>
      <Text style={styles.freedomLabel}>{label}</Text>
    </View>
  );
}

// ── 메인 화면 ────────────────────────────────

export function CashFlowScreen({ cashFlowData, loading }: CashFlowScreenProps) {
  if (loading) {
    return (
      <ScreenLayout>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </ScreenLayout>
    );
  }

  if (!cashFlowData) {
    return (
      <ScreenLayout>
        <View style={styles.center}>
          <Text style={styles.emptyText}>아직 캐시플로우 데이터가 없어요.</Text>
          <Text style={styles.emptyHint}>체크인을 시작하면 자동으로 생성돼요!</Text>
        </View>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.screenTitle}>캐시플로우</Text>

        {/* WealthLevel 배지 */}
        <WealthBadge level={cashFlowData.netWorthLevel} />

        {/* 자유 지수 */}
        <FreedomIndexBar index={cashFlowData.freedomIndex} />

        {/* 수입 / 지출 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>수입</Text>
          <DirectionArrow value={cashFlowData.totalInflow} label="총 수입" />
          <DirectionArrow value={cashFlowData.passiveIncome} label="수동 소득" />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>지출</Text>
          <DirectionArrow value={-cashFlowData.totalOutflow} label="총 지출" />
        </View>

        {/* 순현금흐름 */}
        <View style={styles.netCard}>
          <Text style={styles.netLabel}>순현금흐름</Text>
          <Text
            style={[
              styles.netValue,
              { color: cashFlowData.netWorth >= 0 ? theme.colors.success : '#E57373' },
            ]}
          >
            {cashFlowData.netWorth >= 0 ? '+' : ''}
            {cashFlowData.netWorth.toLocaleString()}원
          </Text>
        </View>
      </ScrollView>
    </ScreenLayout>
  );
}

// ── 스타일 ─────────────────────────────────

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 16, color: theme.colors.textPrimary, marginBottom: 8 },
  emptyHint: { fontSize: 14, color: theme.colors.textSecondary },
  screenTitle: { fontSize: 22, fontWeight: '700', color: theme.colors.textPrimary, marginTop: 16, marginBottom: 20 },

  // Badge
  badgeContainer: { alignItems: 'center', paddingVertical: 16, backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.card, marginBottom: 16 },
  badgeEmoji: { fontSize: 48 },
  badgeLabel: { fontSize: 16, fontWeight: '600', color: theme.colors.textPrimary, marginTop: 4 },

  // Freedom
  freedomCard: { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.card, padding: 16, marginBottom: 16 },
  freedomTitle: { fontSize: 14, fontWeight: '600', color: theme.colors.textSecondary, marginBottom: 8 },
  progressBarBg: { height: 12, backgroundColor: theme.colors.border, borderRadius: 6, overflow: 'hidden' },
  progressBarFill: { height: 12, backgroundColor: theme.colors.primary, borderRadius: 6 },
  freedomPct: { fontSize: 28, fontWeight: '700', color: theme.colors.primary, textAlign: 'center', marginTop: 8 },
  freedomLabel: { fontSize: 13, color: theme.colors.textSecondary, textAlign: 'center', marginTop: 4 },

  // Sections
  section: { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.card, padding: 16, marginBottom: 12 },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: theme.colors.textPrimary, marginBottom: 12 },

  // Arrow row
  arrowRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  arrowIcon: { fontSize: 18, fontWeight: '700', width: 24 },
  arrowLabel: { flex: 1, fontSize: 14, color: theme.colors.textSecondary },
  arrowValue: { fontSize: 15, fontWeight: '600' },

  // Net
  netCard: { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.card, padding: 20, alignItems: 'center', marginBottom: 24 },
  netLabel: { fontSize: 14, color: theme.colors.textSecondary, marginBottom: 4 },
  netValue: { fontSize: 24, fontWeight: '700' },
});
