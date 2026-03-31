import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScreenLayout } from '../../src/ui/layouts/ScreenLayout';
import { Card } from '../../src/ui/components/Card';
import { BoundarySheet } from '../../src/ui/components/BoundarySheet';
import { TriggerPicker, TriggerType } from '../../src/components/ui/TriggerPicker';
import { theme } from '../../src/ui/theme';
import {
  DEFAULT_CATEGORIES,
  CategoryId,
} from '../../src/engines/plan/defaultCategories';
import {
  EmotionTag,
  SpendType,
  useCheckInStore,
  CheckIn,
  getWeeklyCategoryTotal,
} from '../../src/engines/checkin/checkinStore';
import { saveCheckIn } from '../../src/engines/checkin/checkinService';
import { loadRecentSuggestions } from '../../src/engines/checkin/recentSuggestion';
import { usePlanStore } from '../../src/engines/plan/planStore';
import { getCategoryWeeklyLimit } from '../../src/engines/plan/planService';
import { calculateBoundary } from '../../src/engines/checkin/planBoundary';
import { useAuthStore } from '../../src/engines/auth/authStore';
import { getWeekId } from '../../src/utils/dateUtils';
import { formatCurrency } from '../../src/utils/formatCurrency';
import {
  CheckInMode,
  CHECKIN_MODE_OPTIONS,
  loadCheckInMode,
  saveCheckInMode,
  getFieldsForMode,
} from '../../src/engines/checkin/checkinModeService';

const SPEND_TYPE_OPTIONS: { type: SpendType; emoji: string; labelKey: string }[] = [
  { type: 'fixed',  emoji: '🔒', labelKey: 'checkin_spend_type_fixed' },
  { type: 'living', emoji: '🛒', labelKey: 'checkin_spend_type_living' },
  { type: 'choice', emoji: '✨', labelKey: 'checkin_spend_type_choice' },
];

const EMOTION_OPTIONS: { tag: EmotionTag; emoji: string; labelKey: string }[] = [
  { tag: 'impulse', emoji: '⚡', labelKey: 'emotion_impulse' },
  { tag: 'stress',  emoji: '😮‍💨', labelKey: 'emotion_stress' },
  { tag: 'social',  emoji: '👫', labelKey: 'emotion_social' },
  { tag: 'reward',  emoji: '🎁', labelKey: 'emotion_reward' },
];

export default function CheckInScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const plan = usePlanStore((s) => s.currentPlan);
  const checkIns = useCheckInStore((s) => s.weeklyCheckIns);

  // Step 0: trigger picker, Step 1: form
  const [step, setStep] = useState<0 | 1>(0);
  const [triggerType, setTriggerType] = useState<TriggerType | null>(null);

  const [mode, setMode] = useState<CheckInMode>('standard');
  const [amount, setAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>('food');
  const [selectedSpendType, setSelectedSpendType] = useState<SpendType | null>(null);
  const [selectedEmotion, setSelectedEmotion] = useState<EmotionTag | null>(null);
  const [memo, setMemo] = useState('');
  const [similarMessage, setSimilarMessage] = useState<string | null>(null);
  const [outsideSheetVisible, setOutsideSheetVisible] = useState(false);
  const [pendingSave, setPendingSave] = useState<(() => void) | null>(null);
  const [recentSuggestions, setRecentSuggestions] = useState<CheckIn[]>([]);

  useEffect(() => {
    loadCheckInMode().then(setMode);
  }, []);

  useEffect(() => {
    if (!user || checkIns.length > 0) return;
    loadRecentSuggestions(user.uid).then(setRecentSuggestions);
  }, [user, checkIns.length]);

  const handleTriggerSelect = (type: TriggerType) => {
    setTriggerType(type);
    // 즉흥형 → 자세히 모드로 자동 전환 (감정태그 표시)
    if (type === 'impulse') setMode('detailed');
    setStep(1);
  };

  const handleModeChange = (newMode: CheckInMode) => {
    setMode(newMode);
    saveCheckInMode(newMode);
  };

  const fields = getFieldsForMode(mode);

  const applyRecentSuggestion = (item: CheckIn) => {
    setAmount(String(item.amount));
    setSelectedCategory(item.categoryId);
    setSelectedSpendType(item.spendType ?? null);
    setMemo(item.memo ?? '');
    setSelectedEmotion(null);
    setSimilarMessage(null);
  };

  const handleSave = async (force = false) => {
    const amountNum = parseInt(amount, 10);
    if (!amountNum || amountNum <= 0 || !user) return;
    try {
      if (plan && !force) {
        const currentTotal = getWeeklyCategoryTotal(checkIns, selectedCategory);
        const newTotal = currentTotal + amountNum;
        const limit = getCategoryWeeklyLimit(plan, selectedCategory);
        const boundary = calculateBoundary(newTotal, limit, selectedSpendType);
        const catInfo = DEFAULT_CATEGORIES.find((c) => c.id === selectedCategory);

        if (boundary === 'similar') {
          setSimilarMessage(t('boundary_similar', { category: catInfo?.label }));
        } else if (boundary === 'outside') {
          setSimilarMessage(null);
          setPendingSave(() => () => doSave(amountNum));
          setOutsideSheetVisible(true);
          return;
        }
      }
      await doSave(amountNum);
    } catch {
      // doSave 내부에서 Alert 처리
    }
  };

  const doSave = async (amountNum: number) => {
    if (!user) {
      Alert.alert('오류', '로그인이 필요해요. 다시 시도해주세요.');
      return;
    }
    try {
      await saveCheckIn({
        uid: user.uid,
        weekId: getWeekId(),
        categoryId: selectedCategory,
        amount: amountNum,
        spendType: selectedSpendType,
        memo: memo || undefined,
        emotionTag: selectedEmotion,
      });
      router.back();
    } catch {
      Alert.alert('저장 실패', '기록을 저장하지 못했어요. 잠시 후 다시 시도해주세요.');
    }
  };

  const handleBoundaryException = () => {
    setOutsideSheetVisible(false);
    if (pendingSave) pendingSave();
  };

  const handleBoundaryDefer = () => {
    setOutsideSheetVisible(false);
    if (pendingSave) pendingSave();
  };

  const catInfo = DEFAULT_CATEGORIES.find((c) => c.id === selectedCategory);
  const amountNum = parseInt(amount, 10);

  // Step 0: 트리거 선택
  if (step === 0) {
    return (
      <ScreenLayout>
        <TriggerPicker onSelect={handleTriggerSelect} />
      </ScreenLayout>
    );
  }

  // Step 1: 입력 폼
  return (
    <ScreenLayout>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* 트리거 표시 칩 */}
        {triggerType && (
          <TouchableOpacity
            style={styles.triggerChip}
            onPress={() => setStep(0)}
            activeOpacity={0.7}
          >
            <Text style={styles.triggerChipText}>
              {{
                purposeful: '🎯 목적 있는 소비',
                scheduled: '📅 정해진 날',
                planned: '📋 계획한 소비',
                impulse: '⚡ 즉흥 소비',
              }[triggerType]}
            </Text>
            <Text style={styles.triggerChipChange}>바꾸기 ›</Text>
          </TouchableOpacity>
        )}

        {/* 기본/자세히 pill 토글 */}
        <View style={styles.modeSelector}>
          {CHECKIN_MODE_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.mode}
              style={[
                styles.modePill,
                mode === opt.mode && styles.modePillSelected,
              ]}
              onPress={() => handleModeChange(opt.mode)}
              accessibilityRole="button"
              accessibilityState={{ selected: mode === opt.mode }}
            >
              <Text
                style={[
                  styles.modePillLabel,
                  mode === opt.mode && styles.modePillLabelSelected,
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 지난번처럼 */}
        {recentSuggestions.length > 0 && checkIns.length === 0 && (
          <View style={styles.suggestionsContainer}>
            <Text style={styles.suggestionsLabel}>{t('checkin_recent_label')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {recentSuggestions.map((item) => {
                const cat = DEFAULT_CATEGORIES.find((c) => c.id === item.categoryId);
                return (
                  <TouchableOpacity
                    key={item.checkInId}
                    style={styles.suggestionChip}
                    onPress={() => applyRecentSuggestion(item)}
                    accessibilityRole="button"
                  >
                    <Text style={styles.suggestionEmoji}>{cat?.emoji}</Text>
                    <Text style={styles.suggestionCategory}>{cat?.label}</Text>
                    <Text style={styles.suggestionAmount}>
                      {formatCurrency(item.amount)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* 금액 입력 */}
        <TextInput
          style={styles.amountInput}
          placeholder="금액"
          placeholderTextColor={theme.milyColors.brownLight}
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
          autoFocus={recentSuggestions.length === 0}
          accessibilityLabel={t('checkin_amount_placeholder')}
        />

        {/* 카테고리 */}
        <Text style={styles.label}>{t('checkin_category_label')}</Text>
        <View style={styles.categoryGrid}>
          {DEFAULT_CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.categoryChip,
                selectedCategory === cat.id && styles.categoryChipSelected,
              ]}
              onPress={() => {
                setSelectedCategory(cat.id);
                setSelectedSpendType(cat.defaultSpendType);
                setSimilarMessage(null);
              }}
              accessibilityRole="button"
              accessibilityState={{ selected: selectedCategory === cat.id }}
            >
              <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
              <Text
                style={[
                  styles.categoryLabel,
                  selectedCategory === cat.id && styles.categoryLabelSelected,
                ]}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 지출 유형 3칩 고정 */}
        {fields.showSpendType && (
          <>
            <Text style={styles.label}>{t('checkin_spend_type_label')}</Text>
            <View style={styles.spendTypeRow}>
              {SPEND_TYPE_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.type}
                  style={[
                    styles.spendTypeChip,
                    selectedSpendType === opt.type && styles.spendTypeChipSelected,
                  ]}
                  onPress={() =>
                    setSelectedSpendType(selectedSpendType === opt.type ? null : opt.type)
                  }
                  accessibilityRole="button"
                  accessibilityState={{ selected: selectedSpendType === opt.type }}
                >
                  <Text style={styles.spendTypeEmoji}>{opt.emoji}</Text>
                  <Text
                    style={[
                      styles.spendTypeLabel,
                      selectedSpendType === opt.type && styles.spendTypeLabelSelected,
                    ]}
                  >
                    {t(opt.labelKey)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* 감정 태그 — 자세히 모드 OR 즉흥형 */}
        {(fields.showEmotion || triggerType === 'impulse') && (
          <>
            <Text style={styles.label}>
              {triggerType === 'impulse' ? '왜 샀어요?' : t('checkin_emotion_label')}
            </Text>
            <View style={styles.emotionRow}>
              {EMOTION_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.tag}
                  style={[
                    styles.emotionChip,
                    selectedEmotion === opt.tag && styles.emotionChipSelected,
                  ]}
                  onPress={() =>
                    setSelectedEmotion(selectedEmotion === opt.tag ? null : opt.tag)
                  }
                  accessibilityRole="button"
                  accessibilityState={{ selected: selectedEmotion === opt.tag }}
                >
                  <Text style={styles.emotionEmoji}>{opt.emoji}</Text>
                  <Text style={styles.emotionLabel}>{t(opt.labelKey)}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* 메모 — 자세히 모드만 */}
        {fields.showMemo && (
          <TextInput
            style={styles.memoInput}
            placeholder={t('checkin_memo_placeholder')}
            placeholderTextColor={theme.milyColors.brownLight}
            value={memo}
            onChangeText={setMemo}
            multiline
          />
        )}

        {similarMessage && (
          <Card style={styles.boundaryCard}>
            <Text style={styles.boundaryText}>{similarMessage}</Text>
          </Card>
        )}

        <View style={{ height: 16 }} />
      </ScrollView>

      {/* 하단 고정 저장 버튼 */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.saveButton,
            (!amount || amountNum <= 0) && styles.saveButtonDisabled,
          ]}
          onPress={() => handleSave()}
          disabled={!amount || amountNum <= 0}
          activeOpacity={0.85}
        >
          <Text style={styles.saveButtonText}>{t('checkin_save')} ✓</Text>
        </TouchableOpacity>
      </View>

      <BoundarySheet
        visible={outsideSheetVisible}
        categoryLabel={catInfo?.label ?? ''}
        onException={handleBoundaryException}
        onAdjust={() => {
          setOutsideSheetVisible(false);
          router.push('/(adult)/plan');
        }}
        onDefer={handleBoundaryDefer}
        onClose={() => setOutsideSheetVisible(false)}
      />
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    paddingTop: 16,
  },
  triggerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.milyColors.surface2,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  triggerChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.milyColors.brownDark,
    marginRight: 8,
  },
  triggerChipChange: {
    fontSize: 12,
    color: theme.milyColors.brownMid,
  },
  modeSelector: {
    flexDirection: 'row',
    backgroundColor: theme.milyColors.surface2,
    borderRadius: 24,
    padding: 3,
    marginBottom: 24,
    alignSelf: 'flex-start',
  },
  modePill: {
    paddingHorizontal: 18,
    paddingVertical: 7,
    borderRadius: 20,
    minHeight: 36,
    justifyContent: 'center',
  },
  modePillSelected: {
    backgroundColor: theme.colors.surface,
  },
  modePillLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.milyColors.brownMid,
  },
  modePillLabelSelected: {
    color: theme.milyColors.brownDark,
    fontWeight: '700',
  },
  suggestionsContainer: { marginBottom: 20 },
  suggestionsLabel: {
    fontSize: 13,
    color: theme.milyColors.brownMid,
    marginBottom: 10,
  },
  suggestionChip: {
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: theme.borderRadius.card,
    borderWidth: 1,
    borderColor: theme.milyColors.gold,
    backgroundColor: theme.milyColors.goldLight,
    marginRight: 8,
    minHeight: 44,
    minWidth: 72,
  },
  suggestionEmoji: { fontSize: 18 },
  suggestionCategory: {
    fontSize: 12,
    color: theme.milyColors.brownMid,
    marginTop: 2,
  },
  suggestionAmount: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.milyColors.brownDark,
    marginTop: 2,
  },
  amountInput: {
    fontSize: 38,
    fontWeight: '700',
    color: theme.milyColors.brownDark,
    borderBottomWidth: 2,
    borderBottomColor: theme.milyColors.coral,
    paddingVertical: 10,
    marginBottom: 28,
    textAlign: 'center',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.milyColors.brownMid,
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    minHeight: 44,
  },
  categoryChipSelected: {
    borderColor: theme.milyColors.coral,
    backgroundColor: '#FFF0ED',
  },
  categoryEmoji: { fontSize: 16, marginRight: 4 },
  categoryLabel: {
    fontSize: 14,
    color: theme.milyColors.brownDark,
  },
  categoryLabelSelected: {
    color: theme.milyColors.coral,
    fontWeight: '600',
  },
  spendTypeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  spendTypeChip: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: theme.borderRadius.button,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    minHeight: 52,
    gap: 4,
  },
  spendTypeChipSelected: {
    borderColor: theme.milyColors.coral,
    backgroundColor: '#FFF0ED',
  },
  spendTypeEmoji: { fontSize: 18 },
  spendTypeLabel: {
    fontSize: 13,
    color: theme.milyColors.brownMid,
  },
  spendTypeLabelSelected: {
    color: theme.milyColors.coral,
    fontWeight: '700',
  },
  emotionRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  emotionChip: {
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    minHeight: 52,
    minWidth: 60,
  },
  emotionChipSelected: {
    borderColor: theme.milyColors.gold,
    backgroundColor: theme.milyColors.goldLight,
  },
  emotionEmoji: { fontSize: 20 },
  emotionLabel: {
    fontSize: 11,
    color: theme.milyColors.brownMid,
    marginTop: 3,
  },
  memoInput: {
    height: 80,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.input,
    padding: 12,
    fontSize: 14,
    color: theme.milyColors.brownDark,
    backgroundColor: theme.colors.surface,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  boundaryCard: {
    backgroundColor: '#FEF9F0',
    borderColor: theme.colors.warning,
    borderWidth: 1,
    marginBottom: 16,
  },
  boundaryText: {
    fontSize: 14,
    color: theme.milyColors.brownDark,
  },
  footer: {
    paddingHorizontal: 0,
    paddingVertical: 12,
  },
  saveButton: {
    height: 52,
    borderRadius: theme.borderRadius.button,
    backgroundColor: theme.milyColors.coral,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonDisabled: { opacity: 0.4 },
  saveButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
