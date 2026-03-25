// ──────────────────────────────────────────────
// assetClassifier.ts — 지출 자산 유형 분류기
// 4종: consumable / investment / asset / liability
// DNA: 판단형 없음. 방향성 정보만.
// ──────────────────────────────────────────────

import { SpendType } from '../plan/defaultCategories';
import { AssetType, classifyAssetType } from './cashFlowEngine';

// ── 타입 ──────────────────────────────────────

export interface AssetRatio {
  consumable: number;   // 0~1
  investment: number;   // 0~1
  asset: number;        // 0~1
  liability: number;    // 0~1
  give: number;         // 0~1 (나눔, 별도 추적)
}

export interface ClassifyInput {
  categoryId: string;
  spendType: SpendType;
  amount: number;
}

export interface ReclassificationSuggestion {
  originalType: AssetType;
  suggestedType: AssetType;
  reason: string;
}

// ── 카테고리별 오버라이드 규칙 ─────────────────

/**
 * 카테고리 + spendType 조합으로 AssetType 결정.
 * cashFlowEngine.classifyAssetType 기반 + 추가 규칙.
 */
export function classify(
  categoryId: string,
  spendType: SpendType,
  _amount: number
): AssetType {
  // give 카테고리는 별도 (AssetType에 포함하되 give로 표기)
  if (categoryId === 'give') return 'investment'; // 사회적 투자로 분류

  // savings 카테고리 = 자산
  if (categoryId === 'savings') return 'asset';

  // fixed = liability (정기 지출)
  if (spendType === 'fixed') return 'liability';

  // living = consumable (대부분)
  if (spendType === 'living') return 'consumable';

  // choice = consumable (기본), 특정 카테고리는 investment
  if (spendType === 'choice') {
    return classifyAssetType(categoryId, spendType);
  }

  return 'consumable';
}

// ── 비율 계산 ──────────────────────────────────

/**
 * 항목 목록 기반 자산 유형 비율 계산.
 */
export function getAssetRatioFromItems(items: ClassifyInput[]): AssetRatio {
  const totals = { consumable: 0, investment: 0, asset: 0, liability: 0, give: 0 };
  let grand = 0;

  for (const item of items) {
    const type = classify(item.categoryId, item.spendType, item.amount);
    if (item.categoryId === 'give') {
      totals.give += item.amount;
    } else {
      totals[type] += item.amount;
    }
    grand += item.amount;
  }

  if (grand === 0) {
    return { consumable: 0, investment: 0, asset: 0, liability: 0, give: 0 };
  }

  return {
    consumable: totals.consumable / grand,
    investment: totals.investment / grand,
    asset: totals.asset / grand,
    liability: totals.liability / grand,
    give: totals.give / grand,
  };
}

// ── 재분류 제안 ────────────────────────────────

/**
 * 지출 항목에 대한 재분류 제안.
 * 판단형 없음. 단순 정보 제공.
 */
export function suggestReclassification(
  item: ClassifyInput
): ReclassificationSuggestion | null {
  const current = classify(item.categoryId, item.spendType, item.amount);

  // 취미(hobby) + choice → investment 제안 가능
  if (item.categoryId === 'hobby' && item.spendType === 'choice') {
    if (current !== 'investment') {
      return {
        originalType: current,
        suggestedType: 'investment',
        reason: '취미 활동은 배움이 될 수 있어요.',
      };
    }
  }

  return null;
}

// ── 월말 리포트 요약 문구 ──────────────────────

export interface AssetSummaryReport {
  assetPct: number;
  consumablePct: number;
  givePct: number;
  summary: string;
}

/**
 * 월말 자산 분류 요약 (DNA 통과).
 */
export function buildAssetSummaryReport(ratio: AssetRatio): AssetSummaryReport {
  const assetPct = Math.round((ratio.asset + ratio.investment) * 100);
  const consumablePct = Math.round(ratio.consumable * 100);
  const givePct = Math.round(ratio.give * 100);

  const summary =
    `이번 달 자산성 지출: ${assetPct}% 📈 / ` +
    `소비성 지출: ${consumablePct}% 💸 / ` +
    `나눔 지출: ${givePct}% 🤝`;

  return { assetPct, consumablePct, givePct, summary };
}
