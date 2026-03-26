// AdultHomeScreen.tsx — 성인(부모) 홈 화면
// 로고 + 알림 + 세뱃돈 이벤트 카드 + DarkCard 소비 현황
// 약속 이행 카드 + AI 코칭 + FABZone
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
import { MilyBadge } from '../../components/ui/MilyBadge';

interface PromiseRecord {
  emoji: string;
  label: string;
  kept: boolean;
}

interface AdultHomeScreenProps {
  userName: string;
  weekBudget: number;
  weekSpent: number;
  passiveIncomeRatio: number;      // 0~1
  promiseStage: 1 | 2 | 3 | 4;   // 🌱🌿🌳🌲
  aiCoaching?: string;
  notifCount?: number;
  showCashGiftEvent?: boolean;
  cashGiftOccasion?: string;
  onCheckin: () => void;
  onReview: () => void;
  onRequestCard: () => void;
  onDreamStudio: () => void;
  onNotif: () => void;
  onMenu: () => void;
  onCashGift?: () => void;
}

const PROMISE_EMOJIS = ['', '🌱', '🌿', '🌳', '🌲'];

export function AdultHomeScreen({
  userName,
  weekBudget,
  weekSpent,
  passiveIncomeRatio,
  promiseStage,
  aiCoaching,
  notifCount = 0,
  showCashGiftEvent,
  cashGiftOccasion,
  onCheckin,
  onReview,
  onRequestCard,
  onDreamStudio,
  onNotif,
  onMenu,
  onCashGift,
}: AdultHomeScreenProps) {
  const remaining = weekBudget - weekSpent;
  const usedPct = weekBudget > 0 ? Math.min(1, weekSpent / weekBudget) : 0;
  const passivePct = Math.round(passiveIncomeRatio * 100);

  const fabSecondary: FABAction[] = [
    { key: 'review', label: '주간회고', emoji: '📋', onPress: onReview },
    { key: 'request', label: '요청카드', emoji: '✉️', onPress: onRequestCard },
    { key: 'dream', label: '꿈 설계소', emoji: '🎯', onPress: onDreamStudio },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
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
        {/* 세뱃돈 이벤트 카드 */}
        {showCashGiftEvent && cashGiftOccasion && (
          <TouchableOpacity style={styles.eventCard} onPress={onCashGift} activeOpacity={0.85}>
            <Text style={styles.eventEmoji}>🎎</Text>
            <View style={styles.eventText}>
              <Text style={styles.eventTitle}>{cashGiftOccasion} 기록해볼까요?</Text>
              <Text style={styles.eventDesc}>세뱃돈/명절돈을 함께 기록해요</Text>
            </View>
            <Text style={styles.eventArrow}>›</Text>
          </TouchableOpacity>
        )}

        {/* 소비 현황 DarkCard */}
        <DarkCard>
          <Text style={styles.darkCardLabel}>이번 주 선택 소비</Text>
          <Text style={styles.darkCardAmount}>{weekSpent.toLocaleString()}원</Text>
          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: `${Math.round(usedPct * 100)}%` }]} />
          </View>
          <View style={styles.darkCardRow}>
            <Text style={styles.darkCardSub}>남은 예산 {remaining.toLocaleString()}원</Text>
            <MilyBadge label={`수동소득 ${passivePct}%`} variant="mint" style={{ marginLeft: 8 }} />
          </View>
        </DarkCard>

        {/* 약속 이행 카드 */}
        <MilyCard>
          <View style={styles.promiseRow}>
            <Text style={styles.promiseEmoji}>{PROMISE_EMOJIS[promiseStage]}</Text>
            <View>
              <Text style={styles.promiseTitle}>약속 기록</Text>
              <Text style={styles.promiseDesc}>꾸준히 이어가고 있어요</Text>
            </View>
          </View>
        </MilyCard>

        {/* AI 코칭 카드 */}
        {aiCoaching && (
          <MilyCard style={styles.coachingCard}>
            <Text style={styles.coachingPrefix}>Mily 🌿</Text>
            <Text style={styles.coachingText}>{aiCoaching}</Text>
          </MilyCard>
        )}
      </ScrollView>

      {/* FAB */}
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
  // 이벤트 카드
  eventCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.milyColors.gold + '22', borderRadius: theme.borderRadius.card, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: theme.milyColors.gold },
  eventEmoji: { fontSize: 28, marginRight: 12 },
  eventText: { flex: 1 },
  eventTitle: { fontSize: 15, fontWeight: '600', color: theme.milyColors.brownDark },
  eventDesc: { fontSize: 12, color: theme.milyColors.brownMid, marginTop: 2 },
  eventArrow: { fontSize: 20, color: theme.milyColors.brownMid },
  // DarkCard 내용
  darkCardLabel: { fontSize: 13, color: theme.milyColors.brownLight, marginBottom: 4 },
  darkCardAmount: { fontSize: 32, fontWeight: '700', color: '#fff', marginBottom: 12 },
  progressBg: { height: 6, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 3, marginBottom: 10 },
  progressFill: { height: 6, backgroundColor: theme.milyColors.coral, borderRadius: 3 },
  darkCardRow: { flexDirection: 'row', alignItems: 'center' },
  darkCardSub: { fontSize: 13, color: theme.milyColors.brownLight },
  // 약속 카드
  promiseRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  promiseEmoji: { fontSize: 36 },
  promiseTitle: { fontSize: 16, fontWeight: '600', color: theme.milyColors.brownDark },
  promiseDesc: { fontSize: 13, color: theme.milyColors.brownMid, marginTop: 2 },
  // 코칭 카드
  coachingCard: { borderLeftWidth: 3, borderLeftColor: theme.milyColors.mint },
  coachingPrefix: { fontSize: 12, color: theme.milyColors.mint, fontWeight: '600', marginBottom: 6 },
  coachingText: { fontSize: 14, color: theme.milyColors.brownDark, lineHeight: 20 },
});
