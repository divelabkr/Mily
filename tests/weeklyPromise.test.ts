import { usePlanStore, Plan } from '../src/engines/plan/planStore';

const makePlan = (overrides: Partial<Plan> = {}): Plan => ({
  planId: 'plan_1',
  uid: 'uid_1',
  month: '2026-03',
  totalBudget: 400000,
  categories: [],
  createdAt: Date.now(),
  updatedAt: Date.now(),
  ...overrides,
});

describe('weeklyPromise — planStore', () => {
  beforeEach(() => {
    usePlanStore.setState({ currentPlan: null, loading: false });
  });

  it('setWeeklyPromise: 약속 저장', () => {
    usePlanStore.getState().setCurrentPlan(makePlan());
    usePlanStore.getState().setWeeklyPromise('카페 말고 집 커피');
    expect(usePlanStore.getState().currentPlan?.weeklyPromise).toBe('카페 말고 집 커피');
  });

  it('setWeeklyPromise: null로 초기화', () => {
    usePlanStore.getState().setCurrentPlan(makePlan({ weeklyPromise: '기존 약속' }));
    usePlanStore.getState().setWeeklyPromise(null);
    expect(usePlanStore.getState().currentPlan?.weeklyPromise).toBeNull();
  });

  it('setWeeklyPromise: currentPlan 없으면 무시', () => {
    usePlanStore.getState().setWeeklyPromise('약속');
    expect(usePlanStore.getState().currentPlan).toBeNull();
  });

  it('Plan 초기 생성 시 weeklyPromise는 undefined', () => {
    const plan = makePlan();
    expect(plan.weeklyPromise).toBeUndefined();
  });

  it('weeklyPromise는 Plan 다른 필드에 영향 없음', () => {
    const plan = makePlan({ totalBudget: 500000 });
    usePlanStore.getState().setCurrentPlan(plan);
    usePlanStore.getState().setWeeklyPromise('절약');
    expect(usePlanStore.getState().currentPlan?.totalBudget).toBe(500000);
  });
});
