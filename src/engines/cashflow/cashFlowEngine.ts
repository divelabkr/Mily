// ──────────────────────────────────────────────
// cashFlowEngine.ts — 캐시플로우 엔진
// 자유 지수 = 수동소득 / 지출. 0%=래트레이스 100%=탈출
// DNA 준수: 판단형 없음. 방향성만 표시.
// ──────────────────────────────────────────────

import { filterDna } from '../message/dnaFilter';
import { SpendType } from '../plan/defaultCategories';

// ── 타입 ──────────────────────────────────────

export type InflowSource =
  | 'allowance'   // 용돈
  | 'interest'    // 이자
  | 'chore'       // 심부름
  | 'gift'        // 선물/명절
  | 'resale'      // 중고 판매
  | 'reward'      // 보상/쿠폰
  | 'other';

export type WealthLevel =
  | 'seed'        // 씨앗 🌱 0~9,999
  | 'sprout'      // 새싹 🌿 10,000~49,999
  | 'tree'        // 나무 🌳 50,000~199,999
  | 'forest'      // 숲 🌲 200,000~499,999
  | 'millionaire'; // 밀리어네어 🏆 500,000+

export type AssetType =
  | 'consumable'  // 💸 사라지는 돈
  | 'investment'  // 🔄 돌아오는 돈
  | 'asset'       // 📈 커지는 돈
  | 'liability';  // 📉 빠져나가는 돈

export interface InflowItem {
  source: InflowSource;
  amount: number;
  isPassive: boolean;
}

export interface OutflowItem {
  categoryId: string;
  spendType: SpendType;
  amount: number;
  assetType: AssetType;
}

export interface CashFlowData {
  uid: string;
  period: string;           // "YYYY-MM"
  inflows: InflowItem[];
  outflows: OutflowItem[];
  passiveIncome: number;    // 수동소득 합계
  totalInflow: number;
  totalOutflow: number;
  freedomIndex: number;     // 수동소득 / 지출 (0~1)
  assetRatio: number;       // 자산성 지출 / 전체 지출
  netWorthLevel: WealthLevel;
  netWorth: number;
}

// ── 레벨 임계값 ────────────────────────────────

const WEALTH_THRESHOLDS: { min: number; level: WealthLevel; emoji: string; label: string }[] = [
  { min: 500_000, level: 'millionaire', emoji: '🏆', label: '밀리어네어' },
  { min: 200_000, level: 'forest',      emoji: '🌲', label: '숲' },
  { min: 50_000,  level: 'tree',        emoji: '🌳', label: '나무' },
  { min: 10_000,  level: 'sprout',      emoji: '🌿', label: '새싹' },
  { min: 0,       level: 'seed',        emoji: '🌱', label: '씨앗' },
];

export function getWealthLevel(netWorth: number): WealthLevel {
  for (const { min, level } of WEALTH_THRESHOLDS) {
    if (netWorth >= min) return level;
  }
  return 'seed';
}

export function getWealthEmoji(level: WealthLevel): string {
  return WEALTH_THRESHOLDS.find((t) => t.level === level)?.emoji ?? '🌱';
}

export function getWealthLabel(level: WealthLevel): string {
  return WEALTH_THRESHOLDS.find((t) => t.level === level)?.label ?? '씨앗';
}

// ── AssetType 분류 ──────────────────────────────

const INVESTMENT_CATEGORIES = new Set(['hobby', 'etc']); // 책/강의 포함
const SAVINGS_CATEGORIES = new Set(['savings']);
const GIVE_CATEGORIES = new Set(['give']);

/**
 * 카테고리 + spendType → AssetType 분류.
 */
export function classifyAssetType(
  categoryId: string,
  spendType: SpendType
): AssetType {
  if (SAVINGS_CATEGORIES.has(categoryId)) return 'asset';
  if (GIVE_CATEGORIES.has(categoryId)) return 'investment'; // 나눔은 사회적 투자
  if (spendType === 'fixed') return 'liability';
  if (INVESTMENT_CATEGORIES.has(categoryId) && spendType === 'choice') return 'investment';
  return 'consumable';
}

// ── 자유 지수 계산 ──────────────────────────────

/**
 * 자유 지수 = 수동소득 / 전체 지출 (0~1).
 * 100% = 래트레이스 탈출.
 */
export function calcFreedomIndex(
  passiveIncome: number,
  totalOutflow: number
): number {
  if (totalOutflow === 0) return passiveIncome > 0 ? 1 : 0;
  return Math.min(1, passiveIncome / totalOutflow);
}

/**
 * 자유 지수 설명 문구 (DNA 통과 필수).
 */
export function getFreedomIndexLabel(freedomIndex: number): string {
  const pct = Math.round(freedomIndex * 100);
  let msg: string;
  if (pct >= 100) {
    msg = '수동소득이 지출을 넘어섰어요! 자유 지수 100%를 달성했어요.';
  } else if (pct >= 50) {
    msg = `수동소득이 지출의 ${pct}%를 채우고 있어요. 꾸준히 늘어나고 있어요!`;
  } else if (pct > 0) {
    msg = `수동소득이 지출의 ${pct}%예요. 조금씩 자유 지수가 올라가고 있어요.`;
  } else {
    msg = '아직 수동소득이 없어요. 저금 이자나 심부름 수익이 첫 시작이에요.';
  }

  // DNA 검증
  const result = filterDna(msg);
  if (!result.passed) {
    return '자유 지수를 확인해봐요.';
  }
  return msg;
}

// ── 캐시플로우 계산 ────────────────────────────

/**
 * 인풋 데이터 기반 캐시플로우 계산.
 * Firestore 연동은 별도 레이어에서 처리.
 */
export function calculateCashFlowFromData(
  uid: string,
  period: string,
  inflows: InflowItem[],
  outflows: OutflowItem[]
): CashFlowData {
  const passiveIncome = inflows
    .filter((i) => i.isPassive)
    .reduce((sum, i) => sum + i.amount, 0);

  const totalInflow = inflows.reduce((sum, i) => sum + i.amount, 0);
  const totalOutflow = outflows.reduce((sum, o) => sum + o.amount, 0);

  const investmentOutflow = outflows
    .filter((o) => o.assetType === 'investment' || o.assetType === 'asset')
    .reduce((sum, o) => sum + o.amount, 0);

  const assetRatio = totalOutflow > 0 ? investmentOutflow / totalOutflow : 0;
  const freedomIndex = calcFreedomIndex(passiveIncome, totalOutflow);
  const netWorth = totalInflow - totalOutflow; // 단순 월간 순현금흐름
  const netWorthLevel = getWealthLevel(Math.max(0, totalInflow)); // 누적은 별도

  return {
    uid,
    period,
    inflows,
    outflows,
    passiveIncome,
    totalInflow,
    totalOutflow,
    freedomIndex,
    assetRatio,
    netWorthLevel,
    netWorth,
  };
}

/**
 * 수동소득 비율 계산.
 */
export function getPassiveIncomeRatio(inflows: InflowItem[]): number {
  const total = inflows.reduce((sum, i) => sum + i.amount, 0);
  const passive = inflows
    .filter((i) => i.isPassive)
    .reduce((sum, i) => sum + i.amount, 0);
  return total > 0 ? passive / total : 0;
}
