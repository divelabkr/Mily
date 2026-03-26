// MilyCard.tsx — 기본 카드 컴포넌트 (크림 배경)
import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { theme } from '../../ui/theme';

interface MilyCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function MilyCard({ children, style }: MilyCardProps) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.milyColors.cream,
    borderRadius: theme.borderRadius.card,
    padding: 16,
    marginBottom: 12,
  },
});
