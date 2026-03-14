import * as amplitude from '@amplitude/analytics-react-native';
import { useAuthStore } from '../auth/authStore';
import { useBillingStore } from '../billing/billingStore';

const AMPLITUDE_API_KEY = process.env.EXPO_PUBLIC_AMPLITUDE_API_KEY ?? '';

export type UserSegment =
  | 'individual'
  | 'parent'
  | 'child'
  | 'pilot_participant';

// ──────────────────────────────────────────────
// 초기화
// ──────────────────────────────────────────────

export function initAnalytics(userId: string): void {
  if (!AMPLITUDE_API_KEY) return;
  amplitude.init(AMPLITUDE_API_KEY, userId);
  amplitude.setUserId(userId);
}

// ──────────────────────────────────────────────
// user_segment 판별
// ──────────────────────────────────────────────

export function getUserSegment(): UserSegment {
  const user = useAuthStore.getState().user;
  const sub = useBillingStore.getState().subscription;

  if (sub.pilotId) return 'pilot_participant';
  if (user?.role === 'child') return 'child';
  if (user?.role === 'parent') return 'parent';
  return 'individual';
}

// ──────────────────────────────────────────────
// 이벤트 트래킹 (12개 핵심 이벤트)
// ──────────────────────────────────────────────

export async function trackEvent(
  eventName: string,
  properties?: Record<string, unknown>
): Promise<void> {
  if (!AMPLITUDE_API_KEY) return;
  amplitude.track(eventName, {
    user_segment: getUserSegment(),
    ...properties,
  });
}

// 12개 핵심 이벤트 헬퍼
export const Events = {
  onboardingStarted: (role: string) =>
    trackEvent('onboarding_started', { role }),

  onboardingCompleted: (role: string, skippedPlan: boolean) =>
    trackEvent('onboarding_completed', { role, skipped_plan: skippedPlan }),

  planCreated: (month: string, categoryCount: number) =>
    trackEvent('plan_created', { month, categoryCount }),

  checkinCompleted: (
    week: string,
    amount: number,
    boundary: string,
    emotionTag: string | null,
    spendType: string | null
  ) =>
    trackEvent('checkin_completed', {
      week,
      amount,
      boundary,
      emotionTag,
      spendType,
    }),

  reviewCompleted: (week: string, aiUsed: boolean, promiseKept: boolean | null) =>
    trackEvent('review_completed', { week, aiUsed, promiseKept }),

  requestCardSent: (type: string) =>
    trackEvent('request_card_sent', { type }),

  praiseCardSent: (type: string) =>
    trackEvent('praise_card_sent', { type }),

  familyLinked: (memberCount: number) =>
    trackEvent('family_linked', { memberCount }),

  paywallViewed: (trigger: string) =>
    trackEvent('paywall_viewed', { trigger }),

  subscriptionStarted: (plan: string, price: number) =>
    trackEvent('subscription_started', { plan, price }),

  subscriptionCancelled: (plan: string) =>
    trackEvent('subscription_cancelled', { plan }),

  referralSent: () => trackEvent('referral_sent'),

  referralAccepted: () => trackEvent('referral_accepted'),
} as const;
