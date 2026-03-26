// ChildRequestScreen.tsx — 자녀 요청 카드 작성
// 요청 유형 2x2 그리드 + 금액/이유 입력 + AI 완충 미리보기
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, SafeAreaView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { theme } from '../../ui/theme';
import { MilyButton } from '../../components/ui/MilyButton';
import { MilyCard } from '../../components/ui/MilyCard';
import { RequestCardType } from '../../engines/requestCard/requestCardService';

interface ChildRequestScreenProps {
  onSubmit: (type: RequestCardType, amount: number, reason: string) => void;
  onCancel: () => void;
  aiBufferPreview?: string;
  isSubmitting?: boolean;
}

const REQUEST_TYPES: { key: RequestCardType; emoji: string; label: string; desc: string }[] = [
  { key: 'extra_budget', emoji: '💰', label: '추가 예산', desc: '이번 주 예산이 부족해요' },
  { key: 'plan_change', emoji: '📋', label: '계획 변경', desc: '예산 비율을 바꾸고 싶어요' },
  { key: 'reward', emoji: '🎁', label: '보상 제안', desc: '약속을 지켰어요!' },
  { key: 'purchase_check', emoji: '🛒', label: '구매 확인', desc: '사도 될까요?' },
];

export function ChildRequestScreen({ onSubmit, onCancel, aiBufferPreview, isSubmitting }: ChildRequestScreenProps) {
  const [type, setType] = useState<RequestCardType | null>(null);
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');

  const canSubmit = type !== null && reason.trim().length > 0;
  const parsedAmount = parseInt(amount.replace(/[^0-9]/g, ''), 10) || 0;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onCancel} style={styles.cancelBtn}>
            <Text style={styles.cancelText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>요청 카드 보내기</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* 요청 유형 2x2 */}
          <Text style={styles.sectionLabel}>어떤 요청인가요?</Text>
          <View style={styles.typeGrid}>
            {REQUEST_TYPES.map((rt) => (
              <TouchableOpacity
                key={rt.key}
                style={[styles.typeCard, type === rt.key && styles.typeCardSelected]}
                onPress={() => setType(rt.key)}
                activeOpacity={0.8}
              >
                <Text style={styles.typeEmoji}>{rt.emoji}</Text>
                <Text style={[styles.typeLabel, type === rt.key && styles.typeLabelSelected]}>{rt.label}</Text>
                <Text style={styles.typeDesc}>{rt.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* 금액 (선택) */}
          <Text style={styles.sectionLabel}>금액 <Text style={styles.optional}>(선택)</Text></Text>
          <View style={styles.amountBox}>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={(t) => setAmount(t.replace(/[^0-9]/g, ''))}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={theme.milyColors.brownLight}
            />
            <Text style={styles.amountUnit}>원</Text>
          </View>

          {/* 이유 */}
          <Text style={styles.sectionLabel}>왜 요청하나요?</Text>
          <TextInput
            style={styles.reasonInput}
            value={reason}
            onChangeText={setReason}
            multiline
            numberOfLines={3}
            placeholder="부모님께 전할 이야기를 써봐요"
            placeholderTextColor={theme.milyColors.brownLight}
          />

          {/* AI 완충 미리보기 */}
          {aiBufferPreview && (
            <MilyCard style={styles.previewCard}>
              <Text style={styles.previewLabel}>✨ Mily가 전달할 메시지</Text>
              <Text style={styles.previewText}>{aiBufferPreview}</Text>
            </MilyCard>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <MilyButton
            label={isSubmitting ? '보내는 중...' : '요청 카드 보내기'}
            onPress={() => type && onSubmit(type, parsedAmount, reason)}
            disabled={!canSubmit || isSubmitting}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.milyColors.cream },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.milyColors.surface2 },
  cancelBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  cancelText: { fontSize: 18, color: theme.milyColors.brownMid },
  headerTitle: { fontSize: 17, fontWeight: '600', color: theme.milyColors.brownDark },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 8 },
  sectionLabel: { fontSize: 14, fontWeight: '600', color: theme.milyColors.brownDark, marginTop: 8, marginBottom: 8 },
  optional: { fontWeight: '400', color: theme.milyColors.brownLight },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 8 },
  typeCard: { width: '47%', backgroundColor: '#fff', borderRadius: theme.borderRadius.card, padding: 14, borderWidth: 2, borderColor: 'transparent' },
  typeCardSelected: { borderColor: theme.milyColors.coral, backgroundColor: theme.milyColors.coral + '10' },
  typeEmoji: { fontSize: 24, marginBottom: 6 },
  typeLabel: { fontSize: 14, fontWeight: '600', color: theme.milyColors.brownDark, marginBottom: 4 },
  typeLabelSelected: { color: theme.milyColors.coral },
  typeDesc: { fontSize: 12, color: theme.milyColors.brownMid },
  amountBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: theme.borderRadius.input, padding: 12, marginBottom: 8 },
  amountInput: { flex: 1, fontSize: 20, fontWeight: '600', color: theme.milyColors.brownDark },
  amountUnit: { fontSize: 16, color: theme.milyColors.brownMid },
  reasonInput: { backgroundColor: '#fff', borderRadius: theme.borderRadius.input, padding: 12, fontSize: 14, color: theme.milyColors.brownDark, minHeight: 80, textAlignVertical: 'top', marginBottom: 8 },
  previewCard: { borderLeftWidth: 3, borderLeftColor: theme.milyColors.mint },
  previewLabel: { fontSize: 12, color: theme.milyColors.mint, fontWeight: '600', marginBottom: 6 },
  previewText: { fontSize: 14, color: theme.milyColors.brownDark, lineHeight: 20 },
  footer: { padding: 16 },
});
