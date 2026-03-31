// app/(adult)/dream.tsx — 꿈 설계소
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
} from 'react-native';
import { ScreenLayout } from '../../src/ui/layouts/ScreenLayout';
import { theme } from '../../src/ui/theme';
import { getRoleModels } from '../../src/engines/millionaire/roleModelService';
import { getDreamScenarios } from '../../src/engines/millionaire/dreamScenarioService';

export default function DreamRoute() {
  const roleModels = getRoleModels('D', 'parent');
  const scenarios = getDreamScenarios('D');
  const [expandedModel, setExpandedModel] = useState<string | null>(null);

  return (
    <ScreenLayout>
      <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
        <Text style={styles.pageTitle}>꿈 설계소 🌟</Text>

        {/* 목표 카드 섹션 */}
        <Text style={styles.sectionLabel}>내 목표</Text>
        {scenarios.map((sc) => (
          <View key={sc.id} style={styles.goalCard}>
            <View style={styles.goalHeader}>
              <Text style={styles.goalEmoji}>{sc.emoji}</Text>
              <View style={styles.goalInfo}>
                <Text style={styles.goalTitle}>{sc.title}</Text>
                <Text style={styles.goalAmount}>
                  {sc.realWorldPrice.toLocaleString()}원
                </Text>
              </View>
            </View>

            {/* 진행률 바 */}
            <View style={styles.progressBg}>
              <View style={[styles.progressFill, { width: '0%' }]} />
            </View>
            <Text style={styles.goalHint}>
              매주 5,000원이면 달성해볼 수 있어요!
            </Text>
          </View>
        ))}

        {/* + 새 목표 추가 */}
        <TouchableOpacity style={styles.addGoalButton} activeOpacity={0.8}>
          <Text style={styles.addGoalButtonText}>+ 새 목표 추가하기</Text>
        </TouchableOpacity>

        {/* 롤모델 섹션 */}
        <Text style={[styles.sectionLabel, { marginTop: 28 }]}>부자 롤모델</Text>
        {roleModels.map((model) => (
          <TouchableOpacity
            key={model.id}
            style={styles.roleModelCard}
            onPress={() =>
              setExpandedModel(expandedModel === model.id ? null : model.id)
            }
            activeOpacity={0.8}
          >
            <View style={styles.roleModelHeader}>
              <Text style={styles.roleModelName}>{model.name}</Text>
              <Text style={styles.roleModelArrow}>
                {expandedModel === model.id ? '▲' : '▼'}
              </Text>
            </View>
            <Text style={styles.roleModelOneLiner}>{model.oneLiner}</Text>
            {expandedModel === model.id && (
              <View style={styles.roleModelDetail}>
                {model.keyHabits.map((h, i) => (
                  <Text key={i} style={styles.roleModelHabit}>• {h}</Text>
                ))}
              </View>
            )}
          </TouchableOpacity>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, paddingTop: 8 },
  pageTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: theme.milyColors.brownDark,
    marginBottom: 24,
    marginTop: 16,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.milyColors.brownMid,
    marginBottom: 12,
    letterSpacing: 0.4,
  },
  goalCard: {
    backgroundColor: theme.milyColors.goldLight,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: theme.milyColors.gold,
    padding: 18,
    marginBottom: 12,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  goalEmoji: {
    fontSize: 32,
    marginRight: 14,
  },
  goalInfo: { flex: 1 },
  goalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.milyColors.brownDark,
    marginBottom: 3,
  },
  goalAmount: {
    fontSize: 14,
    color: theme.milyColors.brownMid,
    fontWeight: '500',
  },
  progressBg: {
    height: 8,
    backgroundColor: 'rgba(201,169,110,0.25)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.milyColors.gold,
    borderRadius: 4,
  },
  goalHint: {
    fontSize: 13,
    color: theme.milyColors.brownMid,
  },
  addGoalButton: {
    height: 52,
    borderRadius: theme.borderRadius.button,
    backgroundColor: theme.milyColors.coral,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  addGoalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  roleModelCard: {
    backgroundColor: theme.milyColors.sky,
    borderRadius: theme.borderRadius.card,
    borderWidth: 1,
    borderColor: theme.milyColors.skyBorder,
    padding: 16,
    marginBottom: 10,
  },
  roleModelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  roleModelName: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.milyColors.brownDark,
  },
  roleModelArrow: {
    fontSize: 13,
    color: theme.milyColors.brownMid,
  },
  roleModelOneLiner: {
    fontSize: 14,
    color: theme.milyColors.brownMid,
    lineHeight: 20,
  },
  roleModelDetail: {
    marginTop: 12,
    gap: 6,
  },
  roleModelHabit: {
    fontSize: 13,
    color: theme.milyColors.brownDark,
    lineHeight: 19,
  },
});
