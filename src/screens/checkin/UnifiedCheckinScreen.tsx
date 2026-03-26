// UnifiedCheckinScreen.tsx — 통합 체크인 (5초 기본 + 자세히 토글)
// 기본: 금액만 → AI 카테고리 추측 → 확인 1번
// 자세히: 지출유형 4종 + 감정태그 + 메모
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  SafeAreaView, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { theme } from '../../ui/theme';
import { MilyButton } from '../../components/ui/MilyButton';
import { SpendType } from '../../engines/plan/defaultCategories';

type EmotionTag = 'impulse' | 'stress' | 'social' | 'reward';

interface CheckinInput {
  amount: number;
  spendType: SpendType;
  categoryId?: string;
  emotionTag?: EmotionTag;
  memo?: string;
  isCashGift?: boolean;
}

interface UnifiedCheckinScreenProps {
  suggestedCategory?: string;
  onSubmit: (input: CheckinInput) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const SPEND_TYPES: { key: SpendType; label: string; emoji: string; desc: string }[] = [
  { key: 'fixed', label: '고정비', emoji: '🔒', desc: '월세, 통신비 등' },
  { key: 'living', label: '생활', emoji: '🛒', desc: '식비, 생필품 등' },
  { key: 'choice', label: '선택', emoji: '✨', desc: '카페, 취미 등' },
];

const CHILD_SPEND_TYPES: { key: SpendType; label: string; emoji: string }[] = [
  { key: 'fixed', label: '정해진 거', emoji: '🔒' },
  { key: 'choice', label: '내가 선택한 거', emoji: '✨' },
];

const EMOTION_TAGS: { key: EmotionTag; emoji: string; label: string }[] = [
  { key: 'impulse', emoji: '⚡', label: '충동' },
  { key: 'stress', emoji: '😤', label: '스트레스' },
  { key: 'social', emoji: '👥', label: '사회적' },
  { key: 'reward', emoji: '🎁', label: '보상' },
];

export function UnifiedCheckinScreen({
  suggestedCategory, onSubmit, onCancel, isSubmitting,
}: UnifiedCheckinScreenProps) {
  const [amount, setAmount] = useState('');
  const [isDetail, setIsDetail] = useState(false);
  const [spendType, setSpendType] = useState<SpendType>('choice');
  const [emotionTag, setEmotionTag] = useState<EmotionTag | null>(null);
  const [memo, setMemo] = useState('');
  const [isCashGift, setIsCashGift] = useState(false);

  const parsedAmount = parseInt(amount.replace(/[^0-9]/g, ''), 10) || 0;
  const canSubmit = parsedAmount > 0;

  const handleSubmit = () => {
    onSubmit({
      amount: parsedAmount,
      spendType,
      emotionTag: emotionTag ?? undefined,
      memo: memo.trim() || undefined,
      isCashGift,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onCancel} style={styles.cancelBtn}>
            <Text style={styles.cancelText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>오늘 기록하기</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* 금액 입력 (항상 표시) */}
          <View style={styles.amountBox}>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={(t) => setAmount(t.replace(/[^0-9]/g, ''))}
              keyboardType="numeric"
              placeholder="얼마를 썼나요?"
              placeholderTextColor={theme.milyColors.brownLight}
              autoFocus
            />
            <Text style={styles.amountUnit}>원</Text>
          </View>

          {/* AI 카테고리 추측 */}
          {suggestedCategory && !isDetail && (
            <View style={styles.suggestRow}>
              <Text style={styles.suggestText}>✨ {suggestedCategory}</Text>
            </View>
          )}

          {/* 세뱃돈/현금 버튼 */}
          <TouchableOpacity
            style={[styles.cashGiftBtn, isCashGift && styles.cashGiftBtnActive]}
            onPress={() => setIsCashGift(!isCashGift)}
          >
            <Text style={styles.cashGiftBtnText}>🎎 세뱃돈/현금</Text>
            {isCashGift && <Text style={styles.cashGiftCheck}>✓</Text>}
          </TouchableOpacity>

          {/* 자세히 토글 */}
          <TouchableOpacity style={styles.detailToggle} onPress={() => setIsDetail(!isDetail)}>
            <Text style={styles.detailToggleText}>{isDetail ? '▼ 간단히' : '▶ 자세히 기록하기'}</Text>
          </TouchableOpacity>

          {isDetail && (
            <>
              {/* 지출 유형 */}
              <Text style={styles.sectionLabel}>지출 유형</Text>
              <View style={styles.spendRow}>
                {SPEND_TYPES.map((s) => (
                  <TouchableOpacity
                    key={s.key}
                    style={[styles.spendBtn, spendType === s.key && styles.spendBtnActive]}
                    onPress={() => setSpendType(s.key)}
                  >
                    <Text style={styles.spendEmoji}>{s.emoji}</Text>
                    <Text style={[styles.spendLabel, spendType === s.key && styles.spendLabelActive]}>{s.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* 감정 태그 */}
              <Text style={styles.sectionLabel}>감정 태그 <Text style={styles.optional}>(선택)</Text></Text>
              <View style={styles.emotionRow}>
                {EMOTION_TAGS.map((e) => (
                  <TouchableOpacity
                    key={e.key}
                    style={[styles.emotionBtn, emotionTag === e.key && styles.emotionBtnActive]}
                    onPress={() => setEmotionTag(emotionTag === e.key ? null : e.key)}
                  >
                    <Text style={styles.emotionEmoji}>{e.emoji}</Text>
                    <Text style={[styles.emotionLabel, emotionTag === e.key && styles.emotionLabelActive]}>{e.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* 메모 */}
              <Text style={styles.sectionLabel}>메모 <Text style={styles.optional}>(선택)</Text></Text>
              <TextInput
                style={styles.memoInput}
                value={memo}
                onChangeText={setMemo}
                placeholder="간단히 메모해요"
                placeholderTextColor={theme.milyColors.brownLight}
              />
            </>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <MilyButton
            label={isSubmitting ? '기록 중...' : '기록하기'}
            onPress={handleSubmit}
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
  content: { padding: 16, gap: 12 },
  amountBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: theme.borderRadius.card, padding: 20, marginBottom: 4 },
  amountInput: { flex: 1, fontSize: 32, fontWeight: '700', color: theme.milyColors.brownDark },
  amountUnit: { fontSize: 20, color: theme.milyColors.brownMid, marginLeft: 8 },
  suggestRow: { backgroundColor: theme.milyColors.mintBg, borderRadius: theme.borderRadius.input, padding: 10 },
  suggestText: { fontSize: 14, color: theme.milyColors.mint, fontWeight: '500' },
  cashGiftBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', borderRadius: theme.borderRadius.input, padding: 12, borderWidth: 1, borderColor: theme.milyColors.surface2 },
  cashGiftBtnActive: { borderColor: theme.milyColors.gold, backgroundColor: theme.milyColors.gold + '15' },
  cashGiftBtnText: { fontSize: 14, color: theme.milyColors.brownDark },
  cashGiftCheck: { fontSize: 16, color: theme.milyColors.gold, fontWeight: '700' },
  detailToggle: { paddingVertical: 8 },
  detailToggleText: { fontSize: 14, color: theme.milyColors.coral, fontWeight: '500' },
  sectionLabel: { fontSize: 13, fontWeight: '600', color: theme.milyColors.brownDark, marginTop: 4 },
  optional: { fontWeight: '400', color: theme.milyColors.brownLight },
  spendRow: { flexDirection: 'row', gap: 8 },
  spendBtn: { flex: 1, backgroundColor: '#fff', borderRadius: theme.borderRadius.card, padding: 10, alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
  spendBtnActive: { borderColor: theme.milyColors.coral, backgroundColor: theme.milyColors.coral + '10' },
  spendEmoji: { fontSize: 20, marginBottom: 4 },
  spendLabel: { fontSize: 12, color: theme.milyColors.brownMid, fontWeight: '500' },
  spendLabelActive: { color: theme.milyColors.coral },
  emotionRow: { flexDirection: 'row', gap: 8 },
  emotionBtn: { flex: 1, backgroundColor: '#fff', borderRadius: theme.borderRadius.card, padding: 10, alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
  emotionBtnActive: { borderColor: theme.milyColors.brownMid },
  emotionEmoji: { fontSize: 18, marginBottom: 4 },
  emotionLabel: { fontSize: 12, color: theme.milyColors.brownMid },
  emotionLabelActive: { color: theme.milyColors.brownDark, fontWeight: '600' },
  memoInput: { backgroundColor: '#fff', borderRadius: theme.borderRadius.input, padding: 12, fontSize: 14, color: theme.milyColors.brownDark },
  footer: { padding: 16 },
});
