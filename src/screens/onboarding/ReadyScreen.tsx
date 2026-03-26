// ReadyScreen.tsx — 온보딩 완료 + 시작 버튼
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { theme } from '../../ui/theme';
import { MilyButton } from '../../components/ui/MilyButton';

interface ReadyScreenProps {
  role: 'solo' | 'family';
  budget: number;
  onStart: () => void;
}

export function ReadyScreen({ role, budget, onStart }: ReadyScreenProps) {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.icon}>🎉</Text>
        <Text style={styles.title}>준비됐어요!</Text>
        <Text style={styles.desc}>이제 Mily와 함께 경제 대화를 시작해봐요.</Text>

        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>사용 방식</Text>
            <Text style={styles.summaryValue}>{role === 'family' ? '가족과 함께' : '혼자'}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>이번 달 예산</Text>
            <Text style={styles.summaryValueBold}>{budget.toLocaleString()}원</Text>
          </View>
        </View>

        <Text style={styles.hint}>매주 5분, 소비를 돌아보는 습관을 만들어봐요.</Text>
      </ScrollView>
      <View style={styles.footer}>
        <MilyButton label="시작하기" onPress={onStart} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.milyColors.cream },
  content: { padding: 24, paddingTop: 60, alignItems: 'center' },
  icon: { fontSize: 72, marginBottom: 16 },
  title: { fontSize: 28, fontWeight: '700', color: theme.milyColors.brownDark, marginBottom: 8 },
  desc: { fontSize: 15, color: theme.milyColors.brownMid, textAlign: 'center', marginBottom: 32 },
  summaryCard: { width: '100%', backgroundColor: '#fff', borderRadius: theme.borderRadius.card, padding: 20, marginBottom: 24 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  summaryLabel: { fontSize: 14, color: theme.milyColors.brownMid },
  summaryValue: { fontSize: 15, color: theme.milyColors.brownDark, fontWeight: '500' },
  summaryValueBold: { fontSize: 18, color: theme.milyColors.coral, fontWeight: '700' },
  divider: { height: 1, backgroundColor: theme.milyColors.surface2 },
  hint: { fontSize: 14, color: theme.milyColors.brownMid, textAlign: 'center' },
  footer: { padding: 24 },
});
