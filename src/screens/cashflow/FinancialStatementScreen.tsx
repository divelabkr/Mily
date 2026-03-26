// FinancialStatementScreen.tsx — 가계 회고 카드 (재무제표 → 회고)
import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, SafeAreaView,
} from 'react-native';
import { theme } from '../../ui/theme';
import { DarkCard } from '../../components/ui/DarkCard';
import { MilyCard } from '../../components/ui/MilyCard';

interface FinancialStatementScreenProps {
  period: string;         // "2026-03"
  netWorth: number;
  prevNetWorth?: number;
  totalInflow: number;
  totalOutflow: number;
  categories: { name: string; amount: number; pct: number }[];
}

export function FinancialStatementScreen({
  period, netWorth, prevNetWorth, totalInflow, totalOutflow, categories,
}: FinancialStatementScreenProps) {
  const diff = prevNetWorth != null ? netWorth - prevNetWorth : null;
  const isUp = diff != null && diff >= 0;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>가계 회고</Text>
        <Text style={styles.period}>{period}</Text>

        {/* 순자산 DarkCard */}
        <DarkCard>
          <Text style={styles.darkLabel}>이번 달 순현금흐름</Text>
          <Text style={styles.darkAmount}>{netWorth >= 0 ? '+' : ''}{netWorth.toLocaleString()}원</Text>
          {diff != null && (
            <Text style={[styles.darkDiff, isUp ? styles.darkDiffUp : styles.darkDiffDown]}>
              전월 대비 {isUp ? '▲' : '▼'} {Math.abs(diff).toLocaleString()}원
            </Text>
          )}
        </DarkCard>

        {/* 수입/지출 카드 */}
        <MilyCard>
          <View style={styles.inoutRow}>
            <View style={styles.inoutItem}>
              <Text style={styles.inoutEmoji}>💚</Text>
              <Text style={styles.inoutLabel}>수입</Text>
              <Text style={styles.inoutAmount}>{totalInflow.toLocaleString()}원</Text>
            </View>
            <View style={styles.inoutDivider} />
            <View style={styles.inoutItem}>
              <Text style={styles.inoutEmoji}>🔴</Text>
              <Text style={styles.inoutLabel}>지출</Text>
              <Text style={styles.inoutAmount}>{totalOutflow.toLocaleString()}원</Text>
            </View>
          </View>
        </MilyCard>

        {/* 카테고리별 */}
        <MilyCard>
          <Text style={styles.cardTitle}>지출 구성</Text>
          {categories.map((cat, i) => (
            <View key={i} style={styles.catRow}>
              <Text style={styles.catName}>{cat.name}</Text>
              <View style={styles.catBarBg}>
                <View style={[styles.catBarFill, { width: `${cat.pct}%` }]} />
              </View>
              <Text style={styles.catPct}>{cat.pct}%</Text>
            </View>
          ))}
        </MilyCard>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.milyColors.cream },
  content: { padding: 16, gap: 12 },
  title: { fontSize: 22, fontWeight: '700', color: theme.milyColors.brownDark },
  period: { fontSize: 14, color: theme.milyColors.brownMid, marginBottom: 4 },
  darkLabel: { fontSize: 12, color: theme.milyColors.brownLight, marginBottom: 6 },
  darkAmount: { fontSize: 32, fontWeight: '700', color: '#fff', marginBottom: 6 },
  darkDiff: { fontSize: 14, fontWeight: '500' },
  darkDiffUp: { color: theme.milyColors.mint },
  darkDiffDown: { color: theme.milyColors.coralLight },
  inoutRow: { flexDirection: 'row' },
  inoutItem: { flex: 1, alignItems: 'center', gap: 4 },
  inoutEmoji: { fontSize: 24 },
  inoutLabel: { fontSize: 13, color: theme.milyColors.brownMid },
  inoutAmount: { fontSize: 16, fontWeight: '700', color: theme.milyColors.brownDark },
  inoutDivider: { width: 1, backgroundColor: theme.milyColors.surface2, marginHorizontal: 8 },
  cardTitle: { fontSize: 14, fontWeight: '600', color: theme.milyColors.brownDark, marginBottom: 12 },
  catRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
  catName: { fontSize: 13, color: theme.milyColors.brownDark, width: 64 },
  catBarBg: { flex: 1, height: 8, backgroundColor: theme.milyColors.surface2, borderRadius: 4, overflow: 'hidden' },
  catBarFill: { height: 8, backgroundColor: theme.milyColors.coral, borderRadius: 4 },
  catPct: { fontSize: 12, color: theme.milyColors.brownMid, width: 32, textAlign: 'right' },
});
