// ──────────────────────────────────────────────
// planTypes.ts — 역할별 카테고리 + 부모 고정비 타입
// ──────────────────────────────────────────────

import type { SpendType } from './defaultCategories';

export type TargetRole = 'adult' | 'child' | 'both';

export interface Category {
  id: string;
  name: string;
  icon: string;
  percentage: number;       // 0~100
  spendType: SpendType;
  targetRole: TargetRole;
  isParentManaged: boolean; // true: 부모가 설정, 자녀 수정 불가
}

// ──────────────────────────────────────────────
// 성인 카테고리 (adult or both)
// ──────────────────────────────────────────────

export const ADULT_CATEGORIES: Category[] = [
  { id: 'food',      name: '식비',     icon: '🍚', percentage: 30, spendType: 'living',  targetRole: 'adult', isParentManaged: false },
  { id: 'transport', name: '교통',     icon: '🚌', percentage: 15, spendType: 'fixed',   targetRole: 'both',  isParentManaged: false },
  { id: 'leisure',   name: '문화여가', icon: '🎮', percentage: 15, spendType: 'choice',  targetRole: 'adult', isParentManaged: false },
  { id: 'education', name: '교육',     icon: '📚', percentage: 15, spendType: 'choice',  targetRole: 'adult', isParentManaged: false },
  { id: 'savings',   name: '저축',     icon: '💰', percentage: 20, spendType: 'fixed',   targetRole: 'adult', isParentManaged: false },
  { id: 'etc',       name: '기타',     icon: '📦', percentage: 5,  spendType: 'choice',  targetRole: 'both',  isParentManaged: false },
];

// ──────────────────────────────────────────────
// 자녀 카테고리 (child or both)
// ──────────────────────────────────────────────

export const CHILD_CATEGORIES: Category[] = [
  { id: 'snack',     name: '간식식비', icon: '🍪', percentage: 30, spendType: 'choice',  targetRole: 'child', isParentManaged: false },
  { id: 'transport', name: '교통',     icon: '🚌', percentage: 20, spendType: 'fixed',   targetRole: 'both',  isParentManaged: false },
  { id: 'leisure',   name: '문화여가', icon: '🎮', percentage: 20, spendType: 'choice',  targetRole: 'child', isParentManaged: false },
  { id: 'savings',   name: '용돈저축', icon: '🐷', percentage: 15, spendType: 'fixed',   targetRole: 'child', isParentManaged: false },
  { id: 'academy',   name: '학원비',   icon: '📚', percentage: 10, spendType: 'fixed',   targetRole: 'child', isParentManaged: true  },
  { id: 'etc',       name: '기타',     icon: '📦', percentage: 5,  spendType: 'choice',  targetRole: 'both',  isParentManaged: false },
];

// ──────────────────────────────────────────────
// 부모가 설정하는 자녀 고정비 (Firestore)
// families/{familyId}/childFixedCosts
// ──────────────────────────────────────────────

export interface ChildFixedCost {
  id: string;
  childUid: string;
  categoryName: string;
  amount: number;
  managedByParentUid: string;
  createdAt: number;
  updatedAt: number;
}

export interface ValidationResult {
  valid: boolean;
  totalPercent: number;
  errors: string[];
}
