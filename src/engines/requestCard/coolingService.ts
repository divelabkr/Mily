// ──────────────────────────────────────────────
// coolingService.ts — 구매 전 냉각 장치
// purchase_check 전용. 강요 금지. "그냥 보내기" 옵션 유지.
// 점수화/판단 절대 금지 — 질문형만.
// ──────────────────────────────────────────────

import { capture } from '../monitoring/posthogService';

export interface CoolingAnswers {
  whyNeeded: string;       // Q1: 왜 필요한가요?
  urgency: 'now' | 'later'; // Q2: 지금 꼭 필요한가요?
  alternatives: string;   // Q3: 다른 방법은 없나요?
  skipped: boolean;        // "그냥 보내기" 선택 여부
}

export const COOLING_QUESTIONS = [
  {
    id: 'whyNeeded',
    question: '왜 필요한가요?',
    type: 'text' as const,
    placeholder: '자유롭게 적어봐요.',
  },
  {
    id: 'urgency',
    question: '지금 꼭 필요한가요?',
    type: 'choice' as const,
    options: [
      { value: 'now', label: '네, 지금 필요해요' },
      { value: 'later', label: '나중에도 괜찮아요' },
    ],
  },
  {
    id: 'alternatives',
    question: '다른 방법은 없나요?',
    type: 'text' as const,
    placeholder: '빌리기, 나눠 사기, 기다리기 등 생각해봤나요?',
  },
] as const;

export function createDefaultCoolingAnswers(): CoolingAnswers {
  return {
    whyNeeded: '',
    urgency: 'now',
    alternatives: '',
    skipped: false,
  };
}

export function isCoolingComplete(answers: CoolingAnswers): boolean {
  if (answers.skipped) return true;
  return answers.whyNeeded.trim().length > 0;
}

export function trackCoolingCompleted(
  answers: CoolingAnswers,
  requestType: string
): void {
  capture('purchase_cooling_completed', {
    requestType,
    skipped: answers.skipped,
    urgency: answers.skipped ? null : answers.urgency,
    hasAlternatives: answers.skipped ? false : answers.alternatives.trim().length > 0,
  });
}

// 냉각 답변 → 요청 카드 텍스트에 앞에 붙이는 컨텍스트 (선택)
// 강요 아님 — 호출 측에서 활용 여부 결정
export function buildCoolingContext(answers: CoolingAnswers): string {
  if (answers.skipped) return '';
  const lines: string[] = [];
  if (answers.whyNeeded.trim()) {
    lines.push(`이유: ${answers.whyNeeded.trim()}`);
  }
  if (answers.alternatives.trim()) {
    lines.push(`고민해본 것: ${answers.alternatives.trim()}`);
  }
  return lines.join('\n');
}
