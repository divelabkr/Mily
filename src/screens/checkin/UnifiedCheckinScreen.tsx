// ──────────────────────────────────────────────
// UnifiedCheckinScreen.tsx — 통합 체크인 화면
// 기본 모드: 금액 + 카테고리
// 자세히 모드: + spendType + 감정태그 + 메모
// Remote Config: unified_checkin_enabled 플래그
// ──────────────────────────────────────────────

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { theme } from '../../ui/theme';
import { DEFAULT_CATEGORIES, SpendType, CategoryId } from '../../engines/plan/defaultCategories';

// ── 타입 ──────────────────────────────────────

export type CheckinMode = 'basic' | 'detail';

export interface UnifiedCheckinData {
  amount: number;
  categoryId: CategoryId;
  spendType?: SpendType;
  emotionTag?: 'impulse' | 'stress' | 'social' | 'reward' | null;
  memo?: string;
}

// ── 감정 태그 옵션 ───────────────────────────

const EMOTION_OPTIONS: Array<{ key: string; label: string; emoji: string }> = [
  { key: 'impulse', label: '충동', emoji: '⚡' },
  { key: 'stress',  label: '스트레스', emoji: '😰' },
  { key: 'social',  label: '사회적', emoji: '👥' },
  { key: 'reward',  label: '보상', emoji: '🎁' },
];

// ── SpendType 옵션 ──────────────────────────

const SPEND_TYPE_OPTIONS: Array<{ key: SpendType; label: string; emoji: string }> = [
  { key: 'fixed',  label: '고정',  emoji: '🔒' },
  { key: 'living', label: '생활',  emoji: '🛒' },
  { key: 'choice', label: '선택',  emoji: '✨' },
  { key: 'give',   label: '나눔',  emoji: '🎁' },
];

// ── 메인 컴포넌트 ────────────────────────────

interface UnifiedCheckinScreenProps {
  onSubmit: (data: UnifiedCheckinData) => void;
}

export function UnifiedCheckinScreen({ onSubmit }: UnifiedCheckinScreenProps) {
  const { t } = useTranslation();
  const [mode, setMode] = useState<CheckinMode>('basic');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState<CategoryId>('food');
  const [spendType, setSpendType] = useState<SpendType>('choice');
  const [emotionTag, setEmotionTag] = useState<string | null>(null);
  const [memo, setMemo] = useState('');

  const handleSubmit = useCallback(() => {
    const parsed = parseInt(amount.replace(/,/g, ''), 10);
    if (isNaN(parsed) || parsed < 0) return;

    const data: UnifiedCheckinData = {
      amount: parsed,
      categoryId,
    };

    if (mode === 'detail') {
      data.spendType = spendType;
      data.emotionTag = emotionTag as UnifiedCheckinData['emotionTag'];
      data.memo = memo || undefined;
    }

    onSubmit(data);
  }, [amount, categoryId, mode, spendType, emotionTag, memo, onSubmit]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* ── 모드 토글 ─── */}
        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[styles.toggleBtn, mode === 'basic' && styles.toggleActive]}
            onPress={() => setMode('basic')}
          >
            <Text style={[styles.toggleText, mode === 'basic' && styles.toggleTextActive]}>
              {t('checkin_basic') || '기본'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, mode === 'detail' && styles.toggleActive]}
            onPress={() => setMode('detail')}
          >
            <Text style={[styles.toggleText, mode === 'detail' && styles.toggleTextActive]}>
              {t('checkin_detail') || '자세히'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── 금액 입력 ─── */}
        <Text style={styles.label}>{t('checkin_amount') || '금액'}</Text>
        <TextInput
          style={styles.amountInput}
          placeholder="0"
          keyboardType="numeric"
          value={amount}
          onChangeText={setAmount}
        />

        {/* ── 카테고리 선택 ─── */}
        <Text style={styles.label}>{t('checkin_category') || '카테고리'}</Text>
        <View style={styles.chipRow}>
          {DEFAULT_CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.chip, categoryId === cat.id && styles.chipActive]}
              onPress={() => setCategoryId(cat.id as CategoryId)}
            >
              <Text style={styles.chipEmoji}>{cat.emoji}</Text>
              <Text style={[styles.chipLabel, categoryId === cat.id && styles.chipLabelActive]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── 자세히 모드 전용 필드 ─── */}
        {mode === 'detail' && (
          <>
            {/* SpendType */}
            <Text style={styles.label}>{t('checkin_spend_type') || '지출 유형'}</Text>
            <View style={styles.chipRow}>
              {SPEND_TYPE_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.key}
                  style={[styles.chip, spendType === opt.key && styles.chipActive]}
                  onPress={() => setSpendType(opt.key)}
                >
                  <Text style={styles.chipEmoji}>{opt.emoji}</Text>
                  <Text style={[styles.chipLabel, spendType === opt.key && styles.chipLabelActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* 감정 태그 */}
            <Text style={styles.label}>{t('checkin_emotion') || '감정 태그'}</Text>
            <View style={styles.chipRow}>
              {EMOTION_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.key}
                  style={[styles.chip, emotionTag === opt.key && styles.chipActive]}
                  onPress={() => setEmotionTag(emotionTag === opt.key ? null : opt.key)}
                >
                  <Text style={styles.chipEmoji}>{opt.emoji}</Text>
                  <Text style={[styles.chipLabel, emotionTag === opt.key && styles.chipLabelActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* 메모 */}
            <Text style={styles.label}>{t('checkin_memo') || '메모'}</Text>
            <TextInput
              style={styles.memoInput}
              placeholder={t('checkin_memo_placeholder') || '한줄 메모 (선택)'}
              value={memo}
              onChangeText={setMemo}
              maxLength={100}
            />
          </>
        )}

        {/* ── 저장 버튼 ─── */}
        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
          <Text style={styles.submitText}>{t('checkin_save') || '기록하기'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ── 스타일 ─────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  scroll: { padding: 20, paddingBottom: 40 },
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  toggleActive: { backgroundColor: theme.colors.primary },
  toggleText: { fontSize: 14, color: theme.colors.textSecondary, fontWeight: '600' },
  toggleTextActive: { color: '#fff' },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: 8,
    marginTop: 16,
  },
  amountInput: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    color: theme.colors.textPrimary,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  chipActive: {
    backgroundColor: theme.colors.primary + '15',
    borderColor: theme.colors.primary,
  },
  chipEmoji: { fontSize: 14, marginRight: 4 },
  chipLabel: { fontSize: 13, color: theme.colors.textSecondary },
  chipLabelActive: { color: theme.colors.primary, fontWeight: '600' },
  memoInput: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    color: theme.colors.textPrimary,
  },
  submitBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 32,
  },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

export default UnifiedCheckinScreen;
