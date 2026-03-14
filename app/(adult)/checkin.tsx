import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScreenLayout } from '../../src/ui/layouts/ScreenLayout';
import { Button } from '../../src/ui/components/Button';
import { Card } from '../../src/ui/components/Card';
import { BoundarySheet } from '../../src/ui/components/BoundarySheet';
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

const SPEND_TYPE_OPTIONS: { type: SpendType; labelKey: string }[] = [
  { type: 'fixed', labelKey: 'checkin_spend_type_fixed' },
  { type: 'living', labelKey: 'checkin_spend_type_living' },
  { type: 'choice', labelKey: 'checkin_spend_type_choice' },
];

const EMOTION_OPTIONS: { tag: EmotionTag; emoji: string; labelKey: string }[] =
  [
    { tag: 'impulse', emoji: '⚡', labelKey: 'emotion_impulse' },
    { tag: 'stress', emoji: '😮‍💨', labelKey: 'emotion_stress' },
    { tag: 'social', emoji: '👫', labelKey: 'emotion_social' },
    { tag: 'reward', emoji: '🎁', labelKey: 'emotion_reward' },
  ];

export default function CheckInScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const plan = usePlanStore((s) => s.currentPlan);
  const checkIns = useCheckInStore((s) => s.weeklyCheckIns);

  const [amount, setAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>('food');
  const [selectedSpendType, setSelectedSpendType] = useState<SpendType | null>(null);
  const [selectedEmotion, setSelectedEmotion] = useState<EmotionTag | null>(null);
  const [memo, setMemo] = useState('');
  const [similarMessage, setSimilarMessage] = useState<string | null>(null);
  const [outsideSheetVisible, setOutsideSheetVisible] = useState(false);
  const [pendingSave, setPendingSave] = useState<(() => void) | null>(null);
  const [recentSuggestions, setRecentSuggestions] = useState<CheckIn[]>([]);

  // 이번 주 기록이 없을 때 지난주 기록 로드
  useEffect(() => {
    if (!user || checkIns.length > 0) return;
    loadRecentSuggestions(user.uid).then(setRecentSuggestions);
  }, [user, checkIns.length]);

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
  };

  const doSave = async (amountNum: number) => {
    if (!user) return;
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

  return (
    <ScreenLayout>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{t('checkin_title')}</Text>

        {/* 지난번처럼 — 이번 주 기록이 없을 때만 표시 */}
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
                    accessibilityLabel={t('checkin_recent_apply', {
                      category: cat?.label,
                      amount: item.amount,
                    })}
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

        <TextInput
          style={styles.amountInput}
          placeholder={t('checkin_amount_placeholder')}
          placeholderTextColor={theme.colors.textSecondary}
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
          autoFocus={recentSuggestions.length === 0}
          accessibilityLabel={t('checkin_amount_placeholder')}
        />

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
              accessibilityLabel={cat.label}
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
              accessibilityLabel={t(opt.labelKey)}
              accessibilityRole="button"
              accessibilityState={{ selected: selectedSpendType === opt.type }}
            >
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

        <Text style={styles.label}>{t('checkin_emotion_label')}</Text>
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
              accessibilityLabel={t(opt.labelKey)}
              accessibilityRole="button"
              accessibilityState={{ selected: selectedEmotion === opt.tag }}
            >
              <Text style={styles.emotionEmoji}>{opt.emoji}</Text>
              <Text style={styles.emotionLabel}>{t(opt.labelKey)}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TextInput
          style={styles.memoInput}
          placeholder={t('checkin_memo_placeholder')}
          placeholderTextColor={theme.colors.textSecondary}
          value={memo}
          onChangeText={setMemo}
          multiline
          accessibilityLabel={t('checkin_memo_placeholder')}
        />

        {similarMessage && (
          <Card style={styles.boundaryCard}>
            <Text style={styles.boundaryText}>{similarMessage}</Text>
          </Card>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title={t('checkin_save')}
          onPress={() => handleSave()}
          disabled={!amount || parseInt(amount, 10) <= 0}
          accessibilityLabel={t('checkin_save')}
        />
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
    paddingTop: theme.spacing[6],
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing[5],
  },
  suggestionsContainer: {
    marginBottom: theme.spacing[5],
  },
  suggestionsLabel: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing[2],
  },
  suggestionChip: {
    alignItems: 'center',
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[3],
    borderRadius: theme.borderRadius.card,
    borderWidth: 1,
    borderColor: theme.colors.secondary,
    backgroundColor: '#F0F9F7',
    marginRight: theme.spacing[2],
    minHeight: 44,
    minWidth: 72,
  },
  suggestionEmoji: {
    fontSize: 18,
  },
  suggestionCategory: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  suggestionAmount: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginTop: 2,
  },
  amountInput: {
    fontSize: 32,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.primary,
    paddingVertical: theme.spacing[3],
    marginBottom: theme.spacing[6],
    textAlign: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing[3],
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing[2],
    marginBottom: theme.spacing[5],
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[2],
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    minHeight: 44,
  },
  categoryChipSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: '#EDF2F9',
  },
  categoryEmoji: {
    fontSize: 16,
    marginRight: theme.spacing[1],
  },
  categoryLabel: {
    fontSize: 14,
    color: theme.colors.textPrimary,
  },
  categoryLabelSelected: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  spendTypeRow: {
    flexDirection: 'row',
    gap: theme.spacing[2],
    marginBottom: theme.spacing[5],
  },
  spendTypeChip: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing[3],
    borderRadius: theme.borderRadius.button,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    minHeight: 44,
  },
  spendTypeChipSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: '#EDF2F9',
  },
  spendTypeLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  spendTypeLabelSelected: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  emotionRow: {
    flexDirection: 'row',
    gap: theme.spacing[2],
    marginBottom: theme.spacing[5],
  },
  emotionChip: {
    alignItems: 'center',
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[2],
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    minHeight: 44,
    minWidth: 44,
  },
  emotionChipSelected: {
    borderColor: theme.colors.accent,
    backgroundColor: '#FEF3E5',
  },
  emotionEmoji: {
    fontSize: 20,
  },
  emotionLabel: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  memoInput: {
    height: 80,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.input,
    padding: theme.spacing[3],
    fontSize: 14,
    color: theme.colors.textPrimary,
    backgroundColor: theme.colors.surface,
    textAlignVertical: 'top',
    marginBottom: theme.spacing[4],
  },
  boundaryCard: {
    backgroundColor: '#FEF9F0',
    borderColor: theme.colors.warning,
    borderWidth: 1,
  },
  boundaryText: {
    fontSize: 14,
    color: theme.colors.textPrimary,
  },
  footer: {
    paddingVertical: theme.spacing[4],
  },
});
