// ──────────────────────────────────────────────
// rewardStore.ts — 쿠폰 Zustand 스토어
// ──────────────────────────────────────────────

import { create } from 'zustand';
import type { CouponWithStatus, RewardSettings } from './rewardTypes';

interface RewardState {
  coupons: CouponWithStatus[];
  /**
   * 선물함 아이콘 표시 여부
   * true  : 활성 쿠폰 존재 → 우측 상단 아이콘 표시
   * false : 쿠폰 없음 → 아이콘 자체 미렌더링
   */
  hasActive: boolean;
  rewardSettings: RewardSettings;

  setCoupons: (coupons: CouponWithStatus[]) => void;
  setHasActive: (hasActive: boolean) => void;
  markUsed: (couponId: string) => void;
  updateSettings: (settings: RewardSettings) => void;
}

export const useRewardStore = create<RewardState>((set) => ({
  coupons: [],
  hasActive: false,
  rewardSettings: { notifyParentOnCoupon: true },

  setCoupons: (coupons) =>
    set({
      coupons,
      hasActive: coupons.some((c) => c.status === 'active' && c.isVisible),
    }),

  setHasActive: (hasActive) => set({ hasActive }),

  markUsed: (couponId) =>
    set((state) => {
      const coupons = state.coupons.map((c) =>
        c.couponId === couponId
          ? { ...c, status: 'used' as const, isVisible: false, usedAt: new Date() }
          : c
      );
      return {
        coupons,
        hasActive: coupons.some((c) => c.status === 'active' && c.isVisible),
      };
    }),

  updateSettings: (settings) => set({ rewardSettings: settings }),
}));
