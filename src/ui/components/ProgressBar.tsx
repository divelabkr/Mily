import React from 'react';
import { View, StyleSheet } from 'react-native';
import { theme } from '../theme';

interface ProgressBarProps {
  progress: number; // 0~1
  color?: string;
  height?: number;
}

export function ProgressBar({
  progress,
  color = theme.colors.primary,
  height = 8,
}: ProgressBarProps) {
  const clampedProgress = Math.min(1, Math.max(0, progress));

  return (
    <View style={[styles.track, { height }]}>
      <View
        style={[
          styles.fill,
          {
            width: `${clampedProgress * 100}%`,
            backgroundColor: color,
            height,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    backgroundColor: theme.colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: {
    borderRadius: 4,
  },
});
