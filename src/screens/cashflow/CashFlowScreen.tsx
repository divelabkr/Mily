// CashFlowScreen.tsx — 캐시플로우 화면 (수동소득 비율 시각화)
import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, SafeAreaView,
} from 'react-native';
import { theme } from '../../ui/theme';
import { DarkCard } from '../../components/ui/DarkCard';
import { MilyCard } from '../../components/ui/MilyCard';
import { CashFlowData, getWealthEmoji, getWealthLabel } from '../../engines/cashflow/cashFlowEngine';

interface CashFlowScreenProps {
  data: CashFlowData;
}

export function CashFlowScreen({ data }: CashFlowScreenProps) {
  const passivePct = Math.round(data.passiveIncomeRatio * 100);
  const assetPct = Math.round(data.assetRatio * 100);
  const wealthEmoji = getWealthEmoji(data.netWorthLevel);
  const wealthLabel = getWealthLabel(data.netWorthLevel);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>돈의 흐름</Text>

        {/* 수동소득 비율 메인 카드 */}
        <DarkCard>
          <Text style={styles.darkLabel}>수동소득 비율</Text>
          <Text style={styles.darkPct}>{passivePct}%</Text>
          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: `${Math.min(100, passivePct)}%` }]} />
          </View>
          <Text style={styles.darkSub}>
            월 {data.passiveIncome.toLocaleString()}원 / 전체 {data.totalInflow.toLocaleString()}원
          </Text>
        </DarkCard>

        {/* 성장 단계 카드 */}
        <MilyCard style={styles.levelCard}>
          <Text style={styles.levelEmoji}>{wealthEmoji}</Text>
          <View>
            <Text style={styles.levelLabel}>성장 단계</Text>
            <Text style={styles.levelName}>{wealthLabel}</Text>
          </View>
        </MilyCard>

        {/* 돈의 방향 카드 */}
        <MilyCard>
          <Text style={styles.cardTitle}>돈의 방향</Text>
          <View style={styles.flowRow}>
            <View style={styles.flowItem}>
              <Text style={styles.flowEmoji}>💰</Text>
              <Text style={styles.flowLabel}>총 수입</Text>
              <Text style={styles.flowAmount}>{data.totalInflow.toLocaleString()}</Text>
            </View>
            <Text style={styles.flowArrow}>→</Text>
            <View style={styles.flowItem}>
              <Text style={styles.flowEmoji}>📦</Text>
              <Text style={styles.flowLabel}>총 지출</Text>
              <Text style={styles.flowAmount}>{data.totalOutflow.toLocaleString()}</Text>
            </View>
            <Text style={styles.flowArrow}>→</Text>
            <View style={styles.flowItem}>
              <Text style={styles.flowEmoji}>📈</Text>
              <Text style={styles.flowLabel}>자산 지출</Text>
              <Text style={[styles.flowAmount, { color: theme.milyColors.mint }]}>{assetPct}%</Text>
            </View>
          </View>
        </MilyCard>

        {/* 수입원 다양성 카드 */}
        <MilyCard>
          <Text style={styles.cardTitle}>수입원</Text>
          {data.inflows.map((inflow, i) => (
            <View key={i} style={styles.inflowRow}>
              <Text style={styles.inflowSource}>{inflow.source}</Text>
              <Text style={styles.inflowAmount}>{inflow.amount.toLocaleString()}원</Text>
              {inflow.isPassive && <Text style={styles.inflowPassive}>수동</Text>}
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
  title: { fontSize: 22, fontWeight: '700', color: theme.milyColors.brownDark, marginBottom: 4 },
  darkLabel: { fontSize: 12, color: theme.milyColors.brownLight, marginBottom: 6 },
  darkPct: { fontSize: 40, fontWeight: '700', color: '#fff', marginBottom: 12 },
  progressBg: { height: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 4, marginBottom: 10 },
  progressFill: { height: 8, backgroundColor: theme.milyColors.mint, borderRadius: 4 },
  darkSub: { fontSize: 12, color: theme.milyColors.brownLight },
  levelCard: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  levelEmoji: { fontSize: 40 },
  levelLabel: { fontSize: 12, color: theme.milyColors.brownMid, marginBottom: 2 },
  levelName: { fontSize: 18, fontWeight: '700', color: theme.milyColors.brownDark },
  cardTitle: { fontSize: 14, fontWeight: '600', color: theme.milyColors.brownDark, marginBottom: 12 },
  flowRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  flowItem: { flex: 1, alignItems: 'center' },
  flowEmoji: { fontSize: 24, marginBottom: 4 },
  flowLabel: { fontSize: 11, color: theme.milyColors.brownMid, marginBottom: 4 },
  flowAmount: { fontSize: 13, fontWeight: '600', color: theme.milyColors.brownDark },
  flowArrow: { fontSize: 18, color: theme.milyColors.brownLight, paddingHorizontal: 4 },
  inflowRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: theme.milyColors.surface2 },
  inflowSource: { fontSize: 14, color: theme.milyColors.brownDark, flex: 1 },
  inflowAmount: { fontSize: 14, fontWeight: '600', color: theme.milyColors.brownDark },
  inflowPassive: { fontSize: 11, color: theme.milyColors.mint, backgroundColor: theme.milyColors.mintBg, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, marginLeft: 6 },
});
