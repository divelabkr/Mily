// GoldCard.tsx — 골드 강조 카드
import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { theme } from '../../ui/theme';

interface GoldCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function GoldCard({ children, style }: GoldCardProps) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.milyColors.gold,
    borderRadius: theme.borderRadius.card,
    padding: 16,
    marginBottom: 12,
  },
});
