// DreamStudioScreen.tsx — 밀리의 꿈 설계소
// 탭: 롤모델 | 꿈 계산기
// 밴드별 필터 + 시나리오 충격 숫자
import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, SafeAreaView,
} from 'react-native';
import { theme } from '../../ui/theme';
import { MilyCard } from '../../components/ui/MilyCard';
import { DarkCard } from '../../components/ui/DarkCard';
import {
  getRoleModels, RoleModel,
} from '../../engines/millionaire/roleModelService';
import {
  getDreamScenarios, calculateTimeToAchieve, DreamScenario,
} from '../../engines/millionaire/dreamScenarioService';
import type { AgeBand } from '../../engines/message/milyPersona';

type TabKey = 'rolemodel' | 'dream';

interface DreamStudioScreenProps {
  ageBand: AgeBand;
  audience?: 'parent' | 'child' | 'both';
}

function RoleModelCard({ model }: { model: RoleModel }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <TouchableOpacity
      style={styles.modelCard}
      onPress={() => setExpanded(!expanded)}
      activeOpacity={0.8}
    >
      <View style={styles.modelHeader}>
        <Text style={styles.modelName}>{model.name}</Text>
        <Text style={styles.modelArrow}>{expanded ? '▲' : '▼'}</Text>
      </View>
      <Text style={styles.modelOneLiner}>{model.oneLiner}</Text>
      {expanded && (
        <View style={styles.modelDetail}>
          {model.keyHabits.map((h, i) => (
            <Text key={i} style={styles.modelHabit}>• {h}</Text>
          ))}
        </View>
      )}
    </TouchableOpacity>
  );
}

function DreamCard({ scenario, monthlySaving }: { scenario: DreamScenario; monthlySaving: number }) {
  const months = calculateTimeToAchieve(scenario.realWorldPrice, monthlySaving, 0.02);
  const timeText = months == null ? '저축액을 입력해요' :
    months >= 24 ? `약 ${Math.floor(months / 12)}년 ${months % 12}개월` :
    `약 ${months}개월`;

  return (
    <MilyCard>
      <Text style={styles.dreamEmoji}>{scenario.emoji}</Text>
      <Text style={styles.dreamTitle}>{scenario.title}</Text>
      <Text style={styles.dreamPrice}>{scenario.realWorldPrice.toLocaleString()}원</Text>
      <Text style={styles.dreamTime}>{timeText}</Text>
    </MilyCard>
  );
}

export function DreamStudioScreen({ ageBand, audience = 'both' }: DreamStudioScreenProps) {
  const [tab, setTab] = useState<TabKey>('rolemodel');
  const [monthlySaving, setMonthlySaving] = useState('10000');

  const roleModels = useMemo(() => getRoleModels(ageBand, audience), [ageBand, audience]);
  const dreamScenarios = useMemo(() => getDreamScenarios(ageBand), [ageBand]);
  const savingAmount = parseInt(monthlySaving, 10) || 0;

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.screenTitle}>꿈 설계소</Text>

      <View style={styles.tabRow}>
        {(['rolemodel', 'dream'] as TabKey[]).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, tab === t && styles.tabActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'rolemodel' ? '롤모델' : '꿈 계산기'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {tab === 'rolemodel' && (
          roleModels.length === 0
            ? <Text style={styles.emptyText}>이 연령대에 맞는 롤모델이 준비 중이에요.</Text>
            : roleModels.map((m) => <RoleModelCard key={m.id} model={m} />)
        )}
        {tab === 'dream' && (
          <>
            <DarkCard>
              <Text style={styles.darkInputLabel}>월 저축액을 입력해요</Text>
              <View style={styles.darkInputRow}>
                <TextInput
                  style={styles.darkInput}
                  value={monthlySaving}
                  onChangeText={(t) => setMonthlySaving(t.replace(/[^0-9]/g, ''))}
                  keyboardType="numeric"
                  placeholder="10000"
                  placeholderTextColor={theme.milyColors.brownLight}
                />
                <Text style={styles.darkInputUnit}>원</Text>
              </View>
            </DarkCard>
            {dreamScenarios.map((s) => (
              <DreamCard key={s.id} scenario={s} monthlySaving={savingAmount} />
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.milyColors.cream },
  screenTitle: { fontSize: 22, fontWeight: '700', color: theme.milyColors.brownDark, paddingHorizontal: 16, paddingTop: 16, marginBottom: 12 },
  tabRow: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 8, borderBottomWidth: 1, borderBottomColor: theme.milyColors.surface2 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent', marginBottom: -1 },
  tabActive: { borderBottomColor: theme.milyColors.coral },
  tabText: { fontSize: 15, color: theme.milyColors.brownMid },
  tabTextActive: { color: theme.milyColors.coral, fontWeight: '600' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 10 },
  emptyText: { fontSize: 14, color: theme.milyColors.brownMid, textAlign: 'center', paddingVertical: 32 },
  modelCard: { backgroundColor: '#fff', borderRadius: theme.borderRadius.card, padding: 14, marginBottom: 2 },
  modelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  modelName: { fontSize: 16, fontWeight: '600', color: theme.milyColors.brownDark },
  modelArrow: { fontSize: 12, color: theme.milyColors.brownMid },
  modelOneLiner: { fontSize: 13, color: theme.milyColors.brownMid },
  modelDetail: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: theme.milyColors.surface2, gap: 4 },
  modelHabit: { fontSize: 13, color: theme.milyColors.brownMid },
  darkInputLabel: { fontSize: 13, color: theme.milyColors.brownLight, marginBottom: 8 },
  darkInputRow: { flexDirection: 'row', alignItems: 'center' },
  darkInput: { flex: 1, fontSize: 28, fontWeight: '700', color: '#fff' },
  darkInputUnit: { fontSize: 18, color: theme.milyColors.brownLight, marginLeft: 6 },
  dreamEmoji: { fontSize: 32, marginBottom: 6 },
  dreamTitle: { fontSize: 15, fontWeight: '600', color: theme.milyColors.brownDark, marginBottom: 2 },
  dreamPrice: { fontSize: 13, color: theme.milyColors.brownMid, marginBottom: 6 },
  dreamTime: { fontSize: 18, fontWeight: '700', color: theme.milyColors.coral },
});
