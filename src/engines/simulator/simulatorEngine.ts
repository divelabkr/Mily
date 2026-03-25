// ──────────────────────────────────────────────
// simulatorEngine.ts — 목표 저축 시뮬레이터
// 복리 방식 역산 + 밴드별 응원 메시지
// ──────────────────────────────────────────────

import { assertDnaClean } from '../message/dnaFilter';
import { getMilySystemPrompt } from '../message/milyPersona';
import type { AgeBand } from '../message/milyPersona';

// ── 타입 ──────────────────────────────────────

export interface SimulatorInput {
  goalName: string;
  goalAmount: number;     // 목표 금액
  monthlySaving: number;  // 월 저축 가능액
  annualRate?: number;    // 연이율 (기본 0, 교육용)
}

export type Difficulty = 'easy' | 'normal' | 'hard' | 'challenge';

export interface TimelinePoint {
  month: number;
  accumulated: number;
}

export interface SimulatorResult {
  monthsNeeded: number;
  totalSaved: number;
  totalInterest: number;
  difficulty: Difficulty;
  needsWarning: boolean;     // months > 12
  timeline: TimelinePoint[]; // 최대 6 포인트
}

export interface WarningContent {
  title: string;
  body: string;
  options: { label: string; action: 'continue' | 'adjust' }[];
}

export type CheerType = 'goal_set' | 'high_ratio' | 'result_easy' | 'result_normal' | 'result_hard' | 'result_challenge';

export interface CheerMessage {
  message: string;
  emoji: string;
}

// ── 핵심 계산 ─────────────────────────────────

/**
 * 목표 금액 도달 시뮬레이션.
 * 복리 방식: 월 저축 × (1 + 월이율)^n 누적.
 */
export function calculateGoal(input: SimulatorInput): SimulatorResult {
  const { goalAmount, monthlySaving, annualRate = 0 } = input;

  if (monthlySaving <= 0) {
    return {
      monthsNeeded: Infinity,
      totalSaved: 0,
      totalInterest: 0,
      difficulty: 'challenge',
      needsWarning: true,
      timeline: [],
    };
  }

  const monthlyRate = annualRate / 12;
  let accumulated = 0;
  let month = 0;
  const timeline: TimelinePoint[] = [];

  while (accumulated < goalAmount && month < 120) {
    month++;
    accumulated = accumulated * (1 + monthlyRate) + monthlySaving;

    // 타임라인 포인트 (최대 6개: 매 20% 진행마다)
    const progress = accumulated / goalAmount;
    const milestones = [0.2, 0.4, 0.6, 0.8, 1.0];
    if (timeline.length < 6 && milestones.some((m) => {
      const prev = timeline.length > 0 ? timeline[timeline.length - 1].accumulated / goalAmount : 0;
      return prev < m && progress >= m;
    })) {
      timeline.push({ month, accumulated: Math.min(accumulated, goalAmount) });
    }
  }

  // 마지막 포인트 추가
  if (timeline.length === 0 || timeline[timeline.length - 1].month !== month) {
    timeline.push({ month, accumulated: Math.min(accumulated, goalAmount) });
  }

  const monthsNeeded = month;
  const totalSaved = monthlySaving * monthsNeeded;
  const totalInterest = Math.max(0, accumulated - totalSaved);

  const difficulty: Difficulty =
    monthsNeeded <= 3 ? 'easy' :
    monthsNeeded <= 6 ? 'normal' :
    monthsNeeded <= 12 ? 'hard' : 'challenge';

  return {
    monthsNeeded,
    totalSaved,
    totalInterest: Math.round(totalInterest),
    difficulty,
    needsWarning: monthsNeeded > 12,
    timeline,
  };
}

// ── 12개월 초과 경고 ──────────────────────────

export function getWarningContent(result: SimulatorResult, goalName: string): WarningContent {
  return {
    title: `${goalName} 달성까지 ${result.monthsNeeded}개월이 필요해요`,
    body: '1년 이상 걸리는 목표예요. 목표 금액을 줄이거나 저축 금액을 늘려볼 수도 있어요.',
    options: [
      { label: '그래도 도전할래요 💪', action: 'continue' },
      { label: '목표를 바꿀게요', action: 'adjust' },
    ],
  };
}

// ── 응원 메시지 (밴드별 톤) ───────────────────

const CHEER_TEMPLATES: Record<CheerType, Record<AgeBand, CheerMessage>> = {
  goal_set: {
    A: { message: '우와, 목표를 정했구나! 같이 모아보자! 🚀', emoji: '🎯' },
    B: { message: '목표 설정 완료! 매달 조금씩 모아볼까?', emoji: '🎯' },
    C: { message: '목표 잡았네. ㄹㅇ 시작이 반이야.', emoji: '🎯' },
    D: { message: '목표가 생겼네요. 꾸준히 해봐요.', emoji: '🎯' },
  },
  high_ratio: {
    A: { message: '벌써 이만큼 모았어?! 대단해! ✨', emoji: '📈' },
    B: { message: '오~ 저축 비율 높다! 잘하고 있어!', emoji: '📈' },
    C: { message: '솔직히 이 정도면 잘하고 있는 거야.', emoji: '📈' },
    D: { message: '저축 비율이 높네요. 괜찮은 흐름이에요.', emoji: '📈' },
  },
  result_easy: {
    A: { message: '짱이다! 금방 모을 수 있겠어! 🎉', emoji: '✅' },
    B: { message: '이거 쉬운 목표인데? 금방 달성하겠다!', emoji: '✅' },
    C: { message: '인정, 이건 무난하게 갈 수 있어.', emoji: '✅' },
    D: { message: '충분히 달성 가능한 목표예요.', emoji: '✅' },
  },
  result_normal: {
    A: { message: '조금만 더 모으면 돼! 파이팅! 💪', emoji: '🙂' },
    B: { message: '적당한 도전이야. 꾸준히 해보자!', emoji: '🙂' },
    C: { message: '나쁘지 않은 도전이야. 해볼 만해.', emoji: '🙂' },
    D: { message: '합리적인 목표예요. 계획대로 해봐요.', emoji: '🙂' },
  },
  result_hard: {
    A: { message: '큰 목표구나! 천천히 같이 가보자! 🌟', emoji: '💪' },
    B: { message: '좀 걸리겠지만 해볼 만해! 응원할게!', emoji: '💪' },
    C: { message: '쉽진 않겠지만, 하면 되는 거 알지?', emoji: '💪' },
    D: { message: '도전적인 목표예요. 중간에 점검해봐요.', emoji: '💪' },
  },
  result_challenge: {
    A: { message: '엄청 큰 꿈이구나! 조금씩 가보자!', emoji: '🏔️' },
    B: { message: '와 큰 목표! 중간에 쉬어가도 괜찮아!', emoji: '🏔️' },
    C: { message: '솔직히 길어. 근데 시작하는 게 중요해.', emoji: '🏔️' },
    D: { message: '장기 목표네요. 월 저축액을 조정해볼 수도 있어요.', emoji: '🏔️' },
  },
};

/**
 * 시뮬레이션 결과 + 밴드에 맞는 응원 메시지.
 * filterDna() 통과 필수.
 */
export function getCheerMessage(type: CheerType, band: AgeBand = 'D'): CheerMessage {
  const msg = CHEER_TEMPLATES[type][band];
  assertDnaClean(msg.message);
  return msg;
}

/**
 * SimulatorResult → 적절한 CheerType 결정.
 */
export function getCheerTypeFromResult(result: SimulatorResult): CheerType {
  switch (result.difficulty) {
    case 'easy': return 'result_easy';
    case 'normal': return 'result_normal';
    case 'hard': return 'result_hard';
    case 'challenge': return 'result_challenge';
  }
}
