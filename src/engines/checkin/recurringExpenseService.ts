// ──────────────────────────────────────────────
// recurringExpenseService.ts — 반복 지출 템플릿
// 반자동: autoRecord=false 항상. 항상 "기록할까요?" 확인.
// spendType=choice 절대 금지 (고정/생활만).
// ──────────────────────────────────────────────

import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { getFirebaseDb } from '../../lib/firebase';
import { CategoryId, DEFAULT_CATEGORIES } from '../plan/defaultCategories';
import { saveCheckIn } from './checkinService';
import { CheckIn } from './checkinStore';
import { getWeekId } from '../../utils/dateUtils';

export type RecurringSpendType = 'fixed' | 'living'; // choice 절대 금지

export interface RecurringExpense {
  id: string;
  uid: string;
  categoryId: CategoryId;
  amount: number;
  spendType: RecurringSpendType;
  label: string;           // 사용자 정의 이름 (e.g., "카카오TV")
  memo?: string;
  autoRecord: false;       // 항상 false — 자동 기록 절대 없음
  createdAt: number;
}

// ──────────────────────────────────────────────
// 유효성 검사
// ──────────────────────────────────────────────

export class RecurringExpenseValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RecurringExpenseValidationError';
  }
}

export function validateRecurringExpense(
  params: Omit<RecurringExpense, 'id' | 'createdAt' | 'autoRecord'>
): void {
  if ((params.spendType as string) === 'choice') {
    throw new RecurringExpenseValidationError(
      '반복 지출에는 선택(choice) 지출유형을 사용할 수 없어요. 고정비 또는 생활비만 가능해요.'
    );
  }
  if (!params.label.trim()) {
    throw new RecurringExpenseValidationError('반복 지출 이름을 입력해주세요.');
  }
  if (params.amount <= 0) {
    throw new RecurringExpenseValidationError('금액은 0보다 커야 해요.');
  }
}

// ──────────────────────────────────────────────
// 템플릿 생성
// ──────────────────────────────────────────────

export async function createRecurringExpense(
  params: Omit<RecurringExpense, 'id' | 'createdAt' | 'autoRecord'>
): Promise<RecurringExpense> {
  validateRecurringExpense(params);

  const colRef = collection(getFirebaseDb(), 'recurring_expenses', params.uid, 'templates');
  const docRef = await addDoc(colRef, {
    ...params,
    autoRecord: false,
    createdAt: serverTimestamp(),
  });

  return {
    ...params,
    id: docRef.id,
    autoRecord: false,
    createdAt: Date.now(),
  };
}

// ──────────────────────────────────────────────
// 템플릿 목록 조회
// ──────────────────────────────────────────────

export async function loadRecurringExpenses(
  uid: string
): Promise<RecurringExpense[]> {
  try {
    const colRef = collection(getFirebaseDb(), 'recurring_expenses', uid, 'templates');
    const snaps = await getDocs(colRef);
    return snaps.docs.map((d) => ({
      ...(d.data() as Omit<RecurringExpense, 'id'>),
      id: d.id,
    }));
  } catch {
    return [];
  }
}

// ──────────────────────────────────────────────
// 템플릿 삭제
// ──────────────────────────────────────────────

export async function deleteRecurringExpense(
  uid: string,
  templateId: string
): Promise<void> {
  const ref = doc(getFirebaseDb(), 'recurring_expenses', uid, 'templates', templateId);
  await deleteDoc(ref);
}

// ──────────────────────────────────────────────
// "기록할까요?" 확인 메시지 생성
// 확인은 항상 UI에서. 여기선 메시지만 생성.
// ──────────────────────────────────────────────

export function buildConfirmMessage(template: RecurringExpense): string {
  const catLabel =
    DEFAULT_CATEGORIES.find((c) => c.id === template.categoryId)?.label ??
    template.categoryId;
  const amountStr = template.amount.toLocaleString();
  return `"${template.label}" ${catLabel} ${amountStr}원을 이번 주 기록에 추가할까요?`;
}

// ──────────────────────────────────────────────
// 템플릿 → 체크인 기록 (확인 후 호출)
// ──────────────────────────────────────────────

export async function applyRecurringTemplate(
  template: RecurringExpense
): Promise<CheckIn> {
  return saveCheckIn({
    uid: template.uid,
    weekId: getWeekId(),
    categoryId: template.categoryId,
    amount: template.amount,
    spendType: template.spendType,
    memo: template.memo,
  });
}
