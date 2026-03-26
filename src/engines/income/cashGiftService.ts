// ──────────────────────────────────────────────
// cashGiftService.ts — 세뱃돈/명절돈 모드
// 현금 수기 입력. 할머니/친척 초대(선택).
// withGateChain 래핑
// ──────────────────────────────────────────────

import {
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  where,
  Timestamp,
} from 'firebase/firestore';
import { getFirebaseDb } from '../../lib/firebase';
import { withGateChain } from '../../dae/withGateChain';

// ── 타입 ──────────────────────────────────────

export type CashGiftOccasion =
  | 'new_year'      // 설날 세뱃돈
  | 'chuseok'       // 추석
  | 'birthday'      // 생일
  | 'graduation'    // 졸업
  | 'other';        // 기타 명절/이벤트

export interface CashGiftEntry {
  id: string;
  uid: string;
  familyId: string;
  occasion: CashGiftOccasion;
  amount: number;
  fromName?: string;   // 주신 분 이름 (선택)
  memo?: string;
  // 사용 계획 (선택)
  planSave?: number;    // 저금할 금액
  planSpend?: number;   // 쓸 금액
  planGive?: number;    // 나눌 금액
  recordedAt: number;
}

export const OCCASION_LABELS: Record<CashGiftOccasion, string> = {
  new_year:   '설날 세뱃돈',
  chuseok:    '추석 용돈',
  birthday:   '생일 선물',
  graduation: '졸업 축하금',
  other:      '특별 용돈',
};

export const OCCASION_EMOJIS: Record<CashGiftOccasion, string> = {
  new_year:   '🎎',
  chuseok:    '🌕',
  birthday:   '🎂',
  graduation: '🎓',
  other:      '🎁',
};

// ── 명절 시즌 감지 ─────────────────────────────

/**
 * 현재 날짜 기준 명절 시즌 여부 판단.
 * 설날: 1~2월 / 추석: 9~10월 주변.
 */
export function detectCurrentOccasion(): CashGiftOccasion | null {
  const month = new Date().getMonth() + 1; // 1-12
  if (month === 1 || month === 2) return 'new_year';
  if (month === 9 || month === 10) return 'chuseok';
  return null;
}

// ── CRUD ──────────────────────────────────────

const COLLECTION = 'cash_gifts';

export const recordCashGift = withGateChain(
  async (input: Omit<CashGiftEntry, 'id' | 'recordedAt'>): Promise<CashGiftEntry> => {
    const db = getFirebaseDb();
    const ref = doc(collection(db, COLLECTION));
    const entry: CashGiftEntry = {
      ...input,
      id: ref.id,
      recordedAt: Date.now(),
    };
    await setDoc(ref, entry);
    return entry;
  }
);

export async function getCashGifts(uid: string): Promise<CashGiftEntry[]> {
  const db = getFirebaseDb();
  const q = query(collection(db, COLLECTION), where('uid', '==', uid));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as CashGiftEntry).sort((a, b) => b.recordedAt - a.recordedAt);
}

export async function getCashGiftsByOccasion(uid: string, occasion: CashGiftOccasion): Promise<CashGiftEntry[]> {
  const db = getFirebaseDb();
  const q = query(
    collection(db, COLLECTION),
    where('uid', '==', uid),
    where('occasion', '==', occasion)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as CashGiftEntry);
}

/**
 * 총 세뱃돈 합계 (이번 회차 기준).
 */
export function sumCashGifts(gifts: CashGiftEntry[]): number {
  return gifts.reduce((sum, g) => sum + g.amount, 0);
}
