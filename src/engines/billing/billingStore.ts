import { create } from 'zustand';
import { PlanId } from './plans';

export interface SubscriptionState {
  planId: PlanId;
  isActive: boolean;
  expiresAt?: number;
  pilotId?: string | null;
  referralBonusUntil?: number; // Plus 7일 연장 만료 시각
}

interface BillingState {
  subscription: SubscriptionState;
  loading: boolean;
  setSubscription: (sub: SubscriptionState) => void;
  setLoading: (loading: boolean) => void;
  applyReferralBonus: (days: number) => void;
}

const DEFAULT_SUBSCRIPTION: SubscriptionState = {
  planId: 'free',
  isActive: false,
};

export const useBillingStore = create<BillingState>((set) => ({
  subscription: DEFAULT_SUBSCRIPTION,
  loading: false,
  setSubscription: (subscription) => set({ subscription }),
  setLoading: (loading) => set({ loading }),
  applyReferralBonus: (days) =>
    set((state) => ({
      subscription: {
        ...state.subscription,
        referralBonusUntil: Date.now() + days * 24 * 60 * 60 * 1000,
      },
    })),
}));

export function getEffectivePlanId(state: SubscriptionState): PlanId {
  // 파일럿 참가자: Plus 무료
  if (state.pilotId) return 'plus';
  // 추천 보너스 활성
  if (state.referralBonusUntil && Date.now() < state.referralBonusUntil)
    return 'plus';
  if (!state.isActive) return 'free';
  return state.planId;
}
