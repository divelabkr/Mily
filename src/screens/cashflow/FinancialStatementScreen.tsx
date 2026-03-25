// ──────────────────────────────────────────────
// FinancialStatementScreen.tsx — 월간 재무제표 화면
// 수입/지출/자산/부채/순자산 카드 + 전월 대비 화살표
// Feature Flag: FINANCIAL_STATEMENT_ENABLED
// ──────────────────────────────────────────────

import React from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { ScreenLayout } from '../../ui/layouts/ScreenLayout';
import { theme } from '../../ui/theme';
import { filterDna } from '../../engines/message/dnaFilter';
import {
  FamilyStatement,
  StatementDiff,
  buildStatementSummary,
} from '../../engines/cashflow/financialStatementService';
import { getWealthEmoji, getWealthLabel } from '../../engines/cashflow/cashFlowEngine';

// ── 타입 ──────────────────────────────────────

export interface FinancialStatementScreenProps {
  statement: FamilyStatement | null;
  previousDiff: StatementDiff | null;
  loading?: boolean;
}

// ── 전월 대비 화살표 ────────────────────────

function DeltaArrow({ delta }: { delta: number }) {
  if (delta === 0) return <Text style={styles.deltaFlat}>—</Text>;
  const arrow = delta > 0 ? '↑' : '↓';
  const color = delta > 0 ? theme.colors.success : '#E57373';
  return (
    <Text style={[styles.delta, { color }]}>
      {arrow} {Math.abs(delta).toLocaleString()}
    </Text>
  );
}

// ── 금액 카드 ────────────────────────────────

function AmountCard({
  title,
  items,
  total,
}: {
  title: string;
  items: { label: string; amount: number }[];
  total: number;
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      {items.map((item) => (
        <View key={item.label} style={styles.itemRow}>
          <Text style={styles.itemLabel}>{item.label}</Text>
          <Text style={styles.itemValue}>{item.amount.toLocaleString()}원</Text>
        </View>
      ))}
      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>합계</Text>
        <Text style={styles.totalValue}>{total.toLocaleString()}원</Text>
      </View>
    </View>
  );
}

// ── 메인 화면 ────────────────────────────────

export function FinancialStatementScreen({
  statement,
  previousDiff,
  loading,
}: FinancialStatementScreenProps) {
  if (loading) {
    return (
      <ScreenLayout>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </ScreenLayout>
    );
  }

  if (!statement) {
    return (
      <ScreenLayout>
        <View style={styles.center}>
          <Text style={styles.emptyText}>아직 재무제표가 없어요.</Text>
          <Text style={styles.emptyHint}>이번 달 체크인을 마치면 자동으로 생성돼요!</Text>
        </View>
      </ScreenLayout>
    );
  }

  const summary = buildStatementSummary(statement);
  const safeSummary = filterDna(summary).passed ? summary : '이번 달 기록을 확인해봐요.';
  const emoji = getWealthEmoji(statement.wealthLevel);
  const levelLabel = getWealthLabel(statement.wealthLevel);

  return (
    <ScreenLayout>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.screenTitle}>월간 재무제표</Text>
        <Text style={styles.period}>{statement.period}</Text>

        {/* 요약 */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryText}>{safeSummary}</Text>
          <Text style={styles.summaryBadge}>
            {emoji} {levelLabel}
          </Text>
        </View>

        {/* 전월 대비 */}
        {previousDiff && (
          <View style={styles.diffRow}>
            <View style={styles.diffItem}>
              <Text style={styles.diffLabel}>순자산</Text>
              <DeltaArrow delta={previousDiff.netWorthDelta} />
            </View>
            <View style={styles.diffItem}>
              <Text style={styles.diffLabel}>현금흐름</Text>
              <DeltaArrow delta={previousDiff.cashFlowDelta} />
            </View>
            <View style={styles.diffItem}>
              <Text style={styles.diffLabel}>자유지수</Text>
              <DeltaArrow delta={Math.round(previousDiff.freedomIndexDelta * 100)} />
            </View>
          </View>
        )}

        {/* 수입 */}
        <AmountCard
          title="수입"
          items={[
            { label: '용돈', amount: statement.income.allowance },
            { label: '수동소득', amount: statement.income.passive },
            { label: '기타', amount: statement.income.other },
          ]}
          total={statement.income.total}
        />

        {/* 지출 */}
        <AmountCard
          title="지출"
          items={[
            { label: '소비성', amount: statement.expenses.consumable },
            { label: '투자성', amount: statement.expenses.investment },
            { label: '부채상환', amount: statement.expenses.liability },
            { label: '나눔', amount: statement.expenses.give },
          ]}
          total={statement.expenses.total}
        />

        {/* 자산 */}
        <AmountCard
          title="자산"
          items={[
            { label: '저금', amount: statement.assets.savings },
            { label: '패밀리뱅크', amount: statement.assets.contracts },
          ]}
          total={statement.assets.total}
        />

        {/* 부채 */}
        <AmountCard
          title="부채"
          items={[{ label: '가족 대출', amount: statement.liabilities.loans }]}
          total={statement.liabilities.total}
        />

        {/* 순자산 */}
        <View style={styles.netWorthCard}>
          <Text style={styles.netWorthLabel}>순자산</Text>
          <Text
            style={[
              styles.netWorthValue,
              { color: statement.netWorth >= 0 ? theme.colors.success : '#E57373' },
            ]}
          >
            {statement.netWorth.toLocaleString()}원
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
  screenTitle: { fontSize: 22, fontWeight: '700', color: theme.colors.textPrimary, marginTop: 16 },
  period: { fontSize: 14, color: theme.colors.textSecondary, marginBottom: 16 },

  // Summary
  summaryCard: { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.card, padding: 16, marginBottom: 16, alignItems: 'center' },
  summaryText: { fontSize: 15, color: theme.colors.textPrimary, textAlign: 'center', marginBottom: 8 },
  summaryBadge: { fontSize: 18, fontWeight: '600', color: theme.colors.primary },

  // Diff
  diffRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  diffItem: { flex: 1, alignItems: 'center', backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.card, padding: 12, marginHorizontal: 4 },
  diffLabel: { fontSize: 12, color: theme.colors.textSecondary, marginBottom: 4 },
  delta: { fontSize: 14, fontWeight: '600' },
  deltaFlat: { fontSize: 14, color: theme.colors.textSecondary },

  // Card
  card: { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.card, padding: 16, marginBottom: 12 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: theme.colors.textPrimary, marginBottom: 12 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  itemLabel: { fontSize: 14, color: theme.colors.textSecondary },
  itemValue: { fontSize: 14, color: theme.colors.textPrimary },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 8, marginTop: 8, borderTopWidth: 1, borderTopColor: theme.colors.border },
  totalLabel: { fontSize: 14, fontWeight: '600', color: theme.colors.textPrimary },
  totalValue: { fontSize: 14, fontWeight: '700', color: theme.colors.primary },

  // Net Worth
  netWorthCard: { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.card, padding: 20, alignItems: 'center', marginBottom: 24 },
  netWorthLabel: { fontSize: 14, color: theme.colors.textSecondary, marginBottom: 4 },
  netWorthValue: { fontSize: 28, fontWeight: '700' },
});
