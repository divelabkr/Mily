// ──────────────────────────────────────────────
// reportTypes.ts — 리포트 역할 + 기간 타입 정의
// 3 roles × 2 periods = 6 report types
// ──────────────────────────────────────────────

import { CategoryId } from '../plan/defaultCategories';

export type ReportRole = 'solo_adult' | 'parent' | 'child';
export type ReportPeriod = 'weekly' | 'monthly';
export type ReportType = `${ReportRole}_${ReportPeriod}`;

// 아동 연령 밴드 (CLAUDE.md 22 참고)
export type AgeBand = 'A' | 'B' | 'C' | 'D';
export const AGE_BAND_RANGES: Record<AgeBand, { min: number; max: number }> = {
  A: { min: 7,  max: 9  },
  B: { min: 10, max: 12 },
  C: { min: 13, max: 15 },
  D: { min: 16, max: 18 },
};

export function getAgeBand(age: number): AgeBand {
  if (age <= 9)  return 'A';
  if (age <= 12) return 'B';
  if (age <= 15) return 'C';
  return 'D';
}

export interface CategorySummary {
  categoryId: CategoryId;
  label: string;
  planned: number;
  actual: number;
}

export interface FamilySummary {
  totalBudget: number;
  totalSpent: number;
  keptPromises: number;   // 이번 주/월 약속 달성 수
  praiseSent: number;     // 칭찬 카드 발송 수
}

// ──────────────────────────────────────────────
// 리포트 입력
// ──────────────────────────────────────────────

export interface ReportInput {
  role: ReportRole;
  period: ReportPeriod;
  weekId?: string;         // weekly 전용
  month?: string;          // monthly 전용 (YYYY-MM)
  totalBudget: number;
  totalSpent: number;
  categories: CategorySummary[];
  ageBand?: AgeBand;       // child 전용
  familySummary?: FamilySummary; // parent 전용
}

// ──────────────────────────────────────────────
// 리포트 출력
// ──────────────────────────────────────────────

export interface ReportOutput {
  role: ReportRole;
  period: ReportPeriod;
  headline: string;
  highlights: string[];    // 2~3개 포인트
  suggestion: string;      // 다음 주/월 제안
  economyTip?: string;     // child 전용 경제 개념 팁
  aiUsed: boolean;
}

// ──────────────────────────────────────────────
// 6개 리포트 타입 목록
// ──────────────────────────────────────────────

export const REPORT_TYPES: ReportType[] = [
  'solo_adult_weekly',
  'solo_adult_monthly',
  'parent_weekly',
  'parent_monthly',
  'child_weekly',
  'child_monthly',
];
