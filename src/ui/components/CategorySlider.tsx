import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import { theme } from '../theme';

interface CategorySliderProps {
  emoji: string;
  label: string;
  value: number; // 0~100
  onChange: (value: number) => void;
}

export function CategorySlider({
  emoji,
  label,
  value,
  onChange,
}: CategorySliderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>
          {emoji} {label}
        </Text>
        <Text style={styles.value}>{Math.round(value)}%</Text>
      </View>
      <Slider
        style={styles.slider}
        minimumValue={0}
        maximumValue={100}
        step={1}
        value={value}
        onValueChange={onChange}
        minimumTrackTintColor={theme.colors.primary}
        maximumTrackTintColor={theme.colors.border}
        thumbTintColor={theme.colors.primary}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing[3],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing[1],
  },
  label: {
    fontSize: 15,
    color: theme.colors.textPrimary,
  },
  value: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.primary,
    minWidth: 40,
    textAlign: 'right',
  },
  slider: {
    width: '100%',
    height: 44,
  },
});
