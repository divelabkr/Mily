import { CheckIn, getWeeklyCategoryTotal } from '../checkin/checkinStore';
import { DEFAULT_CATEGORIES } from '../plan/defaultCategories';
import { Plan } from '../plan/planStore';
import { getCategoryWeeklyLimit } from '../plan/planService';
import { PrivacySettings } from '../family/privacySettings';

export interface MemberReport {
  uid: string;
  displayName: string;
  achievementRate: number; // 0~100 (%)
  sharedCategories: {
    categoryId: string;
    label: string;
    emoji: string;
    spent: number;
    limit: number;
  }[];
}

export interface FamilyWeeklySummary {
  weekId: string;
  members: MemberReport[];
  requestCardCount: number;
}

export function buildMemberReport(
  uid: string,
  displayName: string,
  plan: Plan | null,
  checkIns: CheckIn[],
  privacy: PrivacySettings
): MemberReport {
  if (!plan) {
    return { uid, displayName, achievementRate: 0, sharedCategories: [] };
  }

  // 역전된 프라이버시: 자녀가 공유 허용한 카테고리만
  const sharedCategories = DEFAULT_CATEGORIES
    .filter((cat) => privacy.sharedCategories.includes(cat.id))
    .map((cat) => ({
      categoryId: cat.id,
      label: cat.label,
      emoji: cat.emoji,
      spent: getWeeklyCategoryTotal(checkIns, cat.id),
      limit: getCategoryWeeklyLimit(plan, cat.id),
    }));

  // 달성률: 계획 이내인 카테고리 비율
  const totalCategories = plan.categories.length;
  const withinCategories = plan.categories.filter((cat) => {
    const limit = getCategoryWeeklyLimit(plan, cat.categoryId);
    const spent = getWeeklyCategoryTotal(checkIns, cat.categoryId);
    return limit === 0 || spent <= limit;
  }).length;

  const achievementRate =
    totalCategories > 0
      ? Math.round((withinCategories / totalCategories) * 100)
      : 0;

  return { uid, displayName, achievementRate, sharedCategories };
}
