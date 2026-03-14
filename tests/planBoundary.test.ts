import { calculateBoundary } from '../src/engines/checkin/planBoundary';

describe('planBoundary', () => {
  it('within: 80% 이하', () => {
    expect(calculateBoundary(8000, 10000)).toBe('within');
    expect(calculateBoundary(0, 10000)).toBe('within');
    expect(calculateBoundary(8000, 10000)).toBe('within');
  });

  it('similar: 80~120%', () => {
    expect(calculateBoundary(9000, 10000)).toBe('similar');
    expect(calculateBoundary(10000, 10000)).toBe('similar');
    expect(calculateBoundary(12000, 10000)).toBe('similar');
  });

  it('outside: 120% 초과', () => {
    expect(calculateBoundary(12001, 10000)).toBe('outside');
    expect(calculateBoundary(20000, 10000)).toBe('outside');
  });

  it('weeklyLimit 0이면 outside', () => {
    expect(calculateBoundary(1000, 0)).toBe('outside');
  });

  it('경계값: 정확히 80%', () => {
    expect(calculateBoundary(8000, 10000)).toBe('within');
  });

  it('경계값: 정확히 120%', () => {
    expect(calculateBoundary(12000, 10000)).toBe('similar');
  });
});

describe('planBoundary — spendType', () => {
  // fixed: 항상 within
  it('fixed: 초과해도 항상 within', () => {
    expect(calculateBoundary(20000, 10000, 'fixed')).toBe('within');
  });

  it('fixed: weeklyLimit 0이어도 within', () => {
    expect(calculateBoundary(5000, 0, 'fixed')).toBe('within');
  });

  // living: 100%/150% 기준
  it('living: 100% 이하 → within', () => {
    expect(calculateBoundary(10000, 10000, 'living')).toBe('within');
    expect(calculateBoundary(8000, 10000, 'living')).toBe('within');
  });

  it('living: 100~150% → similar', () => {
    expect(calculateBoundary(11000, 10000, 'living')).toBe('similar');
    expect(calculateBoundary(15000, 10000, 'living')).toBe('similar');
  });

  it('living: 150% 초과 → outside', () => {
    expect(calculateBoundary(15001, 10000, 'living')).toBe('outside');
    expect(calculateBoundary(20000, 10000, 'living')).toBe('outside');
  });

  // choice: 80%/120% 기준
  it('choice: 80% 이하 → within', () => {
    expect(calculateBoundary(8000, 10000, 'choice')).toBe('within');
  });

  it('choice: 80~120% → similar', () => {
    expect(calculateBoundary(9000, 10000, 'choice')).toBe('similar');
    expect(calculateBoundary(12000, 10000, 'choice')).toBe('similar');
  });

  it('choice: 120% 초과 → outside', () => {
    expect(calculateBoundary(12001, 10000, 'choice')).toBe('outside');
  });

  // null/undefined: choice 기준 적용
  it('spendType null: choice 기준 적용', () => {
    expect(calculateBoundary(20000, 10000, null)).toBe('outside');
    expect(calculateBoundary(8000, 10000, null)).toBe('within');
  });
});
