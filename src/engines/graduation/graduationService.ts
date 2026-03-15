// ──────────────────────────────────────────────
// graduationService.ts — 성년 전환 오케스트레이션
// graduateToAdult() 래퍼 + 업적 해금 + 쿠폰 지급(옵션)
// DNA: 훈계/판단 금지, 축하 + 제안형만
// ──────────────────────────────────────────────

import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { getFirebaseDb } from '../../lib/firebase';
import { capture } from '../monitoring/posthogService';
import {
  graduateToAdult,
  calcAgeAtDate,
} from '../family/familyEnhanceService';

export interface GraduationResult {
  success: boolean;
  alreadyGraduated: boolean;
  achievementsUnlocked: string[];
  couponSent: boolean;
}

// ──────────────────────────────────────────────
// 성년 전환 플로우 실행
// celebrationEnabled: Remote Config graduation_celebration_enabled
// couponEnabled: Remote Config graduation_coupon_enabled
// ──────────────────────────────────────────────

export async function runGraduation(
  uid: string,
  birthYear: number,
  birthMonth: number,
  birthDay: number,
  options: {
    celebrationEnabled?: boolean;
    couponEnabled?: boolean;
  } = {}
): Promise<GraduationResult> {
  const age = calcAgeAtDate(birthYear, birthMonth, birthDay);

  if (age < 18) {
    return {
      success: false,
      alreadyGraduated: false,
      achievementsUnlocked: [],
      couponSent: false,
    };
  }

  // 이미 전환 여부 확인
  const snap = await getDoc(doc(getFirebaseDb(), 'users', uid));
  if (!snap.exists()) {
    return {
      success: false,
      alreadyGraduated: false,
      achievementsUnlocked: [],
      couponSent: false,
    };
  }

  const data = snap.data() as Record<string, unknown>;
  if (data.graduatedAt) {
    return {
      success: true,
      alreadyGraduated: true,
      achievementsUnlocked: [],
      couponSent: false,
    };
  }

  // 1. 성년 전환 실행
  await graduateToAdult(uid, birthYear, birthMonth, birthDay);

  // 2. graduation_achieved 업적 해금 기록
  const achievementsUnlocked: string[] = ['graduation_achieved'];

  await updateDoc(doc(getFirebaseDb(), 'users', uid), {
    graduationAchievements: achievementsUnlocked,
    graduationCelebrationShown: false,
    updatedAt: serverTimestamp(),
  }).catch(() => {});

  // 3. PostHog 이벤트
  capture('graduation_flow_completed', {
    uid,
    age,
    celebrationEnabled: options.celebrationEnabled ?? true,
    couponEnabled: options.couponEnabled ?? false,
    achievementsCount: achievementsUnlocked.length,
  });

  return {
    success: true,
    alreadyGraduated: false,
    achievementsUnlocked,
    couponSent: false, // 실제 쿠폰은 호출 측에서 sendCoupon() 별도 처리
  };
}

// ──────────────────────────────────────────────
// 축하 화면 표시 여부 확인 + 마킹
// ──────────────────────────────────────────────

export async function shouldShowCelebration(uid: string): Promise<boolean> {
  const snap = await getDoc(doc(getFirebaseDb(), 'users', uid));
  if (!snap.exists()) return false;

  const data = snap.data() as Record<string, unknown>;
  return (
    !!data.graduatedAt && data.graduationCelebrationShown === false
  );
}

export async function markCelebrationShown(uid: string): Promise<void> {
  await updateDoc(doc(getFirebaseDb(), 'users', uid), {
    graduationCelebrationShown: true,
  }).catch(() => {});
}

// ──────────────────────────────────────────────
// 나이 검사 (UI 사전 체크용)
// ──────────────────────────────────────────────

export function isGraduationEligible(
  birthYear: number,
  birthMonth: number,
  birthDay: number
): boolean {
  return calcAgeAtDate(birthYear, birthMonth, birthDay) >= 18;
}
