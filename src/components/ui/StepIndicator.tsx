// StepIndicator.tsx — 온보딩 단계 표시
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { theme } from '../../ui/theme';

interface StepIndicatorProps {
  totalSteps: number;
  currentStep: number; // 0-based
}

export function StepIndicator({ totalSteps, currentStep }: StepIndicatorProps) {
  return (
    <View style={styles.row}>
      {Array.from({ length: totalSteps }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            i === currentStep && styles.dotActive,
            i < currentStep && styles.dotDone,
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.milyColors.brownLight },
  dotActive: { width: 24, backgroundColor: theme.milyColors.coral },
  dotDone: { backgroundColor: theme.milyColors.brownMid },
});
