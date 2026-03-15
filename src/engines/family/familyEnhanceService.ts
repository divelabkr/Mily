// ──────────────────────────────────────────────
// familyEnhanceService.ts — 부모 2명 + 성년 전환 + 소프트 연결 변경
// 통제감/감시감 표현 금지, "해제" 대신 "변경"
// ──────────────────────────────────────────────

import {
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  serverTimestamp,
} from 'firebase/firestore';
import { getFirebaseDb } from '../../lib/firebase';
import { capture } from '../monitoring/posthogService';
import { useFamilyStore } from './familyStore';
import type { Family } from './familyStore';

const DISCONNECT_DELAY_MS = 7 * 24 * 60 * 60 * 1000; // 7일 유예

// ──────────────────────────────────────────────
// 가족 문서 (parentUids 배열 지원 + 하위 호환)
// ──────────────────────────────────────────────

export interface FamilyDoc extends Family {
  parentUids?: string[];          // 최대 2명 (신규 필드)
  disconnectScheduledAt?: number;  // 연결 변경 예정 타임스탬프
  disconnectRequestedBy?: string;  // 요청자 uid
}

function getParentUids(family: FamilyDoc): string[] {
  if (family.parentUids && family.parentUids.length > 0) {
    return family.parentUids;
  }
  // 하위 호환: 기존 ownerUid → parentUids[0]
  return family.ownerUid ? [family.ownerUid] : [];
}

// ──────────────────────────────────────────────
// 1. 부모 2명 추가 (최대 2명)
// ──────────────────────────────────────────────

export async function addParent(
  familyId: string,
  newParentUid: string
): Promise<void> {
  const snap = await getDoc(doc(getFirebaseDb(), 'families', familyId));
  if (!snap.exists()) throw new Error('가족을 찾을 수 없어요');

  const family = snap.data() as FamilyDoc;
  const currentParents = getParentUids(family);

  if (currentParents.includes(newParentUid)) {
    return; // 이미 부모
  }
  if (currentParents.length >= 2) {
    throw new Error('부모는 최대 2명까지 연결할 수 있어요');
  }

  const updatedParents = [...currentParents, newParentUid];
  await updateDoc(doc(getFirebaseDb(), 'families', familyId), {
    parentUids: updatedParents,
    memberUids: arrayUnion(newParentUid),
  });
}

// ──────────────────────────────────────────────
// 2. 성년 전환 (만 18세 이상, Asia/Seoul 기준)
// ──────────────────────────────────────────────

export function calcAgeAtDate(birthYear: number, birthMonth: number, birthDay: number): number {
  // UTC 기준으로 한국 오프셋(+9) 적용하여 현재 날짜 계산
  const nowUtc = Date.now() + 9 * 60 * 60 * 1000;
  const d = new Date(nowUtc);
  const todayYear = d.getUTCFullYear();
  const todayMonth = d.getUTCMonth() + 1;
  const todayDay = d.getUTCDate();

  let age = todayYear - birthYear;
  if (
    todayMonth < birthMonth ||
    (todayMonth === birthMonth && todayDay < birthDay)
  ) {
    age -= 1;
  }
  return age;
}

export async function graduateToAdult(
  uid: string,
  birthYear: number,
  birthMonth: number,
  birthDay: number
): Promise<void> {
  // 나이 확인은 Firestore 조회 전에 먼저
  const age = calcAgeAtDate(birthYear, birthMonth, birthDay);
  if (age < 18) {
    throw new Error('만 18세 이상만 성년 전환이 가능해요');
  }

  const snap = await getDoc(doc(getFirebaseDb(), 'users', uid));
  if (!snap.exists()) throw new Error('유저를 찾을 수 없어요');

  const data = snap.data() as Record<string, unknown>;
  if (data.graduatedAt) {
    return; // 이미 전환됨 (중복 방지)
  }

  await updateDoc(doc(getFirebaseDb(), 'users', uid), {
    graduatedAt: serverTimestamp(),
    role: 'individual',
  });

  capture('graduation_triggered', {
    daysUsed: 0, // 실제 사용일수는 호출 측에서 계산
    achievementCount: 0,
  });
}

// ──────────────────────────────────────────────
// 3. 소프트 연결 변경 예약 (7일 유예)
// "해제" 대신 "변경" — 통제감 최소화
// ──────────────────────────────────────────────

export async function scheduleDisconnect(
  familyId: string,
  requestedByUid: string
): Promise<void> {
  const scheduledAt = Date.now() + DISCONNECT_DELAY_MS;

  await updateDoc(doc(getFirebaseDb(), 'families', familyId), {
    disconnectScheduledAt: scheduledAt,
    disconnectRequestedBy: requestedByUid,
  });

  // 로컬 스토어 갱신
  const current = useFamilyStore.getState().family;
  if (current) {
    useFamilyStore.getState().setFamily({
      ...current,
      disconnectScheduledAt: scheduledAt,
      disconnectRequestedBy: requestedByUid,
    } as FamilyDoc);
  }

  capture('family_disconnect_scheduled');
}

// ──────────────────────────────────────────────
// 4. 연결 변경 취소
// ──────────────────────────────────────────────

export async function cancelDisconnect(familyId: string): Promise<void> {
  const snap = await getDoc(doc(getFirebaseDb(), 'families', familyId));
  if (!snap.exists()) return;

  const family = snap.data() as FamilyDoc & Record<string, unknown>;

  // disconnectScheduledAt, disconnectRequestedBy 필드 삭제
  const { disconnectScheduledAt: _1, disconnectRequestedBy: _2, ...rest } = family;
  await updateDoc(doc(getFirebaseDb(), 'families', familyId), {
    disconnectScheduledAt: null,
    disconnectRequestedBy: null,
  });

  void _1; void _2; void rest; // unused vars suppression

  const current = useFamilyStore.getState().family;
  if (current) {
    const updated = { ...current } as Partial<FamilyDoc>;
    delete updated.disconnectScheduledAt;
    delete updated.disconnectRequestedBy;
    useFamilyStore.getState().setFamily(updated as Family);
  }

  capture('family_disconnect_cancelled');
}

// ──────────────────────────────────────────────
// 5. D-N 계산 (배너 표시용)
// ──────────────────────────────────────────────

export function getDaysUntilDisconnect(scheduledAt: number): number {
  const ms = scheduledAt - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}
