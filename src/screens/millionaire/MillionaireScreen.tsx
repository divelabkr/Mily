// ──────────────────────────────────────────────
// MillionaireScreen.tsx — 밀리의 꿈 설계소
// 상단 탭: 롤모델 | 꿈 계산기
// Feature Flag: MILLIONAIRE_ENABLED
// ──────────────────────────────────────────────

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { ScreenLayout } from '../../ui/layouts/ScreenLayout';
import { theme } from '../../ui/theme';
import { filterDna } from '../../engines/message/dnaFilter';
import {
  RoleModel,
  getRoleModels,
  getRoleModelById,
} from '../../engines/millionaire/roleModelService';
import {
  DreamScenario,
  getDreamScenarios,
  calculateTimeToAchieve,
} from '../../engines/millionaire/dreamScenarioService';
import type { AgeBand } from '../../engines/message/milyPersona';

// ── 타입 ──────────────────────────────────────

type TabKey = 'rolemodel' | 'dream';

export interface DreamStudioScreenProps {
  ageBand: AgeBand;
  audience?: 'parent' | 'child' | 'both';
}

// ── 롤모델 카드 ─────────────────────────────

function RoleModelCard({ model }: { model: RoleModel }) {
  const [expanded, setExpanded] = useState(false);
  const safeOneLiner = filterDna(model.oneLiner).passed
    ? model.oneLiner
    : '영감을 주는 이야기를 만나봐요.';

  return (
    <TouchableOpacity
      style={styles.modelCard}
      onPress={() => setExpanded(!expanded)}
      activeOpacity={0.7}
    >
      <Text style={styles.modelName}>{model.name}</Text>
      <Text style={styles.modelOneLiner}>{safeOneLiner}</Text>
      {expanded && (
        <View style={styles.modelDetail}>
          <Text style={styles.modelSubtitle}>핵심 습관</Text>
          {model.keyHabits.map((h, i) => (
            <Text key={i} style={styles.modelHabit}>
              • {h}
            </Text>
          ))}
          {model.timeline.length > 0 && (
            <>
              <Text style={[styles.modelSubtitle, { marginTop: 12 }]}>타임라인</Text>
              {model.timeline.slice(0, 3).map((t, i) => (
                <Text key={i} style={styles.modelTimeline}>
                  {t.age}세: {t.event}
                </Text>
              ))}
            </>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

// ── 꿈 시나리오 카드 ─────────────────────────

function DreamCard({
  scenario,
  monthlySaving,
}: {
  scenario: DreamScenario;
  monthlySaving: number;
}) {
  const months = calculateTimeToAchieve(scenario, monthlySaving);
  const years = Math.floor(months / 12);
  const remainMonths = Math.round(months % 12);

  const timeText =
    months === Infinity
      ? '저축을 시작하면 계산할 수 있어요!'
      : months === 0
      ? '이미 달성 가능!'
      : years > 0
      ? `약 ${years}년 ${remainMonths}개월`
      : `약 ${remainMonths}개월`;

  const safeFunFact = filterDna(scenario.funFact).passed
    ? scenario.funFact
    : '재미있는 사실을 확인해봐요!';

  return (
    <View style={styles.dreamCard}>
      <Text style={styles.dreamEmoji}>{scenario.emoji}</Text>
      <Text style={styles.dreamTitle}>{scenario.title}</Text>
      <Text style={styles.dreamPrice}>
        {scenario.realWorldPrice.toLocaleString()}원
      </Text>
      <Text style={styles.dreamTime}>{timeText}</Text>
      <Text style={styles.dreamFunFact}>{safeFunFact}</Text>
    </View>
  );
}

// ── 메인 화면 ────────────────────────────────

export function DreamStudioScreen({ ageBand, audience = 'both' }: DreamStudioScreenProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('rolemodel');
  const [monthlySaving, setMonthlySaving] = useState('10000');

  const roleModels = useMemo(
    () => getRoleModels(ageBand, audience),
    [ageBand, audience]
  );

  const dreamScenarios = useMemo(
    () => getDreamScenarios(ageBand),
    [ageBand]
  );

  const savingAmount = parseInt(monthlySaving, 10) || 0;

  return (
    <ScreenLayout>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.screenTitle}>밀리의 꿈 설계소</Text>

        {/* 탭 */}
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'rolemodel' && styles.tabActive]}
            onPress={() => setActiveTab('rolemodel')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'rolemodel' && styles.tabTextActive,
              ]}
            >
              롤모델
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'dream' && styles.tabActive]}
            onPress={() => setActiveTab('dream')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'dream' && styles.tabTextActive,
              ]}
            >
              꿈 계산기
            </Text>
          </TouchableOpacity>
        </View>

        {/* 롤모델 탭 */}
        {activeTab === 'rolemodel' && (
          <>
            {roleModels.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  이 밴드에 맞는 롤모델이 준비 중이에요.
                </Text>
              </View>
            ) : (
              roleModels.map((m) => <RoleModelCard key={m.id} model={m} />)
            )}
          </>
        )}

        {/* 꿈 계산기 탭 */}
        {activeTab === 'dream' && (
          <>
            <View style={styles.inputRow}>
              <Text style={styles.inputLabel}>월 저축액</Text>
              <TextInput
                style={styles.input}
                value={monthlySaving}
                onChangeText={setMonthlySaving}
                keyboardType="numeric"
                placeholder="10000"
              />
              <Text style={styles.inputUnit}>원</Text>
            </View>
            {dreamScenarios.map((s) => (
              <DreamCard
                key={s.id}
                scenario={s}
                monthlySaving={savingAmount}
              />
            ))}
          </>
        )}
      </ScrollView>
    </ScreenLayout>
  );
}

// ── 스타일 ─────────────────────────────────

const styles = StyleSheet.create({
  screenTitle: { fontSize: 22, fontWeight: '700', color: theme.colors.textPrimary, marginTop: 16, marginBottom: 12 },

  // Tabs
  tabRow: { flexDirection: 'row', marginBottom: 16, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: theme.colors.primary },
  tabText: { fontSize: 15, color: theme.colors.textSecondary },
  tabTextActive: { color: theme.colors.primary, fontWeight: '600' },

  // Empty
  emptyContainer: { alignItems: 'center', paddingVertical: 32 },
  emptyText: { fontSize: 14, color: theme.colors.textSecondary },

  // Role model card
  modelCard: { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.card, padding: 16, marginBottom: 12 },
  modelName: { fontSize: 17, fontWeight: '700', color: theme.colors.textPrimary, marginBottom: 4 },
  modelOneLiner: { fontSize: 14, color: theme.colors.textSecondary },
  modelDetail: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: theme.colors.border },
  modelSubtitle: { fontSize: 13, fontWeight: '600', color: theme.colors.textPrimary, marginBottom: 4 },
  modelHabit: { fontSize: 13, color: theme.colors.textSecondary, paddingLeft: 8, paddingVertical: 2 },
  modelTimeline: { fontSize: 13, color: theme.colors.textSecondary, paddingLeft: 8, paddingVertical: 2 },

  // Dream card
  dreamCard: { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.card, padding: 16, marginBottom: 12, alignItems: 'center' },
  dreamEmoji: { fontSize: 40 },
  dreamTitle: { fontSize: 16, fontWeight: '600', color: theme.colors.textPrimary, marginTop: 4 },
  dreamPrice: { fontSize: 14, color: theme.colors.textSecondary, marginTop: 2 },
  dreamTime: { fontSize: 18, fontWeight: '700', color: theme.colors.primary, marginTop: 8 },
  dreamFunFact: { fontSize: 13, color: theme.colors.textSecondary, marginTop: 8, textAlign: 'center' },

  // Input
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.card, padding: 12, marginBottom: 16 },
  inputLabel: { fontSize: 14, color: theme.colors.textSecondary, marginRight: 8 },
  input: { flex: 1, fontSize: 16, fontWeight: '600', color: theme.colors.textPrimary, borderBottomWidth: 1, borderBottomColor: theme.colors.border, paddingVertical: 4 },
  inputUnit: { fontSize: 14, color: theme.colors.textSecondary, marginLeft: 4 },
});

// 하위 호환 re-export
export { DreamStudioScreen as MillionaireScreen };
export type { DreamStudioScreenProps as MillionaireScreenProps };
