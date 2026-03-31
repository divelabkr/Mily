// MintCard.tsx — 민트 성공/완료 카드
import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { theme } from '../../ui/theme';

interface MintCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function MintCard({ children, style }: MintCardProps) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.milyColors.mintBg,
    borderRadius: theme.borderRadius.card,
    borderWidth: 1,
    borderColor: theme.milyColors.mint,
    padding: 16,
    marginBottom: 12,
  },
});
