// SiblingDashboard.tsx — 형제자매 개별 대시보드
// 비교 없음 (DNA). 각자 독립. 탭별 전환.
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView,
} from 'react-native';
import { theme } from '../../ui/theme';
import { DarkCard } from '../../components/ui/DarkCard';
import { MilyCard } from '../../components/ui/MilyCard';
import { SiblingProfile } from '../../engines/family/siblingService';

interface SiblingDashboardProps {
  siblings: SiblingProfile[];
  onBack?: () => void;
}

function SiblingCard({ profile }: { profile: SiblingProfile }) {
  const remaining = profile.weeklyBudget - profile.thisWeekSpent;
  const usedPct = profile.weeklyBudget > 0 ? Math.min(1, profile.thisWeekSpent / profile.weeklyBudget) : 0;

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.cardContent}>
      <DarkCard>
        <Text style={styles.darkLabel}>{profile.displayName}의 이번 주</Text>
        <Text style={styles.darkAmount}>{remaining.toLocaleString()}원 남았어요</Text>
        <View style={styles.progressBg}>
          <View style={[styles.progressFill, { width: `${Math.round(usedPct * 100)}%` }]} />
        </View>
        <Text style={styles.darkSub}>{profile.thisWeekCheckins}회 기록 · {profile.streak}주 연속</Text>
      </DarkCard>

      <MilyCard>
        <Text style={styles.statTitle}>이번 주 활동</Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statEmoji}>📝</Text>
            <Text style={styles.statValue}>{profile.thisWeekCheckins}</Text>
            <Text style={styles.statLabel}>기록</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statEmoji}>🔥</Text>
            <Text style={styles.statValue}>{profile.streak}</Text>
            <Text style={styles.statLabel}>연속 주</Text>
          </View>
        </View>
      </MilyCard>
    </ScrollView>
  );
}

export function SiblingDashboard({ siblings, onBack }: SiblingDashboardProps) {
  const [selected, setSelected] = useState(0);

  if (siblings.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.empty}>연결된 자녀가 없어요.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        {onBack && (
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <Text style={styles.backText}>‹ 뒤로</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.title}>내 용돈</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* 형제자매 탭 */}
      {siblings.length > 1 && (
        <View style={styles.siblingTabs}>
          {siblings.map((s, i) => (
            <TouchableOpacity
              key={s.uid}
              style={[styles.siblingTab, selected === i && styles.siblingTabActive]}
              onPress={() => setSelected(i)}
            >
              <Text style={[styles.siblingTabText, selected === i && styles.siblingTabTextActive]}>
                {s.displayName}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <SiblingCard profile={siblings[selected]} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.milyColors.cream },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { padding: 4 },
  backText: { fontSize: 16, color: theme.milyColors.coral },
  title: { fontSize: 18, fontWeight: '700', color: theme.milyColors.brownDark },
  siblingTabs: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 8 },
  siblingTab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: theme.milyColors.surface2 },
  siblingTabActive: { backgroundColor: theme.milyColors.coral },
  siblingTabText: { fontSize: 14, color: theme.milyColors.brownMid, fontWeight: '500' },
  siblingTabTextActive: { color: '#fff' },
  cardContent: { padding: 16, gap: 12 },
  darkLabel: { fontSize: 12, color: theme.milyColors.brownLight, marginBottom: 6 },
  darkAmount: { fontSize: 26, fontWeight: '700', color: '#fff', marginBottom: 12 },
  progressBg: { height: 6, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 3, marginBottom: 10 },
  progressFill: { height: 6, backgroundColor: theme.milyColors.coralLight, borderRadius: 3 },
  darkSub: { fontSize: 12, color: theme.milyColors.brownLight },
  statTitle: { fontSize: 14, fontWeight: '600', color: theme.milyColors.brownDark, marginBottom: 12 },
  statsRow: { flexDirection: 'row', gap: 16 },
  statItem: { alignItems: 'center', gap: 4 },
  statEmoji: { fontSize: 24 },
  statValue: { fontSize: 18, fontWeight: '700', color: theme.milyColors.brownDark },
  statLabel: { fontSize: 12, color: theme.milyColors.brownMid },
  empty: { flex: 1, textAlign: 'center', color: theme.milyColors.brownMid, marginTop: 40 },
});
