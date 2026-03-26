// WeeklyReviewScreen.tsx — 주간 회고
// AI 회고 DarkCard (판단 없음, 질문형) + 약속 체크 + 가족 요약
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView,
} from 'react-native';
import { theme } from '../../ui/theme';
import { DarkCard } from '../../components/ui/DarkCard';
import { MilyCard } from '../../components/ui/MilyCard';
import { MilyButton } from '../../components/ui/MilyButton';

interface WeeklyReviewScreenProps {
  weekId: string;
  aiReview: { highlight: string; curious: string; nextStep: string };
  weeklyPromise?: string;
  promiseKept?: boolean | null;
  familySummary?: string;
  onComplete: (promiseKept: boolean | null) => void;
  onClose: () => void;
}

export function WeeklyReviewScreen({
  weekId, aiReview, weeklyPromise, promiseKept: initialPromiseKept,
  familySummary, onComplete, onClose,
}: WeeklyReviewScreenProps) {
  const [kept, setKept] = useState<boolean | null>(initialPromiseKept ?? null);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>주간 회고</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* AI 회고 DarkCard */}
        <DarkCard>
          <Text style={styles.darkLabel}>Mily 회고</Text>
          <View style={styles.reviewSection}>
            <Text style={styles.reviewSectionTitle}>✨ 잘한 점</Text>
            <Text style={styles.reviewSectionText}>{aiReview.highlight}</Text>
          </View>
          <View style={styles.reviewSection}>
            <Text style={styles.reviewSectionTitle}>🤔 궁금한 점</Text>
            <Text style={styles.reviewSectionText}>{aiReview.curious}</Text>
          </View>
          <View style={styles.reviewSection}>
            <Text style={styles.reviewSectionTitle}>🎯 다음 주 한 가지</Text>
            <Text style={styles.reviewSectionText}>{aiReview.nextStep}</Text>
          </View>
        </DarkCard>

        {/* 약속 체크 */}
        {weeklyPromise && (
          <MilyCard>
            <Text style={styles.promiseLabel}>이번 주 약속</Text>
            <Text style={styles.promiseText}>{weeklyPromise}</Text>
            <Text style={styles.promiseQuestion}>어떻게 됐나요?</Text>
            <View style={styles.promiseButtons}>
              <TouchableOpacity
                style={[styles.promiseBtn, kept === true && styles.promiseBtnYes]}
                onPress={() => setKept(true)}
              >
                <Text style={styles.promiseBtnText}>👍 지켰어요</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.promiseBtn, kept === false && styles.promiseBtnNo]}
                onPress={() => setKept(false)}
              >
                <Text style={styles.promiseBtnText}>🌱 아직이에요</Text>
              </TouchableOpacity>
            </View>
          </MilyCard>
        )}

        {/* 가족 요약 */}
        {familySummary && (
          <MilyCard style={styles.familyCard}>
            <Text style={styles.familyLabel}>👨‍👩‍👧 이번 주 가족</Text>
            <Text style={styles.familyText}>{familySummary}</Text>
          </MilyCard>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <MilyButton label="회고 완료" onPress={() => onComplete(kept)} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.milyColors.cream },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: theme.milyColors.brownDark },
  closeBtn: { padding: 8 },
  closeText: { fontSize: 18, color: theme.milyColors.brownMid },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 12 },
  darkLabel: { fontSize: 12, color: theme.milyColors.brownLight, marginBottom: 12 },
  reviewSection: { marginBottom: 14 },
  reviewSectionTitle: { fontSize: 13, fontWeight: '600', color: theme.milyColors.gold, marginBottom: 6 },
  reviewSectionText: { fontSize: 14, color: '#fff', lineHeight: 20 },
  promiseLabel: { fontSize: 12, color: theme.milyColors.brownMid, marginBottom: 4 },
  promiseText: { fontSize: 15, fontWeight: '500', color: theme.milyColors.brownDark, marginBottom: 12 },
  promiseQuestion: { fontSize: 13, color: theme.milyColors.brownMid, marginBottom: 8 },
  promiseButtons: { flexDirection: 'row', gap: 10 },
  promiseBtn: { flex: 1, backgroundColor: theme.milyColors.surface2, borderRadius: theme.borderRadius.button, paddingVertical: 12, alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
  promiseBtnYes: { borderColor: theme.milyColors.mint, backgroundColor: theme.milyColors.mintBg },
  promiseBtnNo: { borderColor: theme.milyColors.coralLight },
  promiseBtnText: { fontSize: 14, color: theme.milyColors.brownDark, fontWeight: '500' },
  familyCard: { borderLeftWidth: 3, borderLeftColor: theme.milyColors.gold },
  familyLabel: { fontSize: 13, fontWeight: '600', color: theme.milyColors.brownDark, marginBottom: 6 },
  familyText: { fontSize: 14, color: theme.milyColors.brownMid, lineHeight: 20 },
  footer: { padding: 16 },
});
