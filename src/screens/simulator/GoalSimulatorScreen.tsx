// GoalSimulatorScreen.tsx — 목표 시뮬레이터 (3단계 스텝)
// 합의 루프 연결
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, SafeAreaView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { theme } from '../../ui/theme';
import { MilyButton } from '../../components/ui/MilyButton';
import { MilyCard } from '../../components/ui/MilyCard';
import { DarkCard } from '../../components/ui/DarkCard';
import { StepIndicator } from '../../components/ui/StepIndicator';

interface SimulationResult {
  months: number;
  totalSaved: number;
  monthlyRequired: number;
}

interface GoalSimulatorScreenProps {
  onSendRequest?: (goalTitle: string, amount: number) => void;
  onClose: () => void;
}

function simulate(goalAmount: number, monthly: number): SimulationResult {
  if (monthly <= 0) return { months: 0, totalSaved: 0, monthlyRequired: goalAmount };
  const months = Math.ceil(goalAmount / monthly);
  return { months, totalSaved: months * monthly, monthlyRequired: monthly };
}

export function GoalSimulatorScreen({ onSendRequest, onClose }: GoalSimulatorScreenProps) {
  const [step, setStep] = useState(0);
  const [goalTitle, setGoalTitle] = useState('');
  const [goalAmount, setGoalAmount] = useState('');
  const [monthly, setMonthly] = useState('');

  const amount = parseInt(goalAmount.replace(/[^0-9]/g, ''), 10) || 0;
  const monthlyAmt = parseInt(monthly.replace(/[^0-9]/g, ''), 10) || 0;
  const result = amount > 0 && monthlyAmt > 0 ? simulate(amount, monthlyAmt) : null;

  const STEPS = ['목표', '저축', '결과'];

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}><Text style={styles.closeText}>✕</Text></TouchableOpacity>
          <Text style={styles.headerTitle}>목표 시뮬레이터</Text>
          <View style={{ width: 36 }} />
        </View>

        <StepIndicator totalSteps={3} currentStep={step} />

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {step === 0 && (
            <>
              <Text style={styles.stepTitle}>어떤 목표인가요?</Text>
              <TextInput
                style={styles.textInput}
                value={goalTitle}
                onChangeText={setGoalTitle}
                placeholder="예) 새 자전거, 캠프 참가비"
                placeholderTextColor={theme.milyColors.brownLight}
              />
              <Text style={[styles.stepTitle, { marginTop: 20 }]}>목표 금액</Text>
              <View style={styles.amountRow}>
                <TextInput
                  style={styles.amountInput}
                  value={goalAmount}
                  onChangeText={(t) => setGoalAmount(t.replace(/[^0-9]/g, ''))}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={theme.milyColors.brownLight}
                />
                <Text style={styles.amountUnit}>원</Text>
              </View>
            </>
          )}

          {step === 1 && (
            <>
              <Text style={styles.stepTitle}>매달 얼마씩 모을 수 있나요?</Text>
              <View style={styles.amountRow}>
                <TextInput
                  style={styles.amountInput}
                  value={monthly}
                  onChangeText={(t) => setMonthly(t.replace(/[^0-9]/g, ''))}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={theme.milyColors.brownLight}
                  autoFocus
                />
                <Text style={styles.amountUnit}>원</Text>
              </View>
              <MilyCard>
                <Text style={styles.goalSummary}>{goalTitle}</Text>
                <Text style={styles.goalAmount}>{amount.toLocaleString()}원</Text>
              </MilyCard>
            </>
          )}

          {step === 2 && result && (
            <>
              <DarkCard>
                <Text style={styles.darkLabel}>{goalTitle}</Text>
                <Text style={styles.darkMonths}>{result.months}개월</Text>
                <Text style={styles.darkSub}>매달 {monthlyAmt.toLocaleString()}원씩 모으면</Text>
              </DarkCard>
              <MilyCard>
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>목표 금액</Text>
                  <Text style={styles.resultValue}>{amount.toLocaleString()}원</Text>
                </View>
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>총 예상 저축</Text>
                  <Text style={styles.resultValue}>{result.totalSaved.toLocaleString()}원</Text>
                </View>
              </MilyCard>
              {onSendRequest && (
                <MilyButton
                  label="부모님께 요청 카드 보내기"
                  variant="secondary"
                  onPress={() => onSendRequest(goalTitle, amount)}
                  style={{ marginTop: 8 }}
                />
              )}
            </>
          )}
        </ScrollView>

        <View style={styles.footer}>
          {step < 2 ? (
            <MilyButton
              label="다음"
              onPress={() => setStep(step + 1)}
              disabled={step === 0 ? (!goalTitle || !amount) : !monthlyAmt}
            />
          ) : (
            <MilyButton label="완료" onPress={onClose} />
          )}
          {step > 0 && (
            <TouchableOpacity style={styles.backBtn} onPress={() => setStep(step - 1)}>
              <Text style={styles.backText}>이전</Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.milyColors.cream },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  closeText: { fontSize: 18, color: theme.milyColors.brownMid, padding: 8 },
  headerTitle: { fontSize: 17, fontWeight: '600', color: theme.milyColors.brownDark },
  content: { padding: 16, paddingTop: 24 },
  stepTitle: { fontSize: 16, fontWeight: '600', color: theme.milyColors.brownDark, marginBottom: 12 },
  textInput: { backgroundColor: '#fff', borderRadius: theme.borderRadius.input, padding: 14, fontSize: 16, color: theme.milyColors.brownDark, marginBottom: 8 },
  amountRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: theme.borderRadius.card, padding: 16, marginBottom: 12 },
  amountInput: { flex: 1, fontSize: 28, fontWeight: '700', color: theme.milyColors.brownDark },
  amountUnit: { fontSize: 18, color: theme.milyColors.brownMid, marginLeft: 6 },
  goalSummary: { fontSize: 14, color: theme.milyColors.brownMid, marginBottom: 4 },
  goalAmount: { fontSize: 22, fontWeight: '700', color: theme.milyColors.coral },
  darkLabel: { fontSize: 13, color: theme.milyColors.brownLight, marginBottom: 8 },
  darkMonths: { fontSize: 40, fontWeight: '700', color: '#fff', marginBottom: 6 },
  darkSub: { fontSize: 13, color: theme.milyColors.brownLight },
  resultRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: theme.milyColors.surface2 },
  resultLabel: { fontSize: 14, color: theme.milyColors.brownMid },
  resultValue: { fontSize: 16, fontWeight: '600', color: theme.milyColors.brownDark },
  footer: { padding: 16, gap: 6 },
  backBtn: { alignItems: 'center', paddingVertical: 8 },
  backText: { fontSize: 14, color: theme.milyColors.brownMid },
});
