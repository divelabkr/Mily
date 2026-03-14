import Purchases, {
  PurchasesOffering,
  CustomerInfo,
} from 'react-native-purchases';
import { Platform } from 'react-native';
import { useBillingStore, SubscriptionState } from './billingStore';
import { PlanId } from './plans';
import { trackEvent } from '../analytics/analyticsService';

const RC_API_KEY_IOS = process.env.EXPO_PUBLIC_RC_API_KEY_IOS ?? '';
const RC_API_KEY_ANDROID = process.env.EXPO_PUBLIC_RC_API_KEY_ANDROID ?? '';

// ──────────────────────────────────────────────
// 초기화 (앱 시작 시 한 번 호출)
// ──────────────────────────────────────────────

export function initRevenueCat(userId: string): void {
  const apiKey =
    Platform.OS === 'ios' ? RC_API_KEY_IOS : RC_API_KEY_ANDROID;
  if (!apiKey) return; // 키 없으면 스킵 (개발환경)

  Purchases.configure({ apiKey });
  Purchases.logIn(userId);

  // 구독 상태 리스너
  Purchases.addCustomerInfoUpdateListener(handleCustomerInfoUpdate);
}

function handleCustomerInfoUpdate(info: CustomerInfo): void {
  const sub = parseCustomerInfo(info);
  useBillingStore.getState().setSubscription(sub);
}

function parseCustomerInfo(info: CustomerInfo): SubscriptionState {
  const hasFamilyEntitlement =
    info.entitlements.active['family'] !== undefined;
  const hasPlusEntitlement =
    info.entitlements.active['plus'] !== undefined;

  if (hasFamilyEntitlement) {
    return {
      planId: 'family',
      isActive: true,
      expiresAt: info.entitlements.active['family']?.expirationDate
        ? new Date(info.entitlements.active['family'].expirationDate).getTime()
        : undefined,
    };
  }
  if (hasPlusEntitlement) {
    return {
      planId: 'plus',
      isActive: true,
      expiresAt: info.entitlements.active['plus']?.expirationDate
        ? new Date(info.entitlements.active['plus'].expirationDate).getTime()
        : undefined,
    };
  }
  return { planId: 'free', isActive: false };
}

// ──────────────────────────────────────────────
// 구독 현재 상태 동기화
// ──────────────────────────────────────────────

export async function syncSubscription(): Promise<void> {
  useBillingStore.getState().setLoading(true);
  try {
    const info = await Purchases.getCustomerInfo();
    handleCustomerInfoUpdate(info);
  } catch {
    // 네트워크 오류 등 — 현재 상태 유지
  } finally {
    useBillingStore.getState().setLoading(false);
  }
}

// ──────────────────────────────────────────────
// 구독 구매
// ──────────────────────────────────────────────

export async function purchasePlan(planId: 'plus' | 'family'): Promise<boolean> {
  useBillingStore.getState().setLoading(true);
  try {
    const offerings = await Purchases.getOfferings();
    const offering: PurchasesOffering | null =
      offerings.current ?? offerings.all['default'] ?? null;
    if (!offering) return false;

    const pkg = offering.availablePackages.find((p) =>
      planId === 'family'
        ? p.identifier.toLowerCase().includes('family')
        : p.identifier.toLowerCase().includes('plus') ||
          p.identifier === '$rc_monthly'
    );
    if (!pkg) return false;

    const { customerInfo } = await Purchases.purchasePackage(pkg);
    handleCustomerInfoUpdate(customerInfo);

    await trackEvent('subscription_started', {
      plan: planId,
      price: planId === 'plus' ? 4900 : 8900,
    });
    return true;
  } catch (e: unknown) {
    // 사용자가 취소한 경우 조용히 처리
    return false;
  } finally {
    useBillingStore.getState().setLoading(false);
  }
}

// ──────────────────────────────────────────────
// 구독 복원
// ──────────────────────────────────────────────

export async function restorePurchases(): Promise<boolean> {
  useBillingStore.getState().setLoading(true);
  try {
    const info = await Purchases.restorePurchases();
    handleCustomerInfoUpdate(info);
    return true;
  } catch {
    return false;
  } finally {
    useBillingStore.getState().setLoading(false);
  }
}

// ──────────────────────────────────────────────
// 구독 현재 플랜 조회
// ──────────────────────────────────────────────

export function getCurrentPlanId(): PlanId {
  const { subscription } = useBillingStore.getState();
  if (subscription.pilotId) return 'plus';
  if (
    subscription.referralBonusUntil &&
    Date.now() < subscription.referralBonusUntil
  )
    return 'plus';
  if (!subscription.isActive) return 'free';
  return subscription.planId;
}

export function isPaidPlan(): boolean {
  return getCurrentPlanId() !== 'free';
}
