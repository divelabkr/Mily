// FABZone.tsx — 플로팅 액션 버튼 영역
// 메인 FAB: 항상 mainAction.onPress() 직접 실행
// 보조 FAB: 우측 하단 소형 ⊕ 버튼으로 펼치기/접기
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
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
  const hasSecondary = secondaryActions.length > 0;

  return (
    <View style={[styles.container, { pointerEvents: 'box-none' }]}>
      {/* 보조 FAB 목록 — expanded 때만 표시 */}
      {expanded && hasSecondary && secondaryActions.map((action, i) => (
        <TouchableOpacity
          key={action.key}
          style={[styles.secondaryFab, { bottom: 72 + i * 52 }]}
          onPress={() => { setExpanded(false); action.onPress(); }}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={action.label}
        >
          {action.emoji ? <Text style={styles.fabEmoji}>{action.emoji}</Text> : null}
          <Text style={styles.secondaryLabel}>{action.label}</Text>
        </TouchableOpacity>
      ))}

      {/* 보조 펼치기 버튼 — secondaryActions 있을 때만 표시 */}
      {hasSecondary && (
        <TouchableOpacity
          style={styles.expandFab}
          onPress={() => setExpanded((v) => !v)}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={expanded ? '보조 메뉴 닫기' : '보조 메뉴 열기'}
        >
          <Text style={styles.expandFabText}>{expanded ? '✕' : '⊕'}</Text>
        </TouchableOpacity>
      )}

      {/* 메인 FAB — 항상 mainAction.onPress() 직접 실행 */}
      <TouchableOpacity
        style={styles.mainFab}
        onPress={mainAction.onPress}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={mainAction.label}
      >
        <Text style={styles.mainFabText}>{mainAction.label}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    alignItems: 'flex-end',
  },
  mainFab: {
    backgroundColor: theme.milyColors.coral,
    borderRadius: 28,
    height: 52,
    paddingHorizontal: 22,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    ...Platform.select({
      web: { boxShadow: '0px 4px 10px rgba(232,80,58,0.35)' },
      default: {
        shadowColor: theme.milyColors.coral,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 8,
      },
    }),
  },
  mainFabText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  expandFab: {
    position: 'absolute',
    bottom: 60,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.milyColors.surface2,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    ...Platform.select({
      web: { boxShadow: '0px 2px 4px rgba(0,0,0,0.12)' },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 4,
      },
    }),
  },
  expandFabText: {
    fontSize: 18,
    color: theme.milyColors.brownDark,
    fontWeight: '600',
    lineHeight: 22,
  },
  secondaryFab: {
    position: 'absolute',
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 22,
    height: 42,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: theme.milyColors.surface2,
    elevation: 3,
    ...Platform.select({
      web: { boxShadow: '0px 2px 6px rgba(0,0,0,0.10)' },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
    }),
  },
  fabEmoji: {
    fontSize: 15,
    marginRight: 6,
  },
  secondaryLabel: {
    fontSize: 14,
    color: theme.milyColors.brownDark,
    fontWeight: '500',
  },
});
