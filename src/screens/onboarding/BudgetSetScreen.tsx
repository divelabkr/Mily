// BudgetSetScreen.tsx — 예산 설정 (금액 입력 + 카테고리 슬라이더)
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { theme } from '../../ui/theme';
import { MilyButton } from '../../components/ui/MilyButton';

const QUICK_AMOUNTS = [200000, 300000, 500000, 700000, 1000000];

interface BudgetSetScreenProps {
  onNext: (budget: number) => void;
}

export function BudgetSetScreen({ onNext }: BudgetSetScreenProps) {
  const [amount, setAmount] = useState('');

  const handleQuick = (v: number) => setAmount(String(v));
  const budget = parseInt(amount.replace(/,/g, ''), 10) || 0;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>이번 달 예산이 얼마인가요?</Text>
          <Text style={styles.subtitle}>선택 소비 기준으로 입력해요 (고정비 제외)</Text>

          <View style={styles.inputBox}>
            <TextInput
              style={styles.input}
              value={amount}
              onChangeText={(t) => setAmount(t.replace(/[^0-9]/g, ''))}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={theme.milyColors.brownLight}
            />
            <Text style={styles.unit}>원</Text>
          </View>

          <View style={styles.chips}>
            {QUICK_AMOUNTS.map((v) => (
              <TouchableOpacity
                key={v}
                style={[styles.chip, amount === String(v) && styles.chipActive]}
                onPress={() => handleQuick(v)}
              >
                <Text style={[styles.chipText, amount === String(v) && styles.chipTextActive]}>
                  {(v / 10000).toFixed(0)}만원
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {budget > 0 && (
            <View style={styles.preview}>
              <Text style={styles.previewLabel}>선택한 예산</Text>
              <Text style={styles.previewAmount}>{budget.toLocaleString()}원</Text>
            </View>
          )}
        </ScrollView>
        <View style={styles.footer}>
          <MilyButton label="다음" onPress={() => budget > 0 && onNext(budget)} disabled={budget <= 0} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.milyColors.cream },
  content: { padding: 24, paddingTop: 48 },
  title: { fontSize: 22, fontWeight: '700', color: theme.milyColors.brownDark, marginBottom: 8 },
  subtitle: { fontSize: 14, color: theme.milyColors.brownMid, marginBottom: 32 },
  inputBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: theme.borderRadius.card, padding: 16, marginBottom: 16 },
  input: { flex: 1, fontSize: 28, fontWeight: '700', color: theme.milyColors.brownDark },
  unit: { fontSize: 18, color: theme.milyColors.brownMid, marginLeft: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  chip: { backgroundColor: theme.milyColors.surface2, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  chipActive: { backgroundColor: theme.milyColors.coral },
  chipText: { fontSize: 14, color: theme.milyColors.brownMid, fontWeight: '500' },
  chipTextActive: { color: '#fff' },
  preview: { backgroundColor: theme.milyColors.surface2, borderRadius: theme.borderRadius.card, padding: 16, alignItems: 'center' },
  previewLabel: { fontSize: 13, color: theme.milyColors.brownMid, marginBottom: 4 },
  previewAmount: { fontSize: 28, fontWeight: '700', color: theme.milyColors.coral },
  footer: { padding: 24 },
});
