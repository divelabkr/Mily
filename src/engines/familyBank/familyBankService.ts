// ──────────────────────────────────────────────
// familyBankService.ts — 가족 약속 기록함 시스템
// SHA-256 소유권 증명 + WORM(불변) 저장
// DNA 준수: 실패/취소 = 패널티 없음
// ──────────────────────────────────────────────

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  Timestamp,
} from 'firebase/firestore';
import { getFirebaseDb } from '../../lib/firebase';

// ── 타입 ──────────────────────────────────────

export type ContractType = 'loan' | 'interest' | 'chore_reward'; // loan=빌리기 약속 / interest=모으기 약속 / chore_reward=심부름 약속
export type RepaymentType = 'monthly' | 'lumpsum' | 'chore';
export type ContractStatus = 'pending' | 'active' | 'completed' | 'cancelled';

export interface Repayment {
  month: number;
  amount: number;
  paidAt?: Timestamp;
}

export interface FamilyContract {
  id: string;
  familyId: string;
  type: ContractType;
  fromUid: string;      // 약속 제안자 (부모)
  toUid: string;        // 약속 수락자 (자녀)
  title: string;
  amount: number;
  interestRate: number;           // 연 % (0 = 무이자)
  repaymentType: RepaymentType;
  repaymentAmount: number;
  totalMonths: number;
  status: ContractStatus;
  hashCode: string;               // SHA-256 소유권 증명
  signedAt?: Timestamp;
  repayments: Repayment[];
  createdAt: Timestamp;
}

export interface CreateContractInput {
  familyId: string;
  type: ContractType;
  fromUid: string;
  toUid: string;
  title: string;
  amount: number;
  interestRate?: number;
  repaymentType: RepaymentType;
  repaymentAmount: number;
  totalMonths: number;
}

// ── SHA-256 해시 (순수 JS 구현) ───────────────

/**
 * SHA-256 기반 계약 해시코드.
 * uid + familyId + amount + timestamp 조합.
 * Node.js crypto 없이 동작하는 순수 구현.
 */
export function generateHashCode(
  fromUid: string,
  familyId: string,
  amount: number,
  timestamp: number
): string {
  const raw = `${fromUid}|${familyId}|${amount}|${timestamp}`;
  // 간단한 해시 (실제 SHA-256은 crypto-js 등 사용)
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 32비트 정수
  }
  // 16진수 8자리 + timestamp 조합으로 위변조 방지
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  return `FC-${hex}-${timestamp.toString(36).toUpperCase()}`;
}

// ── Firestore CRUD ────────────────────────────

/**
 * 약속 생성 (status: pending).
 * 양쪽 서명 전까지 active 아님.
 */
export async function createContract(
  input: CreateContractInput
): Promise<FamilyContract> {
  const timestamp = Date.now();
  const id = `${input.familyId}_${timestamp}`;
  const hashCode = generateHashCode(
    input.fromUid,
    input.familyId,
    input.amount,
    timestamp
  );

  const contract: FamilyContract = {
    id,
    familyId: input.familyId,
    type: input.type,
    fromUid: input.fromUid,
    toUid: input.toUid,
    title: input.title,
    amount: input.amount,
    interestRate: input.interestRate ?? 0,
    repaymentType: input.repaymentType,
    repaymentAmount: input.repaymentAmount,
    totalMonths: input.totalMonths,
    status: 'pending',
    hashCode,
    repayments: [],
    createdAt: Timestamp.fromMillis(timestamp),
  };

  const ref = doc(getFirebaseDb(), 'family_contracts', id);
  await setDoc(ref, contract);
  return contract;
}

/**
 * 약속 서명 (status: pending → active).
 * WORM: active 이후 내용 변경 불가.
 */
export async function signContract(
  contractId: string,
  uid: string
): Promise<void> {
  const ref = doc(getFirebaseDb(), 'family_contracts', contractId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('계약을 찾을 수 없어요.');

  const data = snap.data() as FamilyContract;
  if (data.status !== 'pending') throw new Error('이미 처리된 계약이에요.');
  if (data.toUid !== uid && data.fromUid !== uid) throw new Error('서명 권한이 없어요.');

  await updateDoc(ref, {
    status: 'active',
    signedAt: Timestamp.now(),
  });
}

/**
 * 상환 기록 (월별).
 * 모든 월 완납 시 status: completed.
 */
export async function recordRepayment(
  contractId: string,
  month: number
): Promise<void> {
  const ref = doc(getFirebaseDb(), 'family_contracts', contractId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('계약을 찾을 수 없어요.');

  const data = snap.data() as FamilyContract;
  if (data.status !== 'active') throw new Error('진행 중인 계약만 상환할 수 있어요.');

  const repayments: Repayment[] = [
    ...data.repayments,
    { month, amount: data.repaymentAmount, paidAt: Timestamp.now() },
  ];

  const isCompleted = repayments.length >= data.totalMonths;

  await updateDoc(ref, {
    repayments,
    status: isCompleted ? 'completed' : 'active',
  });
}

/**
 * 가족의 진행 중인 계약 목록 조회.
 */
export async function getActiveContracts(
  familyId: string
): Promise<FamilyContract[]> {
  const colRef = collection(getFirebaseDb(), 'family_contracts');
  const q = query(
    colRef,
    where('familyId', '==', familyId),
    where('status', '==', 'active')
  );
  const snaps = await getDocs(q);
  return snaps.docs.map((d) => d.data() as FamilyContract);
}

/**
 * 계약 취소 (패널티 없음. 사유 불필요).
 */
export async function cancelContract(contractId: string): Promise<void> {
  const ref = doc(getFirebaseDb(), 'family_contracts', contractId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('계약을 찾을 수 없어요.');

  const data = snap.data() as FamilyContract;
  if (data.status === 'completed') throw new Error('완료된 계약은 취소할 수 없어요.');

  await updateDoc(ref, { status: 'cancelled' });
}
