export const PLANS = {
  free: {
    id: 'free',
    price: 0,
    historyWeeks: 1,
    maxCategories: 6,
    requestCardsPerWeek: 2,
    familyMembers: 0,
  },
  plus: {
    id: 'plus',
    price: 4900,
    historyWeeks: null,
    maxCategories: null,
    requestCardsPerWeek: null,
    familyMembers: 0,
  },
  family: {
    id: 'family',
    price: 8900,
    historyWeeks: null,
    maxCategories: null,
    requestCardsPerWeek: null,
    familyMembers: 3,
  },
} as const;

export type PlanId = keyof typeof PLANS;
