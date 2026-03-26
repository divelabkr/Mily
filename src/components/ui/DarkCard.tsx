// DarkCard.tsx — 다크 브라운 카드 (주요 지표용)
import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { theme } from '../../ui/theme';

interface DarkCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function DarkCard({ children, style }: DarkCardProps) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.milyColors.brownDark,
    borderRadius: theme.borderRadius.card,
    padding: 20,
    marginBottom: 12,
  },
});
