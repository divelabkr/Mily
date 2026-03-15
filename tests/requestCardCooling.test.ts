/**
 * requestCardCooling.test.ts
 * 구매 전 냉각 장치 단위 테스트
 */

import {
  createDefaultCoolingAnswers,
  isCoolingComplete,
  buildCoolingContext,
  trackCoolingCompleted,
  COOLING_QUESTIONS,
} from '../src/engines/requestCard/coolingService';

// posthog 모킹
const mockCapture = jest.fn();
jest.mock('../src/engines/monitoring/posthogService', () => ({
  capture: (...args: unknown[]) => mockCapture(...args),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

// ──────────────────────────────────────────────
// 1. COOLING_QUESTIONS 구조
// ──────────────────────────────────────────────

describe('COOLING_QUESTIONS', () => {
  it('3개 질문이 있어야 함', () => {
    expect(COOLING_QUESTIONS).toHaveLength(3);
  });

  it('질문 유형: text / choice / text 순서', () => {
    expect(COOLING_QUESTIONS[0].type).toBe('text');
    expect(COOLING_QUESTIONS[1].type).toBe('choice');
    expect(COOLING_QUESTIONS[2].type).toBe('text');
  });

  it('판단/훈계형 표현 없음', () => {
    for (const q of COOLING_QUESTIONS) {
      expect(q.question).not.toContain('잘못');
      expect(q.question).not.toContain('낭비');
      expect(q.question).not.toContain('안 돼');
    }
  });
});

// ──────────────────────────────────────────────
// 2. createDefaultCoolingAnswers()
// ──────────────────────────────────────────────

describe('createDefaultCoolingAnswers()', () => {
  it('기본값 skipped=false', () => {
    const answers = createDefaultCoolingAnswers();
    expect(answers.skipped).toBe(false);
    expect(answers.whyNeeded).toBe('');
    expect(answers.alternatives).toBe('');
    expect(answers.urgency).toBe('now');
  });
});

// ──────────────────────────────────────────────
// 3. isCoolingComplete()
// ──────────────────────────────────────────────

describe('isCoolingComplete()', () => {
  it('skipped=true이면 완료', () => {
    const answers = { ...createDefaultCoolingAnswers(), skipped: true };
    expect(isCoolingComplete(answers)).toBe(true);
  });

  it('whyNeeded 있으면 완료', () => {
    const answers = { ...createDefaultCoolingAnswers(), whyNeeded: '운동하려고요' };
    expect(isCoolingComplete(answers)).toBe(true);
  });

  it('whyNeeded 비어있고 skipped=false이면 미완료', () => {
    const answers = createDefaultCoolingAnswers();
    expect(isCoolingComplete(answers)).toBe(false);
  });
});

// ──────────────────────────────────────────────
// 4. buildCoolingContext()
// ──────────────────────────────────────────────

describe('buildCoolingContext()', () => {
  it('skipped=true이면 빈 문자열', () => {
    const answers = { ...createDefaultCoolingAnswers(), skipped: true };
    expect(buildCoolingContext(answers)).toBe('');
  });

  it('답변 있으면 컨텍스트 문자열 생성', () => {
    const answers = {
      ...createDefaultCoolingAnswers(),
      whyNeeded: '운동화가 닳아서요',
      alternatives: '중고도 찾아봤어요',
    };
    const ctx = buildCoolingContext(answers);
    expect(ctx).toContain('운동화가 닳아서요');
    expect(ctx).toContain('중고도 찾아봤어요');
  });

  it('whyNeeded만 있어도 컨텍스트 생성', () => {
    const answers = {
      ...createDefaultCoolingAnswers(),
      whyNeeded: '필요해요',
    };
    const ctx = buildCoolingContext(answers);
    expect(ctx).toContain('필요해요');
  });
});

// ──────────────────────────────────────────────
// 5. trackCoolingCompleted()
// ──────────────────────────────────────────────

describe('trackCoolingCompleted()', () => {
  it('posthog capture 호출', () => {
    const answers = { ...createDefaultCoolingAnswers(), whyNeeded: '필요해요' };
    trackCoolingCompleted(answers, 'purchase_check');

    expect(mockCapture).toHaveBeenCalledWith(
      'purchase_cooling_completed',
      expect.objectContaining({ requestType: 'purchase_check', skipped: false })
    );
  });

  it('skipped=true이면 skipped 이벤트 기록', () => {
    const answers = { ...createDefaultCoolingAnswers(), skipped: true };
    trackCoolingCompleted(answers, 'purchase_check');

    expect(mockCapture).toHaveBeenCalledWith(
      'purchase_cooling_completed',
      expect.objectContaining({ skipped: true })
    );
  });
});
