// ChildReportScreen.tsx — 자녀 리포트 (수동소득 비율 시각화)
import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, SafeAreaView,
} from 'react-native';
import { theme } from '../../ui/theme';
import { DarkCard } from '../../components/ui/DarkCard';
import { MilyCard } from '../../components/ui/MilyCard';

interface EconomicCard {
  emoji: string;
  title: string;
  desc: string;
}

interface ChildReportScreenProps {
  passiveIncomeRatio: number;   // 0~1
  totalIncome: number;
  passiveIncome: number;
  goalTitle?: string;
  goalProgress?: number;
  economicCard?: EconomicCard;
}

export function ChildReportScreen({
  passiveIncomeRatio, totalIncome, passiveIncome,
  goalTitle, goalProgress = 0, economicCard,
}: ChildReportScreenProps) {
  const passivePct = Math.round(passiveIncomeRatio * 100);
  const barCount = 10;
  const filledBars = Math.round(passiveIncomeRatio * barCount);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>나의 돈 이야기</Text>

        {/* 수동소득 비율 시각화 */}
        <DarkCard>
          <Text style={styles.darkLabel}>수동소득 비율</Text>
          <View style={styles.barRow}>
            {Array.from({ length: barCount }).map((_, i) => (
              <View key={i} style={[styles.bar, i < filledBars && styles.barFilled]} />
            ))}
          </View>
          <Text style={styles.darkPct}>{passivePct}%</Text>
          <Text style={styles.darkSub}>
            전체 {totalIncome.toLocaleString()}원 중 {passiveIncome.toLocaleString()}원이 수동소득이에요
          </Text>
        </DarkCard>

        {/* 목표 */}
        {goalTitle && (
          <MilyCard>
            <Text style={styles.goalLabel}>목표 진행</Text>
            <Text style={styles.goalTitle}>{goalTitle}</Text>
            <View style={styles.goalBg}>
              <View style={[styles.goalFill, { width: `${Math.round(goalProgress * 100)}%` }]} />
            </View>
            <Text style={styles.goalPct}>{Math.round(goalProgress * 100)}%</Text>
          </MilyCard>
        )}

        {/* 경제 상식 카드 */}
        {economicCard && (
          <MilyCard style={styles.econCard}>
            <Text style={styles.econEmoji}>{economicCard.emoji}</Text>
            <Text style={styles.econTitle}>{economicCard.title}</Text>
            <Text style={styles.econDesc}>{economicCard.desc}</Text>
          </MilyCard>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.milyColors.cream },
  content: { padding: 16, gap: 12 },
  title: { fontSize: 22, fontWeight: '700', color: theme.milyColors.brownDark, marginBottom: 4 },
  darkLabel: { fontSize: 12, color: theme.milyColors.brownLight, marginBottom: 10 },
  barRow: { flexDirection: 'row', gap: 4, marginBottom: 8 },
  bar: { flex: 1, height: 24, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 4 },
  barFilled: { backgroundColor: theme.milyColors.mint },
  darkPct: { fontSize: 32, fontWeight: '700', color: '#fff', marginBottom: 6 },
  darkSub: { fontSize: 12, color: theme.milyColors.brownLight },
  goalLabel: { fontSize: 12, color: theme.milyColors.brownMid, marginBottom: 4 },
  goalTitle: { fontSize: 15, fontWeight: '600', color: theme.milyColors.brownDark, marginBottom: 10 },
  goalBg: { height: 8, backgroundColor: theme.milyColors.surface2, borderRadius: 4, marginBottom: 6 },
  goalFill: { height: 8, backgroundColor: theme.milyColors.mint, borderRadius: 4 },
  goalPct: { fontSize: 13, color: theme.milyColors.mint, fontWeight: '600' },
  econCard: { alignItems: 'center', padding: 20 },
  econEmoji: { fontSize: 40, marginBottom: 8 },
  econTitle: { fontSize: 16, fontWeight: '700', color: theme.milyColors.brownDark, marginBottom: 6 },
  econDesc: { fontSize: 13, color: theme.milyColors.brownMid, textAlign: 'center', lineHeight: 18 },
});
