import {
  DREAM_SCENARIOS, getDreamScenarios, getDreamById,
  calculateTimeToAchieve,
} from '../src/engines/millionaire/dreamScenarioService';

describe('dreamScenarioService', () => {
  test('DREAM_SCENARIOS has exactly 10 entries', () => {
    expect(DREAM_SCENARIOS).toHaveLength(10);
  });

  test('All scenarios have id, title, emoji, description, priceSource, funFact', () => {
    DREAM_SCENARIOS.forEach(s => {
      expect(typeof s.id).toBe('string');
      expect(s.id.trim().length).toBeGreaterThan(0);
      expect(typeof s.title).toBe('string');
      expect(s.title.trim().length).toBeGreaterThan(0);
      expect(typeof s.emoji).toBe('string');
      expect(s.emoji.trim().length).toBeGreaterThan(0);
      expect(typeof s.description).toBe('string');
      expect(s.description.trim().length).toBeGreaterThan(0);
      expect(typeof s.priceSource).toBe('string');
      expect(s.priceSource.trim().length).toBeGreaterThan(0);
      expect(typeof s.funFact).toBe('string');
      expect(s.funFact.trim().length).toBeGreaterThan(0);
    });
  });

  test("getDreamScenarios('A') returns subset (only band A compatible)", () => {
    const results = getDreamScenarios('A');
    expect(Array.isArray(results)).toBe(true);
    results.forEach(s => {
      expect(s.targetBands).toContain('A');
    });
  });

  test("getDreamScenarios('D') returns different set from band A", () => {
    const bandA = getDreamScenarios('A').map(s => s.id).sort();
    const bandD = getDreamScenarios('D').map(s => s.id).sort();
    expect(JSON.stringify(bandA)).not.toBe(JSON.stringify(bandD));
  });

  test("getDreamById('DS-01') returns the castle scenario with emoji '🏰'", () => {
    const scenario = getDreamById('DS-01');
    expect(scenario).toBeDefined();
    expect(scenario?.id).toBe('DS-01');
    expect(scenario?.emoji).toBe('🏰');
  });

  test("getDreamById('nonexistent') returns undefined", () => {
    const scenario = getDreamById('nonexistent');
    expect(scenario).toBeUndefined();
  });

  test('calculateTimeToAchieve with DS-02 (500M) and 500000/month = reasonable months', () => {
    const scenario = getDreamById('DS-02');
    expect(scenario).toBeDefined();
    const months = calculateTimeToAchieve(scenario!, 500000);
    expect(months).toBeGreaterThan(0);
    expect(months).toBeLessThan(100000);
    expect(isFinite(months)).toBe(true);
  });

  test('calculateTimeToAchieve with monthlySaving=0 returns Infinity', () => {
    const scenario = getDreamById('DS-02');
    expect(scenario).toBeDefined();
    const months = calculateTimeToAchieve(scenario!.price, 0);
    expect(months).toBe(Infinity);
  });

  test('calculateTimeToAchieve with DS-04 (price=0) returns 0', () => {
    const scenario = getDreamById('DS-04');
    expect(scenario).toBeDefined();
    const months = calculateTimeToAchieve(scenario!, 500000);
    expect(months).toBe(0);
  });

  test("No scenario funFact contains DNA-forbidden words: '문제', '잘못', '나쁜', '훈계', '낙인'", () => {
    const forbidden = ['문제', '잘못', '나쁜', '훈계', '낙인'];
    DREAM_SCENARIOS.forEach(s => {
      forbidden.forEach(word => {
        expect(s.funFact).not.toContain(word);
      });
    });
  });
});
