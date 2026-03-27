// SkeletonCard.tsx — 로딩 스켈레톤 카드
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle } from 'react-native';
import { theme } from '../../ui/theme';

interface SkeletonCardProps {
  width?: number | string;
  height?: number;
  style?: ViewStyle;
}

export function SkeletonCard({ width = '100%', height = 80, style }: SkeletonCardProps) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        { width: width as any, height, opacity },
        style,
      ]}
    />
  );
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <View style={styles.list}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} height={i === 0 ? 120 : 80} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: theme.milyColors.surface2,
    borderRadius: theme.borderRadius.card,
    marginBottom: 12,
  },
  list: {
    gap: 8,
  },
});
