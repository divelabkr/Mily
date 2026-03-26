// FABZone.tsx — 플로팅 액션 버튼 영역
// 메인 1개 + 보조 최대 3개
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { theme } from '../../ui/theme';

export interface FABAction {
  key: string;
  label: string;
  emoji?: string;
  onPress: () => void;
}

interface FABZoneProps {
  mainAction: FABAction;
  secondaryActions?: FABAction[];
}

export function FABZone({ mainAction, secondaryActions = [] }: FABZoneProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={styles.container} pointerEvents="box-none">
      {expanded && secondaryActions.map((action, i) => (
        <TouchableOpacity
          key={action.key}
          style={[styles.secondaryFab, { bottom: 72 + i * 56 }]}
          onPress={() => { setExpanded(false); action.onPress(); }}
          activeOpacity={0.8}
        >
          {action.emoji ? <Text style={styles.fabEmoji}>{action.emoji}</Text> : null}
          <Text style={styles.secondaryLabel}>{action.label}</Text>
        </TouchableOpacity>
      ))}
      <TouchableOpacity
        style={styles.mainFab}
        onPress={() => {
          if (secondaryActions.length > 0) {
            setExpanded(!expanded);
          } else {
            mainAction.onPress();
          }
        }}
        activeOpacity={0.8}
      >
        <Text style={styles.mainFabText}>{expanded ? '✕' : mainAction.label}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'absolute', bottom: 24, right: 20, alignItems: 'flex-end' },
  mainFab: {
    backgroundColor: theme.milyColors.coral,
    borderRadius: 28,
    height: 56,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 6,
  },
  mainFabText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  secondaryFab: {
    position: 'absolute',
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.milyColors.surface2,
    borderRadius: 24,
    height: 44,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  fabEmoji: { fontSize: 16, marginRight: 6 },
  secondaryLabel: { fontSize: 14, color: theme.milyColors.brownDark, fontWeight: '500' },
});
