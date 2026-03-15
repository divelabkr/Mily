// ──────────────────────────────────────────────
// privacyShareService.ts — 세분화된 프라이버시 공개 설정
// 3단계 공개 모드 + 7일 만료 기한
// 역전된 프라이버시: 자녀가 공개 범위를 결정
// ⚠️ 특허 출원 대상 — 설계 변경 시 검토 필요
// ──────────────────────────────────────────────

import { CategoryId } from '../plan/defaultCategories';
import { ShareMode, PrivacySettings } from './privacySettings';

export { ShareMode };

// 7일 만료 기한 (ms)
export const SHARE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

export const SHARE_MODE_OPTIONS: {
  mode: ShareMode;
  label: string;
  desc: string;
}[] = [
  { mode: 'total_only',     label: '총액만',      desc: '이번 주 총 지출 금액만 공유돼요' },
  { mode: 'categories_only', label: '카테고리별', desc: '카테고리별 금액이 공유돼요' },
  { mode: 'full',           label: '전체',        desc: '모든 내역이 공유돼요' },
];

// ──────────────────────────────────────────────
// 7일 만료 기한 생성
// ──────────────────────────────────────────────

export function createShareExpiry(): number {
  return Date.now() + SHARE_EXPIRY_MS;
}

// ──────────────────────────────────────────────
// 만료 여부 확인
// ──────────────────────────────────────────────

export function isShareExpired(settings: PrivacySettings): boolean {
  if (settings.shareExpiresAt === null) return false;
  return Date.now() > settings.shareExpiresAt;
}

// ──────────────────────────────────────────────
// 부모가 볼 수 있는 카테고리 / 숨겨진 카테고리
// ──────────────────────────────────────────────

export interface ParentViewInfo {
  shareMode: ShareMode;
  isExpired: boolean;
  visibleCategories: CategoryId[];
  hiddenCategories: CategoryId[];
}

export function getParentViewInfo(
  settings: PrivacySettings,
  allCategories: CategoryId[]
): ParentViewInfo {
  const expired = isShareExpired(settings);

  if (expired || settings.sharedCategories.length === 0) {
    return {
      shareMode: settings.shareMode,
      isExpired: expired,
      visibleCategories: [],
      hiddenCategories: allCategories,
    };
  }

  const visibleCategories =
    settings.shareMode === 'full' || settings.shareMode === 'categories_only'
      ? settings.sharedCategories
      : []; // total_only → 카테고리 목록 미공개

  const hiddenCategories = allCategories.filter(
    (cat) => !visibleCategories.includes(cat)
  );

  return {
    shareMode: settings.shareMode,
    isExpired: false,
    visibleCategories,
    hiddenCategories,
  };
}

// ──────────────────────────────────────────────
// 부모에게 보내는 필터링된 체크인 요약
// ──────────────────────────────────────────────

export interface CheckInSummaryItem {
  categoryId: CategoryId;
  amount: number;
}

export interface FilteredSummary {
  totalAmount: number;
  categoryBreakdown: CheckInSummaryItem[] | null; // total_only이면 null
  isExpired: boolean;
}

export function buildFilteredSummary(
  checkIns: { categoryId: CategoryId; amount: number }[],
  settings: PrivacySettings
): FilteredSummary {
  const expired = isShareExpired(settings);

  if (expired) {
    return { totalAmount: 0, categoryBreakdown: null, isExpired: true };
  }

  const relevant = checkIns.filter((ci) =>
    settings.sharedCategories.includes(ci.categoryId)
  );

  const total = relevant.reduce((sum, ci) => sum + ci.amount, 0);

  if (settings.shareMode === 'total_only') {
    return { totalAmount: total, categoryBreakdown: null, isExpired: false };
  }

  // categories_only 또는 full: 카테고리별 집계
  const byCategory: Record<string, number> = {};
  for (const ci of relevant) {
    byCategory[ci.categoryId] = (byCategory[ci.categoryId] ?? 0) + ci.amount;
  }

  const breakdown: CheckInSummaryItem[] = Object.entries(byCategory).map(
    ([categoryId, amount]) => ({ categoryId: categoryId as CategoryId, amount })
  );

  return { totalAmount: total, categoryBreakdown: breakdown, isExpired: false };
}
