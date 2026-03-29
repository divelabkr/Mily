// ──────────────────────────────────────────────
// rewardService.ts — 운영자 깜짝 보상 쿠폰 서비스
// DNA: 앱 내 알림 전용, Mily 명의, 자녀 프라이버시 존중
// ──────────────────────────────────────────────

import {
  doc,
  collection,
  getDoc,
  getDocs,
  setDoc,
  query,
  where,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { getFirebaseDb, getFirebaseFunctions } from '../../lib/firebase';
import { capture } from '../monitoring/posthogService';
import { notifyCouponReceived, notifyParentCouponAlert } from '../notification/notificationService';
import type {
  CouponPayload,
  CouponDoc,
  CouponBrand,
  CouponValue,
  RewardSettings,
  EligibilityResult,
  CouponWithStatus,
  CouponStatus,
} from './rewardTypes';

// ──────────────────────────────────────────────
// 내부 유틸
// ──────────────────────────────────────────────

function generateCouponId(): string {
  return `coupon_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function msToMonths(ms: number): number {
  return ms / (1000 * 60 * 60 * 24 * 30);
}

function docToPayload(d: CouponDoc): CouponPayload {
  return {
    ...d,
    expiresAt: new Date(d.expiresAt),
    sentAt: new Date(d.sentAt),
    usedAt: d.usedAt !== undefined ? new Date(d.usedAt) : undefined,
  };
}

function getCouponStatus(coupon: CouponPayload): CouponStatus {
  const now = Date.now();
  if (coupon.usedAt) return 'used';
  if (coupon.expiresAt.getTime() <= now) return 'expired';
  return 'active';
}

// ──────────────────────────────────────────────
// 1. 발송 자격 확인
// ──────────────────────────────────────────────

export async function isEligible(uid: string): Promise<boolean> {
  const result = await checkEligibility(uid);
  return result.eligible;
}

export async function checkEligibility(uid: string): Promise<EligibilityResult> {
  const db = getFirebaseDb();

  // 가입일 조회
  const userSnap = await getDoc(doc(db, 'users', uid));
  const userData = userSnap.exists() ? (userSnap.data() as Record<string, unknown>) : null;
  const createdAtMs =
    userData?.createdAt && typeof userData.createdAt === 'object' &&
    'toMillis' in (userData.createdAt as object)
      ? (userData.createdAt as { toMillis(): number }).toMillis()
      : (userData?.createdAt as number) ?? Date.now();

  const accountAgeMonths = msToMonths(Date.now() - createdAtMs);

  // 약속 이행률 조회
  const reviewsSnap = await getDocs(
    query(collection(db, 'reviews'), where('uid', '==', uid))
  );
  let totalPromises = 0;
  let keptPromises = 0;
  reviewsSnap.forEach((d) => {
    const data = d.data() as Record<string, unknown>;
    if (typeof data.promiseKept === 'boolean') {
      totalPromises++;
      if (data.promiseKept) keptPromises++;
    }
  });
  const promiseKeptRate = totalPromises > 0 ? keptPromises / totalPromises : 0;

  // 구독 상태 조회
  const subSnap = await getDoc(doc(db, 'subscriptions', uid));
  const subData = subSnap.exists() ? (subSnap.data() as Record<string, unknown>) : null;
  const isActiveSubscriber = subData?.isActive === true;

  const eligible =
    accountAgeMonths >= 5 &&
    promiseKeptRate >= 0.9 &&
    isActiveSubscriber;

  return {
    eligible,
    reasons: { accountAgeMonths, promiseKeptRate, isActiveSubscriber },
  };
}

// ──────────────────────────────────────────────
// 2. 쿠폰 발송 (마스터 전용)
// ──────────────────────────────────────────────

export async function sendCoupon(
  uid: string,
  coupon: Omit<CouponPayload, 'couponId' | 'expiresAt' | 'isVisible' | 'sentAt'>
): Promise<void> {
  const eligible = await isEligible(uid);
  if (!eligible) {
    throw new Error('발송 조건 미충족: 5개월/이행률 90%/활성 구독자 조건을 확인하세요.');
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // +30일

  const couponDoc: CouponDoc = {
    ...coupon,
    couponId: generateCouponId(),
    sentAt: now.getTime(),
    expiresAt: expiresAt.getTime(),
    isVisible: true, // 도착 시 아이콘 표시
    usedAt: undefined,
  };

  const db = getFirebaseDb();
  await setDoc(
    doc(db, 'users', uid, 'coupons', couponDoc.couponId),
    couponDoc
  );

  // 자녀에게 FCM 푸시 발송
  await notifyCouponReceived(uid, coupon.brand, coupon.value);

  // 자녀 isMinor && 부모 알림 설정 ON → 부모에게 알림
  if (coupon.isMinor) {
    const settings = await getRewardSettings(uid);
    if (settings.notifyParentOnCoupon) {
      const userSnap = await getDoc(doc(db, 'users', uid));
      const userData = userSnap.data() as Record<string, unknown> | undefined;
      const familyId = userData?.familyId as string | undefined;
      if (familyId) {
        await notifyParentCouponAlert(familyId, uid);
      }
    }
  }

  capture('coupon_sent', { brand: coupon.brand, value: coupon.value });
}

// ──────────────────────────────────────────────
// 3. 쿠폰 목록 조회
// ──────────────────────────────────────────────

export async function getCoupons(uid: string): Promise<CouponWithStatus[]> {
  const db = getFirebaseDb();
  const snap = await getDocs(collection(db, 'users', uid, 'coupons'));

  const coupons: CouponWithStatus[] = [];
  snap.forEach((d) => {
    const payload = docToPayload(d.data() as CouponDoc);
    coupons.push({ ...payload, status: getCouponStatus(payload) });
  });

  // 활성 먼저, 만료순 정렬
  return coupons.sort((a, b) => {
    if (a.status === 'active' && b.status !== 'active') return -1;
    if (a.status !== 'active' && b.status === 'active') return 1;
    return a.expiresAt.getTime() - b.expiresAt.getTime();
  });
}

// ──────────────────────────────────────────────
// 4. 활성 쿠폰 존재 여부 (선물함 아이콘 표시 결정)
// ──────────────────────────────────────────────

export async function hasActiveCoupons(uid: string): Promise<boolean> {
  const db = getFirebaseDb();
  const snap = await getDocs(collection(db, 'users', uid, 'coupons'));

  const now = Date.now();
  let found = false;
  snap.forEach((d) => {
    const couponDoc = d.data() as CouponDoc;
    if (
      couponDoc.isVisible &&
      !couponDoc.usedAt &&
      couponDoc.expiresAt > now
    ) {
      found = true;
    }
  });
  return found;
}

// ──────────────────────────────────────────────
// 5. 사용 완료 처리
// ──────────────────────────────────────────────

export async function markAsUsed(uid: string, couponId: string): Promise<void> {
  const db = getFirebaseDb();
  const couponRef = doc(db, 'users', uid, 'coupons', couponId);
  const snap = await getDoc(couponRef);
  if (!snap.exists()) throw new Error('쿠폰을 찾을 수 없습니다.');

  const couponDoc = snap.data() as CouponDoc;

  // 클라이언트 직접 쓰기 불가 → Functions callable
  const useCouponFn = httpsCallable<{ uid: string; couponId: string }, { success: boolean }>(
    getFirebaseFunctions(), 'useCoupon'
  );
  await useCouponFn({ uid, couponId });

  capture('coupon_used', { brand: couponDoc.brand, value: couponDoc.value });
}

// ──────────────────────────────────────────────
// 6. 만료 쿠폰 처리 (앱 실행 시 자동 호출)
// ──────────────────────────────────────────────

export async function checkAndExpireCoupons(uid: string): Promise<void> {
  // 클라이언트 직접 쓰기 불가 → Functions callable
  try {
    const expireFn = httpsCallable<{ uid: string }, { expired: number }>(
      getFirebaseFunctions(), 'expireCoupons'
    );
    const res = await expireFn({ uid });
    if ((res.data.expired ?? 0) > 0) {
      capture('coupon_expired');
    }
  } catch {
    // 네트워크 오류 시 무시 (다음 앱 시작 시 재시도)
  }
}

// ──────────────────────────────────────────────
// 7. 조건 충족 유저 목록 (마스터 전용)
// ──────────────────────────────────────────────

export async function getEligibleUsers(): Promise<string[]> {
  const db = getFirebaseDb();
  // 활성 구독자 전체 조회 후 나머지 조건 필터
  const subsSnap = await getDocs(
    query(collection(db, 'subscriptions'), where('isActive', '==', true))
  );

  const eligibleUids: string[] = [];
  const checks: Promise<void>[] = [];

  subsSnap.forEach((d) => {
    const uid = d.id;
    checks.push(
      isEligible(uid).then((eligible) => {
        if (eligible) eligibleUids.push(uid);
      })
    );
  });

  await Promise.all(checks);
  return eligibleUids;
}

// ──────────────────────────────────────────────
// 8. 알림 설정 관리 (자녀 전용)
// ──────────────────────────────────────────────

export async function getRewardSettings(uid: string): Promise<RewardSettings> {
  const db = getFirebaseDb();
  const snap = await getDoc(doc(db, 'users', uid, 'settings', 'reward'));
  if (!snap.exists()) {
    return { notifyParentOnCoupon: true }; // 기본값: ON
  }
  const data = snap.data() as Partial<RewardSettings>;
  return { notifyParentOnCoupon: data.notifyParentOnCoupon ?? true };
}

export async function updateRewardSettings(
  uid: string,
  settings: RewardSettings
): Promise<void> {
  const db = getFirebaseDb();
  await setDoc(
    doc(db, 'users', uid, 'settings', 'reward'),
    settings,
    { merge: true }
  );
  capture('reward_settings_changed', {
    notifyParent: settings.notifyParentOnCoupon,
  });
}
