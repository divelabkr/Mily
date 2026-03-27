// EmptyState.tsx — 빈 상태 안내 (문맥별 메시지)
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '../../ui/theme';

type EmptyContext = 'home' | 'request' | 'praise' | 'achievement' | 'review' | 'promise' | 'default';

const EMPTY_MESSAGES: Record<EmptyContext, { emoji: string; text: string }> = {
  home:        { emoji: '🌱', text: '오늘 첫 기록을 남겨봐요' },
  request:     { emoji: '✉️', text: '아직 요청 카드가 없어요' },
  praise:      { emoji: '💌', text: '첫 칭찬 카드를 보내봐요' },
  achievement: { emoji: '🏆', text: '첫 기록을 남기면 업적이 생겨요' },
  review:      { emoji: '📋', text: '이번 주 기록을 쌓으면 회고할 수 있어요' },
  promise:     { emoji: '🤝', text: '가족과 첫 약속을 만들어봐요' },
  default:     { emoji: '📭', text: '아직 데이터가 없어요' },
};

interface EmptyStateProps {
  context?: EmptyContext;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ context = 'default', actionLabel, onAction }: EmptyStateProps) {
  const msg = EMPTY_MESSAGES[context];
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>{msg.emoji}</Text>
      <Text style={styles.text}>{msg.text}</Text>
      {actionLabel && onAction && (
        <TouchableOpacity style={styles.actionBtn} onPress={onAction} activeOpacity={0.8}>
          <Text style={styles.actionText}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', paddingVertical: 40 },
  emoji: { fontSize: 48, marginBottom: 12 },
  text: { fontSize: 15, color: theme.milyColors.brownMid, textAlign: 'center' },
  actionBtn: {
    marginTop: 16,
    backgroundColor: theme.milyColors.coral,
    borderRadius: theme.borderRadius.button,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  actionText: { fontSize: 14, color: '#fff', fontWeight: '600' },
});
