// CounterProposalScreen.tsx — 조건 제안 (합의 루프 3단계)
// 조건 선택 → 양쪽 동의 시 완료
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, TextInput,
} from 'react-native';
import { theme } from '../../ui/theme';
import { MilyButton } from '../../components/ui/MilyButton';
import { MilyCard } from '../../components/ui/MilyCard';

interface CounterProposalScreenProps {
  originalAmount?: number;
  onSubmit: (condition: string, adjustedAmount?: number) => void;
  onBack: () => void;
}

const PRESET_CONDITIONS = [
  { key: 'monthly_once', label: '매달 1번만', emoji: '📅' },
  { key: 'promise_first', label: '약속 먼저', emoji: '🤝' },
  { key: 'half_amount', label: '절반만', emoji: '✂️' },
  { key: 'save_rest', label: '나머지는 저금', emoji: '🐷' },
];

export function CounterProposalScreen({ originalAmount, onSubmit, onBack }: CounterProposalScreenProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [customCondition, setCustomCondition] = useState('');
  const [adjustedAmount, setAdjustedAmount] = useState(originalAmount ? String(Math.floor(originalAmount / 2)) : '');

  const activeCondition = selected === 'custom' ? customCondition : (PRESET_CONDITIONS.find(c => c.key === selected)?.label ?? '');
  const canSubmit = activeCondition.trim().length > 0;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>‹ 뒤로</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>조건 제안</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>어떤 조건을 제안하실 건가요?</Text>

        {/* 미리 설정 조건 */}
        <View style={styles.presetGrid}>
          {PRESET_CONDITIONS.map((c) => (
            <TouchableOpacity
              key={c.key}
              style={[styles.presetCard, selected === c.key && styles.presetCardSelected]}
              onPress={() => setSelected(c.key)}
            >
              <Text style={styles.presetEmoji}>{c.emoji}</Text>
              <Text style={[styles.presetLabel, selected === c.key && styles.presetLabelSelected]}>{c.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 직접 입력 */}
        <TouchableOpacity
          style={[styles.customToggle, selected === 'custom' && styles.customToggleSelected]}
          onPress={() => setSelected('custom')}
        >
          <Text style={styles.customToggleText}>✏️ 직접 입력</Text>
        </TouchableOpacity>
        {selected === 'custom' && (
          <TextInput
            style={styles.customInput}
            value={customCondition}
            onChangeText={setCustomCondition}
            placeholder="조건을 입력해요"
            placeholderTextColor={theme.milyColors.brownLight}
          />
        )}

        {/* 금액 조정 */}
        {originalAmount != null && (
          <MilyCard>
            <Text style={styles.adjustLabel}>금액 조정 <Text style={styles.optional}>(선택)</Text></Text>
            <View style={styles.adjustRow}>
              <TextInput
                style={styles.adjustInput}
                value={adjustedAmount}
                onChangeText={(t) => setAdjustedAmount(t.replace(/[^0-9]/g, ''))}
                keyboardType="numeric"
                placeholder={String(originalAmount)}
                placeholderTextColor={theme.milyColors.brownLight}
              />
              <Text style={styles.adjustUnit}>원</Text>
            </View>
            <Text style={styles.adjustNote}>원래 요청: {originalAmount.toLocaleString()}원</Text>
          </MilyCard>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <MilyButton
          label="제안하기"
          onPress={() => onSubmit(activeCondition, adjustedAmount ? parseInt(adjustedAmount, 10) : undefined)}
          disabled={!canSubmit}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.milyColors.cream },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { padding: 4 },
  backText: { fontSize: 16, color: theme.milyColors.coral },
  headerTitle: { fontSize: 17, fontWeight: '600', color: theme.milyColors.brownDark },
  content: { padding: 16, gap: 12 },
  subtitle: { fontSize: 15, color: theme.milyColors.brownMid, marginBottom: 8 },
  presetGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  presetCard: { width: '47%', backgroundColor: '#fff', borderRadius: theme.borderRadius.card, padding: 14, alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
  presetCardSelected: { borderColor: theme.milyColors.coral },
  presetEmoji: { fontSize: 24, marginBottom: 6 },
  presetLabel: { fontSize: 14, fontWeight: '500', color: theme.milyColors.brownDark },
  presetLabelSelected: { color: theme.milyColors.coral },
  customToggle: { backgroundColor: '#fff', borderRadius: theme.borderRadius.card, padding: 14, borderWidth: 2, borderColor: 'transparent' },
  customToggleSelected: { borderColor: theme.milyColors.coral },
  customToggleText: { fontSize: 14, color: theme.milyColors.brownDark },
  customInput: { backgroundColor: '#fff', borderRadius: theme.borderRadius.input, padding: 12, fontSize: 14, color: theme.milyColors.brownDark },
  adjustLabel: { fontSize: 14, fontWeight: '600', color: theme.milyColors.brownDark, marginBottom: 10 },
  optional: { fontWeight: '400', color: theme.milyColors.brownLight },
  adjustRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  adjustInput: { flex: 1, fontSize: 20, fontWeight: '600', color: theme.milyColors.brownDark },
  adjustUnit: { fontSize: 16, color: theme.milyColors.brownMid, marginLeft: 6 },
  adjustNote: { fontSize: 12, color: theme.milyColors.brownLight },
  footer: { padding: 16 },
});
