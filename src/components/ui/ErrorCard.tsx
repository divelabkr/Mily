// ErrorCard.tsx — 에러 상태 카드 (판단 없는 문구)
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '../../ui/theme';

interface ErrorCardProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorCard({ message, onRetry }: ErrorCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.emoji}>😢</Text>
      <Text style={styles.message}>{message ?? '잠깐 문제가 생겼어요. 다시 해볼까요?'}</Text>
      {onRetry && (
        <TouchableOpacity style={styles.retryBtn} onPress={onRetry} activeOpacity={0.8}>
          <Text style={styles.retryText}>다시 시도</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.milyColors.cream,
    borderRadius: theme.borderRadius.card,
    padding: 24,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.milyColors.surface2,
  },
  emoji: { fontSize: 32, marginBottom: 12 },
  message: { fontSize: 14, color: theme.milyColors.brownMid, textAlign: 'center', lineHeight: 20, marginBottom: 16 },
  retryBtn: {
    backgroundColor: theme.milyColors.coral,
    borderRadius: theme.borderRadius.button,
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  retryText: { fontSize: 14, color: '#fff', fontWeight: '600' },
});
