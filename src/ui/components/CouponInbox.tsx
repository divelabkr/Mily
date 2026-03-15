// ──────────────────────────────────────────────
// CouponInbox.tsx — 쿠폰함 모달
// 아이콘 탭 시 표시, 전체 사용/만료 시 아이콘 자동 사라짐
// ──────────────────────────────────────────────

import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { theme } from '../theme';
import { useRewardStore } from '../../engines/reward/rewardStore';
import { markAsUsed } from '../../engines/reward/rewardService';
import { capture } from '../../engines/monitoring/posthogService';
import type { CouponWithStatus } from '../../engines/reward/rewardTypes';

interface CouponInboxProps {
  visible: boolean;
  uid: string;
  onClose: () => void;
}

function formatDate(date: Date): string {
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
}

function CouponCard({
  coupon,
  uid,
  onUsed,
}: {
  coupon: CouponWithStatus;
  uid: string;
  onUsed: () => void;
}) {
  const [copying, setCopying] = useState(false);
  const [marking, setMarking] = useState(false);
  const isExpired = coupon.status === 'expired';
  const isUsed = coupon.status === 'used';
  const isInactive = isExpired || isUsed;

  const handleCopyCode = async () => {
    if (isInactive) return;
    setCopying(true);
    await Clipboard.setStringAsync(coupon.couponCode);
    setCopying(false);
    Alert.alert('복사 완료', `쿠폰 코드가 복사됐어요.\n${coupon.brand}에서 사용해보세요!`);
  };

  const handleMarkUsed = async () => {
    if (isInactive || marking) return;
    Alert.alert(
      '사용 완료 처리',
      `${coupon.brand} ${coupon.value.toLocaleString()}원 쿠폰을 사용했나요?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '사용완료',
          onPress: async () => {
            setMarking(true);
            try {
              await markAsUsed(uid, coupon.couponId);
              useRewardStore.getState().markUsed(coupon.couponId);
              onUsed();
            } catch {
              Alert.alert('오류', '잠시 후 다시 시도해주세요.');
            } finally {
              setMarking(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.couponCard, isInactive && styles.couponCardInactive]}>
      <View style={styles.couponTop}>
        <View style={styles.couponBrandRow}>
          <Text style={[styles.couponBrand, isInactive && styles.textFaded]}>
            {coupon.brand}
          </Text>
          <Text style={[styles.couponValue, isInactive && styles.textFaded]}>
            {coupon.value.toLocaleString()}원
          </Text>
        </View>
        <Text style={[styles.couponTitle, isInactive && styles.textFaded]}>
          {coupon.title}
        </Text>
      </View>

      {/* 쿠폰 코드 — 탭하면 클립보드 복사 */}
      <TouchableOpacity
        style={[styles.couponCodeBox, isInactive && styles.couponCodeBoxInactive]}
        onPress={handleCopyCode}
        disabled={isInactive || copying}
        activeOpacity={0.7}
      >
        <Text style={[styles.couponCode, isInactive && styles.textFaded]}>
          {coupon.couponCode}
        </Text>
        {!isInactive && (
          <Text style={styles.copyHint}>{copying ? '복사 중...' : '탭하여 복사'}</Text>
        )}
      </TouchableOpacity>

      <View style={styles.couponBottom}>
        <Text style={[styles.expiryText, isInactive && styles.textFaded]}>
          {isUsed
            ? `사용완료 · ${coupon.usedAt ? formatDate(coupon.usedAt) : ''}`
            : isExpired
            ? `만료됨 · ${formatDate(coupon.expiresAt)}`
            : `~ ${formatDate(coupon.expiresAt)} 까지`}
        </Text>

        {!isInactive && (
          <TouchableOpacity
            style={styles.usedButton}
            onPress={handleMarkUsed}
            disabled={marking}
            activeOpacity={0.7}
          >
            <Text style={styles.usedButtonText}>
              {marking ? '처리 중...' : '사용완료'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

export function CouponInbox({ visible, uid, onClose }: CouponInboxProps) {
  const coupons = useRewardStore((s) => s.coupons);
  const hasActive = useRewardStore((s) => s.hasActive);

  const activeCoupons = coupons.filter((c) => c.status === 'active');
  const inactiveCoupons = coupons.filter((c) => c.status !== 'active');

  const handleOpen = () => {
    capture('coupon_inbox_opened');
  };

  const handleUsed = () => {
    // 모든 쿠폰 사용/만료 → 모달 닫고 아이콘 사라짐
    const remaining = useRewardStore.getState().coupons.filter(
      (c) => c.status === 'active' && c.isVisible
    );
    if (remaining.length === 0) {
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      onShow={handleOpen}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* 헤더 */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>🎁 쿠폰함</Text>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
              <Text style={styles.closeButton}>닫기</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scroll}
            showsVerticalScrollIndicator={false}
          >
            {coupons.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>쿠폰이 없어요</Text>
              </View>
            ) : (
              <>
                {/* 미사용 쿠폰 */}
                {activeCoupons.length > 0 && (
                  <View style={styles.section}>
                    <Text style={styles.sectionLabel}>사용 가능</Text>
                    {activeCoupons.map((c) => (
                      <CouponCard
                        key={c.couponId}
                        coupon={c}
                        uid={uid}
                        onUsed={handleUsed}
                      />
                    ))}
                  </View>
                )}

                {/* 만료/사용완료 쿠폰 */}
                {inactiveCoupons.length > 0 && (
                  <View style={styles.section}>
                    <Text style={styles.sectionLabel}>사용완료 / 만료</Text>
                    {inactiveCoupons.map((c) => (
                      <CouponCard
                        key={c.couponId}
                        coupon={c}
                        uid={uid}
                        onUsed={handleUsed}
                      />
                    ))}
                  </View>
                )}
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ──────────────────────────────────────────────
// 선물함 아이콘 컴포넌트 (헤더에 삽입)
// hasActive === true 일 때만 렌더링
// ──────────────────────────────────────────────

interface GiftIconProps {
  uid: string;
  activeCount: number;
}

export function GiftIcon({ uid, activeCount }: GiftIconProps) {
  const [inboxVisible, setInboxVisible] = useState(false);
  const hasActive = useRewardStore((s) => s.hasActive);

  // 활성 쿠폰 없으면 아이콘 자체 미렌더링 (핵심 UX)
  if (!hasActive) return null;

  return (
    <>
      <TouchableOpacity
        style={styles.giftIconContainer}
        onPress={() => setInboxVisible(true)}
        activeOpacity={0.7}
      >
        <Text style={styles.giftEmoji}>🎁</Text>
        {activeCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{activeCount}</Text>
          </View>
        )}
      </TouchableOpacity>

      <CouponInbox
        visible={inboxVisible}
        uid={uid}
        onClose={() => setInboxVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  // ── 모달 ──
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing[5],
    paddingTop: theme.spacing[5],
    paddingBottom: theme.spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  closeButton: {
    fontSize: 15,
    color: theme.colors.textSecondary,
  },
  scroll: {
    paddingHorizontal: theme.spacing[5],
    paddingTop: theme.spacing[4],
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing[10],
  },
  emptyText: {
    fontSize: 15,
    color: theme.colors.textSecondary,
  },
  section: {
    marginBottom: theme.spacing[5],
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing[3],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  // ── 쿠폰 카드 ──
  couponCard: {
    backgroundColor: '#FFFBF0',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.accent,
    padding: theme.spacing[4],
    marginBottom: theme.spacing[3],
  },
  couponCardInactive: {
    backgroundColor: theme.colors.surface ?? '#F5F5F5',
    borderColor: theme.colors.border,
    opacity: 0.6,
  },
  couponTop: {
    marginBottom: theme.spacing[3],
  },
  couponBrandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing[1],
  },
  couponBrand: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  couponValue: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  couponTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  couponCodeBox: {
    backgroundColor: theme.colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
    padding: theme.spacing[3],
    alignItems: 'center',
    marginBottom: theme.spacing[3],
  },
  couponCodeBoxInactive: {
    borderStyle: 'solid',
  },
  couponCode: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 2,
    color: theme.colors.textPrimary,
    fontFamily: 'monospace',
  },
  copyHint: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  couponBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  expiryText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  usedButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 6,
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[2],
  },
  usedButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  textFaded: {
    color: theme.colors.textSecondary,
  },
  // ── 선물함 아이콘 ──
  giftIconContainer: {
    position: 'relative',
    padding: 4,
  },
  giftEmoji: {
    fontSize: 24,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#E53935',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
