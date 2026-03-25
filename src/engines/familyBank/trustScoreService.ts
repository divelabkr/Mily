// ──────────────────────────────────────────────
// trustScoreService.ts — 신뢰 점수 시스템
// 레벨만 표시. 하락 없음. 숫자 미노출.
// DNA 준수: 실패 = 패널티 없음. 상승만.
// ──────────────────────────────────────────────

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  arrayUnion,
} from 'firebase/firestore';
import { getFirebaseDb } from '../../lib/firebase';

// ── 타입 ──────────────────────────────────────

export type TrustLevel = 1 | 2 | 3 | 4;

export type TrustEventType =
  | 'promise_kept'          // 약속 이행 +10
  | 'repayment_complete'    // 상환 완료 +20
  | 'savings_matured'       // 적금 만기 +15
  | 'praise_received'       // 칭찬카드 수신 +5
  | 'contract_cancelled';   // 계약 취소 (점수 변동 없음 — DNA 원칙)

export interface TrustEvent {
  type: TrustEventType;
  delta: number;          // 점수 변동량 (항상 >= 0)
  description: string;
  occurredAt: number;     // ms timestamp
}

export interface TrustScore {
  uid: string;
  score: number;
  level: TrustLevel;
  history: TrustEvent[];
}

// ── 점수 규칙 ──────────────────────────────────

const EVENT_DELTAS: Record<TrustEventType, number> = {
  promise_kept: 10,
  repayment_complete: 20,
  savings_matured: 15,
  praise_received: 5,
  contract_cancelled: 0,   // 패널티 없음
};

const EVENT_DESCRIPTIONS: Record<TrustEventType, string> = {
  promise_kept: '약속을 지켰어요',
  repayment_complete: '상환을 완료했어요',
  savings_matured: '적금 만기를 달성했어요',
  praise_received: '칭찬 카드를 받았어요',
  contract_cancelled: '계약이 취소됐어요 (영향 없음)',
};

// ── 레벨 계산 ──────────────────────────────────

const LEVEL_THRESHOLDS: { min: number; level: TrustLevel; loanLimit: number }[] = [
  { min: 200, level: 4, loanLimit: 100_000 },
  { min: 100, level: 3, loanLimit: 50_000 },
  { min: 50,  level: 2, loanLimit: 30_000 },
  { min: 0,   level: 1, loanLimit: 10_000 },
];

export function getLevel(score: number): TrustLevel {
  for (const { min, level } of LEVEL_THRESHOLDS) {
    if (score >= min) return level;
  }
  return 1;
}

export function getLoanLimitByScore(score: number): number {
  for (const { min, loanLimit } of LEVEL_THRESHOLDS) {
    if (score >= min) return loanLimit;
  }
  return 10_000;
}

// ── 레벨 설명 (숫자 숨김) ───────────────────────

export interface LevelInfo {
  level: TrustLevel;
  label: string;
  description: string;
  loanLimit: number;
  perks: string[];
}

export const LEVEL_INFO: Record<TrustLevel, LevelInfo> = {
  1: {
    level: 1,
    label: '새싹 🌱',
    description: '밀리 패밀리뱅크를 시작했어요!',
    loanLimit: 10_000,
    perks: ['소액 가족 대출 가능'],
  },
  2: {
    level: 2,
    label: '성장 🌿',
    description: '약속을 꾸준히 지켜오고 있어요.',
    loanLimit: 30_000,
    perks: ['대출 한도 증가', '이자율 협상 가능'],
  },
  3: {
    level: 3,
    label: '신뢰 🌳',
    description: '가족 모두가 믿는 든든한 구성원이에요.',
    loanLimit: 50_000,
    perks: ['대출 한도 추가 증가', '무이자 신청 가능'],
  },
  4: {
    level: 4,
    label: '전설 🏆',
    description: '밀리 패밀리뱅크의 레전드예요!',
    loanLimit: 100_000,
    perks: ['최대 한도', '자유 약정 설계 가능'],
  },
};

// ── Firestore CRUD ────────────────────────────

const TRUST_SCORES_COLLECTION = 'trust_scores';

/**
 * 신뢰 점수 조회 (없으면 초기값 생성).
 */
export async function getScore(uid: string): Promise<TrustScore> {
  const ref = doc(getFirebaseDb(), TRUST_SCORES_COLLECTION, uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    const initial: TrustScore = {
      uid,
      score: 0,
      level: 1,
      history: [],
    };
    await setDoc(ref, initial);
    return initial;
  }

  return snap.data() as TrustScore;
}

/**
 * 이벤트 발생 → 점수 누적 (항상 증가, 절대 감소 없음).
 */
export async function addEvent(
  uid: string,
  eventType: TrustEventType
): Promise<TrustScore> {
  const current = await getScore(uid);
  const delta = EVENT_DELTAS[eventType];

  const event: TrustEvent = {
    type: eventType,
    delta,
    description: EVENT_DESCRIPTIONS[eventType],
    occurredAt: Date.now(),
  };

  const newScore = current.score + delta;
  const newLevel = getLevel(newScore);

  const ref = doc(getFirebaseDb(), TRUST_SCORES_COLLECTION, uid);
  await updateDoc(ref, {
    score: newScore,
    level: newLevel,
    history: arrayUnion(event),
  });

  return { ...current, score: newScore, level: newLevel, history: [...current.history, event] };
}

/**
 * 현재 대출 한도 조회 (레벨 기반).
 */
export async function getLoanLimit(uid: string): Promise<number> {
  const trust = await getScore(uid);
  return getLoanLimitByScore(trust.score);
}

/**
 * 레벨 정보 조회 (UI 표시용).
 */
export function getLevelInfo(level: TrustLevel): LevelInfo {
  return LEVEL_INFO[level];
}
