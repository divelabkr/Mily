import {
  ROLE_MODELS, getRoleModels, getRoleModelById,
  getMatchedModels, getAgeComparison,
} from '../src/engines/millionaire/roleModelService';

describe('roleModelService', () => {
  test('ROLE_MODELS has exactly 10 entries', () => {
    expect(ROLE_MODELS).toHaveLength(10);
  });

  test('Korean models: KR-01 through KR-05 all exist by id', () => {
    const ids = ['KR-01', 'KR-02', 'KR-03', 'KR-04', 'KR-05'];
    ids.forEach(id => {
      expect(ROLE_MODELS.find(m => m.id === id)).toBeDefined();
    });
  });

  test('Global models: GL-01 through GL-05 all exist by id', () => {
    const ids = ['GL-01', 'GL-02', 'GL-03', 'GL-04', 'GL-05'];
    ids.forEach(id => {
      expect(ROLE_MODELS.find(m => m.id === id)).toBeDefined();
    });
  });

  test("getRoleModels('D', 'parent') returns models with ageBands including 'D' and targetAudience parent or both", () => {
    const results = getRoleModels('D', 'parent');
    results.forEach(m => {
      expect(m.ageBands).toContain('D');
      expect(['parent', 'both']).toContain(m.targetAudience);
    });
  });

  test("getRoleModels('B', 'child') returns only child/both models with band B", () => {
    const results = getRoleModels('B', 'child');
    results.forEach(m => {
      expect(m.ageBands).toContain('B');
      expect(['child', 'both']).toContain(m.targetAudience);
    });
  });

  test("getRoleModelById('KR-01') returns Chung Juyoung model with correct name", () => {
    const model = getRoleModelById('KR-01');
    expect(model).toBeDefined();
    expect(model?.id).toBe('KR-01');
    expect(model?.name).toBeTruthy();
  });

  test("getRoleModelById('GL-01') has linkedGoalAmount defined", () => {
    const model = getRoleModelById('GL-01');
    expect(model).toBeDefined();
    expect(model?.linkedGoalAmount).toBeDefined();
  });

  test("getRoleModelById('nonexistent') returns undefined", () => {
    const model = getRoleModelById('nonexistent');
    expect(model).toBeUndefined();
  });

  test('All models have exactly 3 keyHabits', () => {
    ROLE_MODELS.forEach(m => {
      expect(m.keyHabits).toHaveLength(3);
    });
  });

  test('All models have non-empty quote', () => {
    ROLE_MODELS.forEach(m => {
      expect(typeof m.quote).toBe('string');
      expect(m.quote.trim().length).toBeGreaterThan(0);
    });
  });

  test('All models have timeline with at least 1 entry', () => {
    ROLE_MODELS.forEach(m => {
      expect(Array.isArray(m.timeline)).toBe(true);
      expect(m.timeline.length).toBeGreaterThanOrEqual(1);
    });
  });

  test('getMatchedModels(100000) returns at least 1 model', () => {
    const results = getMatchedModels(100000);
    expect(results.length).toBeGreaterThanOrEqual(1);
  });

  test("getAgeComparison(11, 'GL-01') returns object with modelId and modelName", () => {
    const result = getAgeComparison(11, 'GL-01');
    expect(result).toBeDefined();
    expect(result.modelId).toBe('GL-01');
    expect(result.modelName).toBeTruthy();
  });

  test("getAgeComparison('any', 'nonexistent') returns object with null modelAgeEvent", () => {
    const result = getAgeComparison('any' as any, 'nonexistent');
    expect(result).toBeDefined();
    expect(result.modelAgeEvent).toBeNull();
  });

  test("No model quote contains DNA-forbidden words: '통제', '감시', '과소비', '낙인', '훈계'", () => {
    const forbidden = ['통제', '감시', '과소비', '낙인', '훈계'];
    ROLE_MODELS.forEach(m => {
      forbidden.forEach(word => {
        expect(m.quote).not.toContain(word);
      });
    });
  });
});
