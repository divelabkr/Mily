// ──────────────────────────────────────────────
// agreementLoopService.ts — 가족 합의 6단계 루프
// 요청→반려→재제안→조건부승인→완료→회고
// withGateChain 래핑 필수
// ──────────────────────────────────────────────

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  Timestamp,
} from 'firebase/firestore';
import { getFirebaseDb } from '../../lib/firebase';
import { withGateChain } from '../../dae/withGateChain';
import { filterDna } from '../message/dnaFilter';

// ── 타입 ──────────────────────────────────────

export type AgreementStage =
  | 'request'      // 1. 요청
  | 'declined'     // 2. 반려
  | 'counter'      // 3. 재제안
  | 'conditional'  // 4. 조건부 승인
  | 'completed'    // 5. 완료
  | 'reflect';     // 6. 회고

export interface AgreementCondition {
  type: 'monthly_limit' | 'promise_first' | 'custom';
  description: string;
}

export interface AgreementReflection {
  childNote?: string;
  parentNote?: string;
  recordedAt: number;
}

export interface AgreementLoop {
  id: string;
  familyId: string;
  childUid: string;
  parentUid: string;
  requestCardId: string;
  stage: AgreementStage;
  // 재제안 데이터
  counterProposal?: {
    amount?: number;
    condition?: AgreementCondition;
    proposedAt: number;
  };
  // 조건부 승인
  conditions?: AgreementCondition[];
  childAccepted?: boolean;
  parentAccepted?: boolean;
  // 완료/회고
  reflection?: AgreementReflection;
  completedAt?: number;
  createdAt: number;
  updatedAt: number;
}

// ── 상태 머신 전이 규칙 ────────────────────────

const VALID_TRANSITIONS: Record<AgreementStage, AgreementStage[]> = {
  request:     ['declined', 'conditional', 'completed'],
  declined:    ['counter'],
  counter:     ['declined', 'conditional', 'completed'],
  conditional: ['completed', 'declined'],
  completed:   ['reflect'],
  reflect:     [],
};

export function canTransition(from: AgreementStage, to: AgreementStage): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

// ── 레이블 ────────────────────────────────────

export const STAGE_LABELS: Record<AgreementStage, string> = {
  request:     '요청',
  declined:    '반려',
  counter:     '재제안',
  conditional: '조건부 승인',
  completed:   '완료',
  reflect:     '회고',
};

// ── Firestore CRUD ────────────────────────────

const LOOPS_COLLECTION = 'agreement_loops';

export const createAgreementLoop = withGateChain(
  async (input: Omit<AgreementLoop, 'id' | 'stage' | 'createdAt' | 'updatedAt'>): Promise<AgreementLoop> => {
    const db = getFirebaseDb();
    const ref = doc(collection(db, LOOPS_COLLECTION));
    const now = Date.now();
    const loop: AgreementLoop = {
      ...input,
      id: ref.id,
      stage: 'request',
      createdAt: now,
      updatedAt: now,
    };
    await setDoc(ref, loop);
    return loop;
  }
);

export const transitionStage = withGateChain(
  async (
    loopId: string,
    to: AgreementStage,
    payload?: Partial<AgreementLoop>
  ): Promise<AgreementLoop> => {
    const db = getFirebaseDb();
    const ref = doc(db, LOOPS_COLLECTION, loopId);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error(`합의 루프를 찾을 수 없어요: ${loopId}`);

    const current = snap.data() as AgreementLoop;
    if (!canTransition(current.stage, to)) {
      throw new Error(`${current.stage} → ${to} 전이는 허용되지 않아요`);
    }

    const updates: Partial<AgreementLoop> = {
      stage: to,
      updatedAt: Date.now(),
      ...payload,
    };

    // 완료 시점 기록
    if (to === 'completed') {
      updates.completedAt = Date.now();
    }

    await updateDoc(ref, updates);
    return { ...current, ...updates };
  }
);

export const addReflection = withGateChain(
  async (
    loopId: string,
    reflection: AgreementReflection
  ): Promise<void> => {
    // DNA 필터: 회고 메모 검증
    if (reflection.childNote) {
      const r = filterDna(reflection.childNote);
      if (!r.passed) throw new Error('DNA 위반 (응답 무효): ' + r.violations.map(v => v.matched).join(', '));
    }
    if (reflection.parentNote) {
      const r = filterDna(reflection.parentNote);
      if (!r.passed) throw new Error('DNA 위반 (응답 무효): ' + r.violations.map(v => v.matched).join(', '));
    }

    const db = getFirebaseDb();
    const ref = doc(db, LOOPS_COLLECTION, loopId);
    await updateDoc(ref, {
      reflection,
      stage: 'reflect' as AgreementStage,
      updatedAt: Date.now(),
    });
  }
);

export async function getActiveLoops(familyId: string): Promise<AgreementLoop[]> {
  const db = getFirebaseDb();
  const q = query(
    collection(db, LOOPS_COLLECTION),
    where('familyId', '==', familyId),
    where('stage', 'not-in', ['reflect'])
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as AgreementLoop);
}

export async function getLoopByRequestCard(requestCardId: string): Promise<AgreementLoop | null> {
  const db = getFirebaseDb();
  const q = query(
    collection(db, LOOPS_COLLECTION),
    where('requestCardId', '==', requestCardId)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return snap.docs[0].data() as AgreementLoop;
}
