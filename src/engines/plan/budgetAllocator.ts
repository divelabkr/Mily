// ──────────────────────────────────────────────
// budgetAllocator.ts — 스마트 예산 배분 로직
// 총합 항상 100% 강제, isParentManaged 제외 자동 조정
// ──────────────────────────────────────────────

import type { Category, ValidationResult } from './planTypes';

// ──────────────────────────────────────────────
// allocate — 슬라이더 값 변경 시 나머지 비례 조정
// ──────────────────────────────────────────────

export function allocate(
  categories: Category[],
  changedId: string,
  newValue: number
): Category[] {
  const clamped = Math.max(0, Math.min(100, Math.round(newValue)));

  // 변경 대상 / 조정 가능 / 잠긴 항목 분류
  const changed = categories.find((c) => c.id === changedId);
  if (!changed || changed.isParentManaged) return categories;

  const locked = categories.filter(
    (c) => c.isParentManaged && c.id !== changedId
  );
  const lockedSum = locked.reduce((s, c) => s + c.percentage, 0);

  const adjustable = categories.filter(
    (c) => !c.isParentManaged && c.id !== changedId
  );

  // 변경 가능한 최대값
  const maxAllowed = 100 - lockedSum;
  const safeValue = Math.min(clamped, maxAllowed);

  // 나머지 조정 가능 항목에 배분 가능한 합계
  const remaining = maxAllowed - safeValue;
  const adjustableSum = adjustable.reduce((s, c) => s + c.percentage, 0);

  let adjusted: Category[];
  if (adjustableSum === 0) {
    // 조정 가능 항목이 모두 0 → 균등 배분
    const each = Math.floor(remaining / Math.max(adjustable.length, 1));
    let leftover = remaining - each * adjustable.length;
    adjusted = adjustable.map((c, i) => ({
      ...c,
      percentage: each + (i === 0 ? leftover-- > 0 ? 1 : 0 : 0),
    }));
  } else {
    // 비례 조정
    const rawAdjusted = adjustable.map((c) => ({
      ...c,
      percentage: Math.round((c.percentage / adjustableSum) * remaining),
    }));
    // 반올림 오차 보정
    const adjSum = rawAdjusted.reduce((s, c) => s + c.percentage, 0);
    const diff = remaining - adjSum;
    if (rawAdjusted.length > 0) {
      rawAdjusted[0] = {
        ...rawAdjusted[0],
        percentage: Math.max(0, rawAdjusted[0].percentage + diff),
      };
    }
    adjusted = rawAdjusted;
  }

  // 전체 재조립
  return categories.map((c) => {
    if (c.id === changedId) return { ...c, percentage: safeValue };
    const found = adjusted.find((a) => a.id === c.id);
    return found ?? c;
  });
}

// ──────────────────────────────────────────────
// getRemaining — 남은 배분 가능 %
// ──────────────────────────────────────────────

export function getRemaining(categories: Category[]): number {
  const total = categories.reduce((s, c) => s + c.percentage, 0);
  return 100 - total;
}

// ──────────────────────────────────────────────
// validate — 유효성 검사
// ──────────────────────────────────────────────

export function validate(categories: Category[]): ValidationResult {
  const errors: string[] = [];
  const totalPercent = categories.reduce((s, c) => s + c.percentage, 0);

  if (categories.length === 0) {
    errors.push('카테고리가 최소 1개 이상 필요해요');
  }
  if (totalPercent > 100) {
    errors.push(`배분 합계가 ${totalPercent}%로 100%를 초과했어요`);
  }

  return { valid: errors.length === 0, totalPercent, errors };
}

// ──────────────────────────────────────────────
// autoBalance — 초과 시 자동 조정
// choice → living → fixed 순서로 감소 (isParentManaged 제외)
// ──────────────────────────────────────────────

export function autoBalance(categories: Category[]): Category[] {
  const total = categories.reduce((s, c) => s + c.percentage, 0);
  if (total <= 100) return categories;

  const excess = total - 100;
  // 조정 우선순위: choice → living → fixed
  const priority: Category['spendType'][] = ['choice', 'living', 'fixed'];
  const result = categories.map((c) => ({ ...c }));
  let remaining = excess;

  for (const type of priority) {
    if (remaining <= 0) break;
    const targets = result.filter(
      (c) => c.spendType === type && !c.isParentManaged && c.percentage > 0
    );
    for (const t of targets) {
      if (remaining <= 0) break;
      const reduce = Math.min(t.percentage, remaining);
      t.percentage = Math.max(0, t.percentage - reduce);
      remaining -= reduce;
    }
  }

  return result;
}

// ──────────────────────────────────────────────
// getCategoriesByRole — 역할별 초기 카테고리 반환
// ──────────────────────────────────────────────

import { ADULT_CATEGORIES, CHILD_CATEGORIES } from './planTypes';

export function getCategoriesByRole(role: 'adult' | 'child'): Category[] {
  return role === 'adult'
    ? ADULT_CATEGORIES.map((c) => ({ ...c }))
    : CHILD_CATEGORIES.map((c) => ({ ...c }));
}
