// ──────────────────────────────────────────────
// simulatorV2.test.ts — GoalSimulator 엔진 테스트
// ──────────────────────────────────────────────

import {
  calculateGoal,
  getWarningContent,
  getCheerMessage,
  getCheerTypeFromResult,
  SimulatorInput,
  SimulatorResult,
  CheerType,
} from '../src/engines/simulator/simulatorEngine';

jest.mock('../src/engines/message/dnaFilter', () => ({
  assertDnaClean: jest.fn(),
  filterDna: jest.fn(() => ({ passed: true, violations: [] })),
}));

// ── calculateGoal ─────────────────────────────

describe('calculateGoal', () => {
  it('1. monthlySaving=0 → Infinity months, difficulty=challenge', () => {
    const input: SimulatorInput = {
      goalName: '자전거',
      goalAmount: 50000,
      monthlySaving: 0,
    };
    const result = calculateGoal(input);
    expect(result.monthsNeeded).toBe(Infinity);
    expect(result.difficulty).toBe('challenge');
  });

  it('2. goalAmount=10000, monthlySaving=5000 → monthsNeeded=2, difficulty=easy', () => {
    const input: SimulatorInput = {
      goalName: '책',
      goalAmount: 10000,
      monthlySaving: 5000,
    };
    const result = calculateGoal(input);
    expect(result.monthsNeeded).toBe(2);
    expect(result.difficulty).toBe('easy');
  });

  it('3. goalAmount=30000, monthlySaving=5000 → monthsNeeded=6, difficulty=normal', () => {
    const input: SimulatorInput = {
      goalName: '운동화',
      goalAmount: 30000,
      monthlySaving: 5000,
    };
    const result = calculateGoal(input);
    expect(result.monthsNeeded).toBe(6);
    expect(result.difficulty).toBe('normal');
  });

  it('4. goalAmount=60000, monthlySaving=5000 → monthsNeeded=12, difficulty=hard', () => {
    const input: SimulatorInput = {
      goalName: '노트북 부품',
      goalAmount: 60000,
      monthlySaving: 5000,
    };
    const result = calculateGoal(input);
    expect(result.monthsNeeded).toBe(12);
    expect(result.difficulty).toBe('hard');
  });

  it('5. goalAmount=100000, monthlySaving=5000 → needsWarning=true, difficulty=challenge', () => {
    const input: SimulatorInput = {
      goalName: '태블릿',
      goalAmount: 100000,
      monthlySaving: 5000,
    };
    const result = calculateGoal(input);
    expect(result.needsWarning).toBe(true);
    expect(result.difficulty).toBe('challenge');
  });

  it('6. annualRate=0.12 → totalInterest > 0', () => {
    const input: SimulatorInput = {
      goalName: '게임기',
      goalAmount: 60000,
      monthlySaving: 5000,
      annualRate: 0.12,
    };
    const result = calculateGoal(input);
    expect(result.totalInterest).toBeGreaterThan(0);
  });

  it('7. timeline has max 6 points', () => {
    const input: SimulatorInput = {
      goalName: '여행',
      goalAmount: 120000,
      monthlySaving: 1000,
    };
    const result = calculateGoal(input);
    expect(result.timeline.length).toBeLessThanOrEqual(6);
  });

  it('15. timeline points are monotonically increasing in accumulated', () => {
    const input: SimulatorInput = {
      goalName: '카메라',
      goalAmount: 50000,
      monthlySaving: 3000,
    };
    const result = calculateGoal(input);
    for (let i = 1; i < result.timeline.length; i++) {
      expect(result.timeline[i].accumulated).toBeGreaterThanOrEqual(
        result.timeline[i - 1].accumulated,
      );
    }
  });
});

// ── getWarningContent ─────────────────────────

describe('getWarningContent', () => {
  const mockResult: SimulatorResult = {
    monthsNeeded: 24,
    totalSaved: 120000,
    totalInterest: 0,
    difficulty: 'challenge',
    needsWarning: true,
    timeline: [],
  };

  it('8. returns title with goalName, has 2 options', () => {
    const content = getWarningContent(mockResult, '노트북');
    expect(content.title).toContain('노트북');
    expect(content.options).toHaveLength(2);
  });

  it('9. options include continue and adjust actions', () => {
    const content = getWarningContent(mockResult, '노트북');
    const actions = content.options.map((o) => o.action);
    expect(actions).toContain('continue');
    expect(actions).toContain('adjust');
  });
});

// ── getCheerMessage ───────────────────────────

describe('getCheerMessage', () => {
  it('10. band A has emoji and message', () => {
    const cheer = getCheerMessage('goal_set', 'A');
    expect(typeof cheer.message).toBe('string');
    expect(cheer.message.length).toBeGreaterThan(0);
    expect(typeof cheer.emoji).toBe('string');
    expect(cheer.emoji.length).toBeGreaterThan(0);
  });

  it('11. all 4 bands work for goal_set', () => {
    const bands = ['A', 'B', 'C', 'D'] as const;
    for (const band of bands) {
      const cheer = getCheerMessage('goal_set', band);
      expect(cheer.message).toBeTruthy();
      expect(cheer.emoji).toBeTruthy();
    }
  });

  it('12. all 6 CheerTypes work for band D', () => {
    const types: CheerType[] = [
      'goal_set',
      'high_ratio',
      'result_easy',
      'result_normal',
      'result_hard',
      'result_challenge',
    ];
    for (const type of types) {
      const cheer = getCheerMessage(type, 'D');
      expect(cheer.message).toBeTruthy();
      expect(cheer.emoji).toBeTruthy();
    }
  });

  it('14. messages do not contain DNA-forbidden words', () => {
    const forbiddenWords = ['과소비', '통제', '줄이세요'];
    const types: CheerType[] = [
      'goal_set',
      'high_ratio',
      'result_easy',
      'result_normal',
      'result_hard',
      'result_challenge',
    ];
    const bands = ['A', 'B', 'C', 'D'] as const;

    for (const type of types) {
      for (const band of bands) {
        const cheer = getCheerMessage(type, band);
        for (const word of forbiddenWords) {
          expect(cheer.message).not.toContain(word);
        }
      }
    }
  });
});

// ── getCheerTypeFromResult ────────────────────

describe('getCheerTypeFromResult', () => {
  it('13. difficulty maps to correct CheerType', () => {
    const cases: { difficulty: SimulatorResult['difficulty']; expected: CheerType }[] = [
      { difficulty: 'easy', expected: 'result_easy' },
      { difficulty: 'normal', expected: 'result_normal' },
      { difficulty: 'hard', expected: 'result_hard' },
      { difficulty: 'challenge', expected: 'result_challenge' },
    ];

    for (const { difficulty, expected } of cases) {
      const mockResult: SimulatorResult = {
        monthsNeeded: 1,
        totalSaved: 0,
        totalInterest: 0,
        difficulty,
        needsWarning: false,
        timeline: [],
      };
      expect(getCheerTypeFromResult(mockResult)).toBe(expected);
    }
  });
});
