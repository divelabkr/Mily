import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { getFirebaseDb } from '../../lib/firebase';

export type ConsentNotifyMethod = 'email' | 'sms' | 'in_app';

export interface Consent {
  consentId: string;
  guardianUid: string;
  childUid: string;
  childName: string;
  birthYear: number;
  consentedAt: unknown; // serverTimestamp
  method: ConsentNotifyMethod;
  guardianContact?: string; // 이메일 또는 전화번호
}

export interface GuardianConsentRequest {
  childName: string;
  birthYear: number;
  guardianContact: string; // 이메일 또는 E.164 전화번호 (+8210XXXXXXXX)
  notifyMethod: ConsentNotifyMethod;
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
  const userSnap = await getDoc(doc(getFirebaseDb(), 'users', childUid));
  if (!userSnap.exists()) return false;
  const data = userSnap.data();
  return !!data.consentId;
}

// ──────────────────────────────────────────────
// 법정대리인 동의 알림 요청 (이메일 / SMS)
// 실제 발송은 Cloud Functions를 통해 처리.
// 클라이언트는 Firestore에 요청 레코드만 저장.
// ──────────────────────────────────────────────

export interface ConsentRequestRecord {
  requestId: string;
  childUid: string;
  childName: string;
  birthYear: number;
  guardianContact: string;
  notifyMethod: ConsentNotifyMethod;
  status: 'pending' | 'sent' | 'confirmed';
  createdAt: unknown;
}

/**
 * 법정대리인에게 동의 알림을 요청한다.
 * Firestore에 consent_requests/{requestId} 저장 →
 * Functions 트리거가 이메일/SMS 발송.
 */
export async function requestGuardianConsent(
  childUid: string,
  req: GuardianConsentRequest
): Promise<ConsentRequestRecord> {
  const requestId = `creq_${childUid}_${Date.now()}`;

  const record: ConsentRequestRecord = {
    requestId,
    childUid,
    childName: req.childName,
    birthYear: req.birthYear,
    guardianContact: req.guardianContact,
    notifyMethod: req.notifyMethod,
    status: 'pending',
    createdAt: serverTimestamp(),
  };

  await setDoc(
    doc(getFirebaseDb(), 'consent_requests', requestId),
    record
  );

  return record;
}

/**
 * 이메일/전화번호 형식 유효성 검사 헬퍼.
 */
export function isValidGuardianEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidGuardianPhone(phone: string): boolean {
  // E.164 형식: +8210XXXXXXXX 또는 010XXXXXXXX (국내)
  return /^(\+82|0)1[0-9]{8,9}$/.test(phone.replace(/[-\s]/g, ''));
}
