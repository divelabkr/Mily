// ──────────────────────────────────────────────
// financialStatementService.ts — 월간 재무제표
// 자산/부채/순자산/캐시플로우/수동소득지수 종합
// DNA 준수: filterDna() 모든 텍스트 통과
// ──────────────────────────────────────────────

import {
  doc,
  getDoc,
  setDoc,
  getDocs,
  collection,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import { getFirebaseDb } from '../../lib/firebase';
import { filterDna } from '../message/dnaFilter';
import { WealthLevel, getWealthLevel, calcFreedomIndex } from './cashFlowEngine';

// ── 타입 ──────────────────────────────────────

export interface StatementIncome {
  allowance: number;
  passive: number;
  other: number;
  total: number;
}

export interface StatementExpenses {
  consumable: number;
  investment: number;
  liability: number;
  give: number;
  total: number;
}

export interface StatementAssets {
  savings: number;      // 저금통
  contracts: number;    // 패밀리뱅크 자산
  total: number;
}

export interface StatementLiabilities {
  loans: number;        // 가족 대출
  total: number;
}

export interface FamilyStatement {
  uid: string;
  period: string;       // "YYYY-MM"
  income: StatementIncome;
  expenses: StatementExpenses;
  assets: StatementAssets;
  liabilities: StatementLiabilities;
  netWorth: number;         // 순자산
  cashFlow: number;         // 순현금흐름
  freedomIndex: number;     // 자유 지수 (0~1)
  wealthLevel: WealthLevel;
  createdAt: number;
}

export interface StatementDiff {
  period1: string;
  period2: string;
  netWorthDelta: number;
  cashFlowDelta: number;
  freedomIndexDelta: number;
  wealthLevelChanged: boolean;
}

// ── Statement 생성 ──────────────────────────────

export interface BuildStatementInput {
  uid: string;
  period: string;
  allowanceIncome: number;
  passiveIncome: number;
  otherIncome: number;
  consumableExpense: number;
  investmentExpense: number;
  liabilityExpense: number;
  giveExpense: number;
  savingsBalance: number;
  contractBalance: number;
  loanBalance: number;
}

/**
 * Statement 계산 (Firestore 미연동 순수 함수).
 */
export function buildStatement(input: BuildStatementInput): FamilyStatement {
  const totalIncome = input.allowanceIncome + input.passiveIncome + input.otherIncome;
  const totalExpenses =
    input.consumableExpense +
    input.investmentExpense +
    input.liabilityExpense +
    input.giveExpense;

  const totalAssets = input.savingsBalance + input.contractBalance;
  const totalLiabilities = input.loanBalance;
  const netWorth = totalAssets - totalLiabilities;
  const cashFlow = totalIncome - totalExpenses;
  const freedomIndex = calcFreedomIndex(input.passiveIncome, totalExpenses);
  const wealthLevel = getWealthLevel(Math.max(0, netWorth));

  return {
    uid: input.uid,
    period: input.period,
    income: {
      allowance: input.allowanceIncome,
      passive: input.passiveIncome,
      other: input.otherIncome,
      total: totalIncome,
    },
    expenses: {
      consumable: input.consumableExpense,
      investment: input.investmentExpense,
      liability: input.liabilityExpense,
      give: input.giveExpense,
      total: totalExpenses,
    },
    assets: {
      savings: input.savingsBalance,
      contracts: input.contractBalance,
      total: totalAssets,
    },
    liabilities: {
      loans: input.loanBalance,
      total: totalLiabilities,
    },
    netWorth,
    cashFlow,
    freedomIndex,
    wealthLevel,
    createdAt: Date.now(),
  };
}

// ── Firestore CRUD ────────────────────────────

const STATEMENTS_COLLECTION = 'financial_statements';

/**
 * Statement 저장.
 * Firestore: financial_statements/{uid}/{period}
 */
export async function saveStatement(statement: FamilyStatement): Promise<void> {
  const ref = doc(
    getFirebaseDb(),
    STATEMENTS_COLLECTION,
    statement.uid,
    statement.period
  );
  await setDoc(ref, statement);
}

/**
 * 특정 기간 Statement 조회.
 */
export async function getStatement(
  uid: string,
  period: string
): Promise<FamilyStatement | null> {
  const ref = doc(getFirebaseDb(), STATEMENTS_COLLECTION, uid, period);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return snap.data() as FamilyStatement;
}

/**
 * 최근 N개월 Statement 이력 조회.
 */
export async function getStatementHistory(
  uid: string,
  months: number
): Promise<FamilyStatement[]> {
  const colRef = collection(getFirebaseDb(), STATEMENTS_COLLECTION, uid);
  const q = query(colRef, orderBy('period', 'desc'), limit(months));
  const snaps = await getDocs(q);
  return snaps.docs.map((d) => d.data() as FamilyStatement);
}

/**
 * 두 기간 Statement 비교.
 */
export async function compareStatements(
  uid: string,
  period1: string,
  period2: string
): Promise<StatementDiff | null> {
  const [s1, s2] = await Promise.all([
    getStatement(uid, period1),
    getStatement(uid, period2),
  ]);

  if (!s1 || !s2) return null;

  return {
    period1,
    period2,
    netWorthDelta: s2.netWorth - s1.netWorth,
    cashFlowDelta: s2.cashFlow - s1.cashFlow,
    freedomIndexDelta: s2.freedomIndex - s1.freedomIndex,
    wealthLevelChanged: s1.wealthLevel !== s2.wealthLevel,
  };
}

// ── 텍스트 생성 (DNA 통과 필수) ───────────────

/**
 * Statement 한줄 요약 (DNA 통과).
 */
export function buildStatementSummary(stmt: FamilyStatement): string {
  const pct = Math.round(stmt.freedomIndex * 100);
  const direction = stmt.cashFlow >= 0 ? '흑자' : '적자';

  const raw = `이번 달은 ${direction}로 마쳤어요. 자유 지수는 ${pct}%예요.`;

  const result = filterDna(raw);
  if (!result.passed) {
    return '이번 달 기록을 확인해봐요.';
  }
  return raw;
}
