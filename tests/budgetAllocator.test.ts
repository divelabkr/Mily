/**
 * budgetAllocator.test.ts
 * 스마트 예산 배분 로직 단위 테스트
 */

import {
  allocate,
  getRemaining,
  validate,
  autoBalance,
  getCategoriesByRole,
} from '../src/engines/plan/budgetAllocator';
import type { Category } from '../src/engines/plan/planTypes';

// ── 테스트용 카테고리 헬퍼 ──────────────────────

function makeCategories(items: Partial<Category>[]): Category[] {
  return items.map((item, i) => ({
    id: item.id ?? `cat${i}`,
    name: item.name ?? `카테고리${i}`,
    icon: item.icon ?? '📦',
    percentage: item.percentage ?? 0,
    spendType: item.spendType ?? 'choice',
    targetRole: item.targetRole ?? 'adult',
    isParentManaged: item.isParentManaged ?? false,
  }));
}

// ──────────────────────────────────────────────
// 1. allocate() — 슬라이더 조정 후 총합 100% 유지
// ──────────────────────────────────────────────

describe('allocate()', () => {
  it('총합이 항상 100%를 유지한다', () => {
    const cats = makeCategories([
      { id: 'a', percentage: 40 },
      { id: 'b', percentage: 30 },
      { id: 'c', percentage: 30 },
    ]);
    const result = allocate(cats, 'a', 60);
    const total = result.reduce((s, c) => s + c.percentage, 0);
    expect(total).toBe(100);
  });

  it('변경된 항목의 값이 반영된다', () => {
    const cats = makeCategories([
      { id: 'a', percentage: 40 },
      { id: 'b', percentage: 30 },
      { id: 'c', percentage: 30 },
    ]);
    const result = allocate(cats, 'a', 50);
    const changed = result.find((c) => c.id === 'a');
    expect(changed?.percentage).toBe(50);
  });

  it('isParentManaged 항목은 고정된다', () => {
    const cats = makeCategories([
      { id: 'academy', percentage: 20, isParentManaged: true },
      { id: 'b',       percentage: 40, isParentManaged: false },
      { id: 'c',       percentage: 40, isParentManaged: false },
    ]);
    const result = allocate(cats, 'b', 60);
    const managed = result.find((c) => c.id === 'academy');
    expect(managed?.percentage).toBe(20); // 변하지 않음
    const total = result.reduce((s, c) => s + c.percentage, 0);
    expect(total).toBe(100);
  });

  it('isParentManaged 항목을 직접 변경하면 무시된다', () => {
    const cats = makeCategories([
      { id: 'academy', percentage: 20, isParentManaged: true },
      { id: 'b',       percentage: 80, isParentManaged: false },
    ]);
    const result = allocate(cats, 'academy', 50);
    const managed = result.find((c) => c.id === 'academy');
    expect(managed?.percentage).toBe(20); // 변하지 않음
  });
});

// ──────────────────────────────────────────────
// 2. getRemaining() — 남은 배분 계산
// ──────────────────────────────────────────────

describe('getRemaining()', () => {
  it('100 - 현재 합계를 반환한다', () => {
    const cats = makeCategories([
      { percentage: 40 },
      { percentage: 30 },
    ]);
    expect(getRemaining(cats)).toBe(30);
  });

  it('초과 시 음수를 반환한다', () => {
    const cats = makeCategories([
      { percentage: 60 },
      { percentage: 60 },
    ]);
    expect(getRemaining(cats)).toBe(-20);
  });
});

// ──────────────────────────────────────────────
// 3. validate() — 유효성 검사
// ──────────────────────────────────────────────

describe('validate()', () => {
  it('정상 배분이면 valid=true', () => {
    const cats = makeCategories([
      { percentage: 50 },
      { percentage: 50 },
    ]);
    const result = validate(cats);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('총합 100% 초과 시 오류', () => {
    const cats = makeCategories([
      { percentage: 60 },
      { percentage: 60 },
    ]);
    const result = validate(cats);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('카테고리 0개 시 오류', () => {
    const result = validate([]);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});

// ──────────────────────────────────────────────
// 4. autoBalance() — 자동 조정
// ──────────────────────────────────────────────

describe('autoBalance()', () => {
  it('초과 시 choice → living → fixed 순으로 감소', () => {
    const cats = makeCategories([
      { id: 'a', percentage: 60, spendType: 'choice' },
      { id: 'b', percentage: 30, spendType: 'living' },
      { id: 'c', percentage: 30, spendType: 'fixed' },
    ]);
    const result = autoBalance(cats);
    const total = result.reduce((s, c) => s + c.percentage, 0);
    expect(total).toBeLessThanOrEqual(100);
    // choice가 먼저 줄어들어야 함
    const choice = result.find((c) => c.id === 'a');
    expect(choice?.percentage).toBeLessThan(60);
  });

  it('100% 이하이면 변경 없음', () => {
    const cats = makeCategories([
      { id: 'a', percentage: 40 },
      { id: 'b', percentage: 40 },
    ]);
    const result = autoBalance(cats);
    expect(result[0].percentage).toBe(40);
    expect(result[1].percentage).toBe(40);
  });

  it('isParentManaged 항목은 조정 제외', () => {
    const cats = makeCategories([
      { id: 'academy', percentage: 50, spendType: 'fixed', isParentManaged: true },
      { id: 'b',       percentage: 60, spendType: 'choice' },
    ]);
    const result = autoBalance(cats);
    const managed = result.find((c) => c.id === 'academy');
    expect(managed?.percentage).toBe(50); // 고정
  });
});

// ──────────────────────────────────────────────
// 5. getCategoriesByRole() — 역할별 카테고리
// ──────────────────────────────────────────────

describe('getCategoriesByRole()', () => {
  it('성인 카테고리는 child targetRole 없음', () => {
    const cats = getCategoriesByRole('adult');
    const childOnly = cats.filter((c) => c.targetRole === 'child');
    expect(childOnly).toHaveLength(0);
  });

  it('자녀 카테고리는 adult targetRole 없음', () => {
    const cats = getCategoriesByRole('child');
    const adultOnly = cats.filter((c) => c.targetRole === 'adult');
    expect(adultOnly).toHaveLength(0);
  });

  it('자녀 카테고리에 isParentManaged 항목이 있다', () => {
    const cats = getCategoriesByRole('child');
    const managed = cats.filter((c) => c.isParentManaged);
    expect(managed.length).toBeGreaterThan(0);
  });

  it('성인 카테고리 초기 총합은 100%', () => {
    const cats = getCategoriesByRole('adult');
    const total = cats.reduce((s, c) => s + c.percentage, 0);
    expect(total).toBe(100);
  });

  it('자녀 카테고리 초기 총합은 100%', () => {
    const cats = getCategoriesByRole('child');
    const total = cats.reduce((s, c) => s + c.percentage, 0);
    expect(total).toBe(100);
  });
});
