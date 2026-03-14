import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { theme } from '../theme';
import { FeatureId, AGE_BANDS } from '../../engines/unlock/unlockTypes';
import { getAgeBandForAge } from '../../engines/unlock/unlockService';

// ──────────────────────────────────────────────
// 잠긴 기능 미리보기 카드
// CLAUDE.md §19: 숨기지 않고 미리보기 카드로 호기심 유발
// "13살에 열려요. 미리 써볼래요?"
// ──────────────────────────────────────────────

// 기능별 표시 문구
const FEATURE_LABELS: Record<FeatureId, string> = {
  checkin_basic: '체크인',
  praise_receive: '칭찬 카드',
  weekly_promise_simple: '이번 주 약속',
  request_card: '요청 카드',
  plan_simple: '월 계획',
  emotion_tag: '감정 태그',
  income_category: '수입 기록',
  independence_card: '독립 선언',
};

const FEATURE_DESCRIPTIONS: Record<FeatureId, string> = {
  checkin_basic: '오늘 쓴 돈을 기록해요',
  praise_receive: '부모님의 칭찬 카드를 받아요',
  weekly_promise_simple: '이번 주 나의 약속을 정해요',
  request_card: '부모님께 요청 카드를 보내요',
  plan_simple: '이번 달 용돈 계획을 세워요',
  emotion_tag: '소비할 때 느낀 감정을 기록해요',
  income_category: '용돈·아르바이트 수입을 기록해요',
  independence_card: '나만의 독립 선언을 해요',
};

interface Props {
  featureId: FeatureId;
  currentAge: number;
  hasEarlyUnlockDialog: boolean; // 조기 해금 대화 세트 존재 여부
  onTryEarly?: () => void;       // 미리 써볼래요 탭 핸들러
}

export function LockedFeatureCard({
  featureId,
  currentAge,
  hasEarlyUnlockDialog,
  onTryEarly,
}: Props) {
  // 이 기능이 열리는 최소 나이 계산
  const unlockAge = (() => {
    for (const band of Object.values(AGE_BANDS)) {
      if (band.unlockedFeatures.includes(featureId)) {
        return band.minAge;
      }
    }
    return null;
  })();

  const yearsLeft = unlockAge ? unlockAge - currentAge : null;
  const label = FEATURE_LABELS[featureId];
  const description = FEATURE_DESCRIPTIONS[featureId];

  return (
    <View style={styles.container}>
      {/* 흐린 미리보기 영역 */}
      <View style={styles.previewArea}>
        <Text style={styles.previewEmoji}>🔒</Text>
        <View style={styles.previewText}>
          <Text style={styles.featureLabel}>{label}</Text>
          <Text style={styles.featureDesc}>{description}</Text>
        </View>
      </View>

      {/* 해금 안내 */}
      <View style={styles.lockInfo}>
        {unlockAge && yearsLeft && yearsLeft > 0 ? (
          <Text style={styles.lockMessage}>
            {unlockAge}살이 되면 자동으로 열려요
            {yearsLeft === 1 ? ' (1년 후)' : ` (${yearsLeft}년 후)`}
          </Text>
        ) : (
          <Text style={styles.lockMessage}>곧 열릴 예정이에요</Text>
        )}

        {hasEarlyUnlockDialog && onTryEarly && (
          <TouchableOpacity
            style={styles.earlyBtn}
            onPress={onTryEarly}
            activeOpacity={0.8}
          >
            <Text style={styles.earlyBtnText}>미리 써볼래요? →</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F8F8F8',
    borderRadius: theme.borderRadius.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
    overflow: 'hidden',
  },
  previewArea: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    opacity: 0.45,
    gap: 12,
  },
  previewEmoji: {
    fontSize: 24,
  },
  previewText: {
    flex: 1,
  },
  featureLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  lockInfo: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lockMessage: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    flex: 1,
  },
  earlyBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginLeft: 8,
  },
  earlyBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
});
