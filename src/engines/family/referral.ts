import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { getFirebaseDb } from '../../lib/firebase';
import { useBillingStore } from '../billing/billingStore';
import { Events } from '../analytics/analyticsService';

const REFERRAL_BONUS_DAYS = 7;

export interface ReferralRecord {
  referralCode: string;
  ownerUid: string;
  acceptedByUid?: string;
  acceptedAt?: unknown;
  bonusAppliedAt?: unknown;
}

// ──────────────────────────────────────────────
// 추천 코드 생성 (부모)
// ──────────────────────────────────────────────

export function generateReferralCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function createReferralCode(ownerUid: string): Promise<string> {
  const code = generateReferralCode();
  await setDoc(doc(getFirebaseDb(), 'referrals', code), {
    referralCode: code,
    ownerUid,
    createdAt: serverTimestamp(),
  });
  await Events.referralSent();
  return code;
}

// ──────────────────────────────────────────────
// 추천 코드 수락 → 초대자에게 Plus 7일 연장
// ──────────────────────────────────────────────

export async function acceptReferral(
  code: string,
  acceptorUid: string
): Promise<boolean> {
  const snap = await getDoc(doc(getFirebaseDb(), 'referrals', code));
  if (!snap.exists()) return false;

  const record = snap.data() as ReferralRecord;
  if (record.acceptedByUid) return false; // 이미 사용됨

  await updateDoc(doc(getFirebaseDb(), 'referrals', code), {
    acceptedByUid: acceptorUid,
    acceptedAt: serverTimestamp(),
    bonusAppliedAt: serverTimestamp(),
  });

  // 초대자(ownerUid)에게 Plus 7일 연장 적용
  useBillingStore.getState().applyReferralBonus(REFERRAL_BONUS_DAYS);
  await Events.referralAccepted();
  return true;
}
