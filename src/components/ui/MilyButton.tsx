// MilyButton.tsx — 코랄 기본 버튼
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { theme } from '../../ui/theme';

interface MilyButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function MilyButton({ label, onPress, variant = 'primary', disabled, style, textStyle }: MilyButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.base, styles[variant], disabled && styles.disabled, style]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <Text style={[styles.text, styles[`${variant}Text` as keyof typeof styles] as TextStyle, textStyle]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: theme.borderRadius.button,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: { backgroundColor: theme.milyColors.coral },
  secondary: { backgroundColor: theme.milyColors.surface2, borderWidth: 1, borderColor: theme.milyColors.coral },
  ghost: { backgroundColor: 'transparent' },
  disabled: { opacity: 0.4 },
  text: { fontSize: 16, fontWeight: '600' },
  primaryText: { color: '#fff' },
  secondaryText: { color: theme.milyColors.coral },
  ghostText: { color: theme.milyColors.brownDark },
});
