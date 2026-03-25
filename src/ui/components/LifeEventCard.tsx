// ──────────────────────────────────────────────
// LifeEventCard.tsx — 생활 이벤트 카드
// 홈 화면 상단에 월 1회 표시
// type별 색상: bonus=gold, challenge=coral, family=brown
// Feature Flag: LIFE_EVENTS_ENABLED
// ──────────────────────────────────────────────

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '../theme';
import { filterDna } from '../../engines/message/dnaFilter';
import { LifeEvent, LifeEventType } from '../../engines/cashflow/lifeEventService';

// ── 타입별 색상 ─────────────────────────────

const TYPE_COLORS: Record<LifeEventType, string> = {
  bonus: '#F5C542',           // gold
  challenge: '#FF7F7F',      // coral
  family_decision: '#8B6F47', // brown
};

const TYPE_LABELS: Record<LifeEventType, string> = {
  bonus: '보너스',
  challenge: '도전',
  family_decision: '가족 결정',
};

// ── 컴포넌트 ────────────────────────────────

export interface LifeEventCardProps {
  event: LifeEvent;
  onPress?: () => void;
}

export function LifeEventCard({ event, onPress }: LifeEventCardProps) {
  const color = TYPE_COLORS[event.type];
  const typeLabel = TYPE_LABELS[event.type];
  const safeDesc = filterDna(event.description).passed
    ? event.description
    : '이번 달 이벤트를 확인해봐요!';

  return (
    <TouchableOpacity
      style={[styles.card, { borderLeftColor: color }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <Text style={styles.emoji}>{event.emoji}</Text>
        <View style={styles.headerText}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{event.title}</Text>
            <View style={[styles.typeBadge, { backgroundColor: color }]}>
              <Text style={styles.typeLabel}>{typeLabel}</Text>
            </View>
          </View>
          <Text style={styles.description} numberOfLines={2}>
            {safeDesc}
          </Text>
        </View>
      </View>
      {event.financialImpact != null && event.financialImpact !== 0 && (
        <View style={styles.impactRow}>
          <Text
            style={[
              styles.impactText,
              { color: event.financialImpact > 0 ? theme.colors.success : '#E57373' },
            ]}
          >
            {event.financialImpact > 0 ? '+' : ''}
            {event.financialImpact.toLocaleString()}원
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// ── 스타일 ─────────────────────────────────

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.card,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  header: { flexDirection: 'row', alignItems: 'flex-start' },
  emoji: { fontSize: 32, marginRight: 12 },
  headerText: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  title: { fontSize: 15, fontWeight: '600', color: theme.colors.textPrimary, marginRight: 8 },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  typeLabel: { fontSize: 11, fontWeight: '600', color: '#fff' },
  description: { fontSize: 13, color: theme.colors.textSecondary, lineHeight: 18 },
  impactRow: { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: theme.colors.border, alignItems: 'flex-end' },
  impactText: { fontSize: 16, fontWeight: '700' },
});
