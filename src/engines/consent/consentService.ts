import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { getFirebaseDb } from '../../lib/firebase';

export interface Consent {
  consentId: string;
  guardianUid: string;
  childUid: string;
  childName: string;
  birthYear: number;
  consentedAt: unknown; // serverTimestamp
  method: 'in_app' | 'email';
}

// ──────────────────────────────────────────────
// 14세 미만 판별
// ──────────────────────────────────────────────

export function isUnder14(birthYear: number): boolean {
  return new Date().getFullYear() - birthYear < 14;
}

// ──────────────────────────────────────────────
// 법정대리인 동의 생성
// ──────────────────────────────────────────────

export async function createConsent(
  guardianUid: string,
  childUid: string,
  childName: string,
  birthYear: number
): Promise<Consent> {
  const consentId = `consent_${childUid}_${Date.now()}`;

  const consent: Consent = {
    consentId,
    guardianUid,
    childUid,
    childName,
    birthYear,
    consentedAt: serverTimestamp(),
    method: 'in_app',
  };

  await setDoc(doc(getFirebaseDb(), 'consents', consentId), consent);
  return consent;
}

// ──────────────────────────────────────────────
// 동의 여부 확인
// ──────────────────────────────────────────────

export async function hasConsent(childUid: string): Promise<boolean> {
  // 간단한 구현: users/{childUid}의 consentId 필드 확인
  const userSnap = await getDoc(doc(getFirebaseDb(), 'users', childUid));
  if (!userSnap.exists()) return false;
  const data = userSnap.data();
  return !!data.consentId;
}
