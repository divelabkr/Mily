import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../theme';

interface SmallWinCardProps {
  message: string;
}

export function SmallWinCard({ message }: SmallWinCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.emoji}>🎉</Text>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FAF0',
    borderRadius: theme.borderRadius.card,
    padding: theme.spacing[4],
    gap: theme.spacing[3],
    borderWidth: 1,
    borderColor: theme.colors.success,
  },
  emoji: {
    fontSize: 24,
  },
  text: {
    flex: 1,
    fontSize: 15,
    color: theme.colors.textPrimary,
    lineHeight: 22,
  },
});
