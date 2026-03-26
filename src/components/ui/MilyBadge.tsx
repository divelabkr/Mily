// MilyBadge.tsx — 뱃지/태그 컴포넌트
import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { theme } from '../../ui/theme';

interface MilyBadgeProps {
  label: string;
  emoji?: string;
  variant?: 'coral' | 'mint' | 'gold' | 'neutral';
  style?: ViewStyle;
}

export function MilyBadge({ label, emoji, variant = 'neutral', style }: MilyBadgeProps) {
  return (
    <View style={[styles.badge, styles[variant], style]}>
      {emoji ? <Text style={styles.emoji}>{emoji}</Text> : null}
      <Text style={[styles.label, styles[`${variant}Text` as keyof typeof styles] as any]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { flexDirection: 'row', alignItems: 'center', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  coral: { backgroundColor: theme.milyColors.coralLight + '30' },
  mint: { backgroundColor: theme.milyColors.mintBg },
  gold: { backgroundColor: theme.milyColors.gold + '30' },
  neutral: { backgroundColor: theme.milyColors.surface2 },
  emoji: { fontSize: 14, marginRight: 4 },
  label: { fontSize: 13, fontWeight: '500' },
  coralText: { color: theme.milyColors.coral },
  mintText: { color: theme.milyColors.mint },
  goldText: { color: theme.milyColors.brownDark },
  neutralText: { color: theme.milyColors.brownMid },
});
