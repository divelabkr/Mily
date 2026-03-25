import { SpendType } from '../plan/defaultCategories';

export type PlanBoundary = 'within' | 'similar' | 'outside';

export function calculateBoundary(
  categoryAmount: number,
  weeklyLimit: number,
  spendType?: SpendType | null
): PlanBoundary {
  if (spendType === 'fixed' || spendType === 'give') return 'within';
  if (weeklyLimit === 0) return 'outside';
  const ratio = categoryAmount / weeklyLimit;

  if (spendType === 'living') {
    if (ratio <= 1.0) return 'within';
    if (ratio <= 1.5) return 'similar';
    return 'outside';
  }

  // choice (default)
  if (ratio <= 0.8) return 'within';
  if (ratio <= 1.2) return 'similar';
  return 'outside';
}
