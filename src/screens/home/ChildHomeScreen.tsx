// ChildHomeScreen.tsx — 자녀 홈 화면
// 용돈잔액 + 저금통 + 목표 + 칭찬카드 + 밀리 한마디 + FAB
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { theme } from '../../ui/theme';
import { DarkCard } from '../../components/ui/DarkCard';
import { MilyCard } from '../../components/ui/MilyCard';
import { FABZone, FABAction } from '../../components/ui/FABZone';

interface ChildHomeScreenProps {
  displayName: string;
  weeklyBudget: number;
  weeklySpent: number;
  piggyBankAmount: number;
  goalTitle?: string;
  goalProgress?: number;   // 0~1
  coachingMessage?: string;
  pendingPraiseCount?: number;
  notifCount?: number;
  onCheckin: () => void;
  onRequestCard: () => void;
  onDreamStudio: () => void;
  onNotif: () => void;
  onMenu: () => void;
  onPraise?: () => void;
}

export function ChildHomeScreen({
  displayName,
  weeklyBudget,
  weeklySpent,
  piggyBankAmount,
  goalTitle,
  goalProgress = 0,
  coachingMessage,
  pendingPraiseCount = 0,
  notifCount = 0,
  onCheckin,
  onRequestCard,
  onDreamStudio,
  onNotif,
  onMenu,
  onPraise,
}: ChildHomeScreenProps) {
  const remaining = weeklyBudget - weeklySpent;
  const usedPct = weeklyBudget > 0 ? Math.min(1, weeklySpent / weeklyBudget) : 0;

  const fabSecondary: FABAction[] = [
    { key: 'request', label: '요청카드', emoji: '✉️', onPress: onRequestCard },
    { key: 'dream', label: '꿈 설계소', emoji: '🎯', onPress: onDreamStudio },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>Mily</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={onNotif} style={styles.iconBtn}>
            <Text style={styles.iconText}>🔔</Text>
            {notifCount > 0 && (
              <View style={styles.notifBadge}><Text style={styles.notifBadgeText}>{notifCount}</Text></View>
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={onMenu} style={styles.iconBtn}>
            <Text style={styles.iconText}>☰</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* 칭찬카드 알림 */}
        {pendingPraiseCount > 0 && onPraise && (
          <TouchableOpacity style={styles.praiseAlert} onPress={onPraise}>
            <Text style={styles.praiseAlertText}>💌 칭찬 카드가 {pendingPraiseCount}개 도착했어요!</Text>
          </TouchableOpacity>
        )}

        {/* 용돈 잔액 DarkCard */}
        <DarkCard>
          <Text style={styles.darkLabel}>이번 주 남은 용돈</Text>
          <Text style={styles.darkAmount}>{remaining.toLocaleString()}원</Text>
          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: `${Math.round(usedPct * 100)}%` }]} />
          </View>
          <View style={styles.darkRow}>
            <Text style={styles.darkSub}>저금통 {piggyBankAmount.toLocaleString()}원</Text>
            <Text style={styles.darkSub}>💰</Text>
          </View>
        </DarkCard>

        {/* 목표 진행 카드 */}
        {goalTitle && (
          <MilyCard>
            <Text style={styles.goalLabel}>목표</Text>
            <Text style={styles.goalTitle}>{goalTitle}</Text>
            <View style={styles.goalProgressBg}>
              <View style={[styles.goalProgressFill, { width: `${Math.round(goalProgress * 100)}%` }]} />
            </View>
            <Text style={styles.goalPct}>{Math.round(goalProgress * 100)}%</Text>
          </MilyCard>
        )}

        {/* 밀리 한마디 */}
        {coachingMessage && (
          <MilyCard style={styles.coachCard}>
            <Text style={styles.coachPrefix}>Mily 🌱</Text>
            <Text style={styles.coachText}>{coachingMessage}</Text>
          </MilyCard>
        )}
      </ScrollView>

      <FABZone
        mainAction={{ key: 'checkin', label: '오늘 기록하기', onPress: onCheckin }}
        secondaryActions={fabSecondary}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.milyColors.cream },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 },
  logo: { fontSize: 24, fontWeight: '700', color: theme.milyColors.brownDark },
  headerRight: { flexDirection: 'row', gap: 8 },
  iconBtn: { padding: 8, position: 'relative' },
  iconText: { fontSize: 20 },
  notifBadge: { position: 'absolute', top: 4, right: 4, backgroundColor: theme.milyColors.coral, borderRadius: 8, width: 16, height: 16, justifyContent: 'center', alignItems: 'center' },
  notifBadgeText: { fontSize: 10, color: '#fff', fontWeight: '700' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 100 },
  praiseAlert: { backgroundColor: theme.milyColors.mintBg, borderRadius: theme.borderRadius.card, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: theme.milyColors.mint },
  praiseAlertText: { fontSize: 14, color: theme.milyColors.brownDark, fontWeight: '500' },
  // Dark card
  darkLabel: { fontSize: 13, color: theme.milyColors.brownLight, marginBottom: 4 },
  darkAmount: { fontSize: 36, fontWeight: '700', color: '#fff', marginBottom: 12 },
  progressBg: { height: 6, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 3, marginBottom: 10 },
  progressFill: { height: 6, backgroundColor: theme.milyColors.coralLight, borderRadius: 3 },
  darkRow: { flexDirection: 'row', justifyContent: 'space-between' },
  darkSub: { fontSize: 13, color: theme.milyColors.brownLight },
  // 목표
  goalLabel: { fontSize: 12, color: theme.milyColors.brownMid, marginBottom: 4 },
  goalTitle: { fontSize: 16, fontWeight: '600', color: theme.milyColors.brownDark, marginBottom: 10 },
  goalProgressBg: { height: 8, backgroundColor: theme.milyColors.surface2, borderRadius: 4, marginBottom: 6 },
  goalProgressFill: { height: 8, backgroundColor: theme.milyColors.mint, borderRadius: 4 },
  goalPct: { fontSize: 13, color: theme.milyColors.mint, fontWeight: '600' },
  // 코칭
  coachCard: { borderLeftWidth: 3, borderLeftColor: theme.milyColors.coral },
  coachPrefix: { fontSize: 12, color: theme.milyColors.coral, fontWeight: '600', marginBottom: 6 },
  coachText: { fontSize: 14, color: theme.milyColors.brownDark, lineHeight: 20 },
});
