// ParentReplyScreen.tsx — 부모 요청 응답 화면
// 요청 내용 DarkCard + AI 분석 카드 + 3단계 응답
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView,
} from 'react-native';
import { theme } from '../../ui/theme';
import { DarkCard } from '../../components/ui/DarkCard';
import { MilyCard } from '../../components/ui/MilyCard';
import { MilyButton } from '../../components/ui/MilyButton';

type ReplyAction = 'accept' | 'counter' | 'decline';

interface DeclineReason {
  key: string;
  label: string;
}

const DECLINE_REASONS: DeclineReason[] = [
  { key: 'timing', label: '지금은 시기가 맞지 않아요' },
  { key: 'budget', label: '이번 달 예산이 빠듯해요' },
  { key: 'promise', label: '이전 약속을 먼저 확인해봐요' },
  { key: 'talk', label: '대화로 같이 생각해봐요' },
];

interface ParentReplyScreenProps {
  requestType: string;
  requestAmount?: number;
  aiBufferedContent: string;     // AI가 완충한 내용
  promiseKeepRate?: number;      // 0~1 약속 이행률
  contextNote?: string;          // 이 요청의 맥락
  onAccept: () => void;
  onCounter: () => void;
  onDecline: (reason: string) => void;
  onBack: () => void;
}

export function ParentReplyScreen({
  requestType, requestAmount, aiBufferedContent,
  promiseKeepRate, contextNote, onAccept, onCounter, onDecline, onBack,
}: ParentReplyScreenProps) {
  const [action, setAction] = useState<ReplyAction | null>(null);
  const [declineReason, setDeclineReason] = useState<string | null>(null);
  const keepPct = promiseKeepRate != null ? Math.round(promiseKeepRate * 100) : null;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>‹ 뒤로</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>요청 응답</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* 요청 내용 DarkCard */}
        <DarkCard>
          <Text style={styles.darkLabel}>요청 유형</Text>
          <Text style={styles.darkType}>{requestType}</Text>
          {requestAmount != null && requestAmount > 0 && (
            <Text style={styles.darkAmount}>{requestAmount.toLocaleString()}원</Text>
          )}
          <View style={styles.darkDivider} />
          <Text style={styles.darkBufferedLabel}>Mily 요약</Text>
          <Text style={styles.darkBufferedText}>{aiBufferedContent}</Text>
        </DarkCard>

        {/* AI 분석 카드 */}
        <MilyCard>
          <Text style={styles.analysisTitle}>📊 참고 정보</Text>
          {keepPct != null && (
            <View style={styles.analysisRow}>
              <Text style={styles.analysisLabel}>이번 주 약속 이행</Text>
              <Text style={styles.analysisValue}>{keepPct}%</Text>
            </View>
          )}
          {contextNote && (
            <View style={styles.analysisRow}>
              <Text style={styles.analysisLabel}>맥락</Text>
              <Text style={styles.analysisContext}>{contextNote}</Text>
            </View>
          )}
        </MilyCard>

        {/* 응답 선택 */}
        <Text style={styles.sectionLabel}>어떻게 응답할까요?</Text>
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionBtn, action === 'accept' && styles.actionBtnAccept]}
            onPress={() => { setAction('accept'); onAccept(); }}
          >
            <Text style={styles.actionEmoji}>✓</Text>
            <Text style={styles.actionLabel}>수락</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, action === 'counter' && styles.actionBtnCounter]}
            onPress={() => { setAction('counter'); onCounter(); }}
          >
            <Text style={styles.actionEmoji}>↔</Text>
            <Text style={styles.actionLabel}>조건 제안</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, action === 'decline' && styles.actionBtnDecline]}
            onPress={() => setAction('decline')}
          >
            <Text style={styles.actionEmoji}>✕</Text>
            <Text style={styles.actionLabel}>반려</Text>
          </TouchableOpacity>
        </View>

        {/* 반려 이유 (상처 최소화) */}
        {action === 'decline' && (
          <MilyCard>
            <Text style={styles.declineTitle}>어떤 이유인가요?</Text>
            {DECLINE_REASONS.map((r) => (
              <TouchableOpacity
                key={r.key}
                style={[styles.declineOption, declineReason === r.key && styles.declineOptionSelected]}
                onPress={() => setDeclineReason(r.key)}
              >
                <Text style={styles.declineOptionText}>{r.label}</Text>
                {declineReason === r.key && <Text style={styles.declineCheck}>✓</Text>}
              </TouchableOpacity>
            ))}
            {declineReason && (
              <MilyButton
                label="반려하기"
                variant="secondary"
                onPress={() => onDecline(declineReason)}
                style={{ marginTop: 12 }}
              />
            )}
          </MilyCard>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.milyColors.cream },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { padding: 4 },
  backText: { fontSize: 16, color: theme.milyColors.coral },
  headerTitle: { fontSize: 17, fontWeight: '600', color: theme.milyColors.brownDark },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 12 },
  darkLabel: { fontSize: 12, color: theme.milyColors.brownLight, marginBottom: 4 },
  darkType: { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 6 },
  darkAmount: { fontSize: 28, fontWeight: '700', color: theme.milyColors.gold, marginBottom: 10 },
  darkDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.15)', marginVertical: 12 },
  darkBufferedLabel: { fontSize: 12, color: theme.milyColors.brownLight, marginBottom: 6 },
  darkBufferedText: { fontSize: 14, color: '#fff', lineHeight: 20 },
  analysisTitle: { fontSize: 14, fontWeight: '600', color: theme.milyColors.brownDark, marginBottom: 10 },
  analysisRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  analysisLabel: { fontSize: 13, color: theme.milyColors.brownMid },
  analysisValue: { fontSize: 14, fontWeight: '700', color: theme.milyColors.coral },
  analysisContext: { fontSize: 13, color: theme.milyColors.brownDark, flex: 1, textAlign: 'right' },
  sectionLabel: { fontSize: 14, fontWeight: '600', color: theme.milyColors.brownDark },
  actionButtons: { flexDirection: 'row', gap: 10 },
  actionBtn: { flex: 1, backgroundColor: '#fff', borderRadius: theme.borderRadius.card, padding: 16, alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
  actionBtnAccept: { borderColor: theme.milyColors.mint, backgroundColor: theme.milyColors.mintBg },
  actionBtnCounter: { borderColor: theme.milyColors.gold },
  actionBtnDecline: { borderColor: theme.milyColors.brownLight },
  actionEmoji: { fontSize: 22, marginBottom: 6 },
  actionLabel: { fontSize: 13, fontWeight: '600', color: theme.milyColors.brownDark },
  declineTitle: { fontSize: 14, fontWeight: '600', color: theme.milyColors.brownDark, marginBottom: 10 },
  declineOption: { paddingVertical: 12, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: theme.milyColors.surface2, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  declineOptionSelected: { backgroundColor: theme.milyColors.surface2, borderRadius: 8, paddingHorizontal: 8 },
  declineOptionText: { fontSize: 14, color: theme.milyColors.brownDark },
  declineCheck: { fontSize: 16, color: theme.milyColors.coral },
});
