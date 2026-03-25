// ──────────────────────────────────────────────
// reportService.ts — 역할 기반 리포트 생성
// 3 roles × 2 periods = 6 report types
// AI 10초 타임아웃 → 규칙 기반 폴백
// ──────────────────────────────────────────────

import Anthropic from '@anthropic-ai/sdk';
import {
  ReportInput,
  ReportOutput,
  AgeBand,
} from './reportTypes';
import {
  getReportSystemPrompt,
  buildReportUserMessage,
} from './reportPrompts';
import { getEconomyTip } from './economyTips';
import { filterDna } from '../message/dnaFilter';

const AI_TIMEOUT_MS = 10000;
const AI_MODEL = 'claude-haiku-4-5-20251001';

// ──────────────────────────────────────────────
// AI 클라이언트
// ──────────────────────────────────────────────

function createClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set');
  return new Anthropic({ apiKey });
}

// ──────────────────────────────────────────────
// 금지 표현 검증
// ──────────────────────────────────────────────

const FORBIDDEN_PATTERNS = [
  /문제가 있/,
  /줄이세요/,
  /하지 마세요/,
  /\d+점/,
  /[A-F]등급/,
  /통제/,
  /훈계/,
  /과소비/,
];

function validateReportOutput(output: ReportOutput): void {
  const fullText = [output.headline, ...output.highlights, output.suggestion].join(' ');
  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(fullText)) {
      throw new Error(`Report contains forbidden pattern: ${pattern}`);
    }
  }
}

// ──────────────────────────────────────────────
// 폴백 리포트 (AI 실패 시)
// ──────────────────────────────────────────────

function buildFallbackReport(input: ReportInput): ReportOutput {
  const isChild = input.role === 'child';
  const periodLabel = input.period === 'weekly' ? '이번 주' : '이번 달';

  const headline = isChild
    ? `${periodLabel} 용돈 기록을 남겼어요!`
    : `${periodLabel} 소비를 돌아봤어요.`;

  const highlights: string[] = [];
  if (input.totalSpent <= input.totalBudget) {
    highlights.push(`${periodLabel} 예산 범위 안에서 사용했어요.`);
  } else {
    highlights.push(`${periodLabel} 소비를 확인해봐요.`);
  }

  const sorted = [...input.categories].sort((a, b) => {
    const ra = a.planned > 0 ? a.actual / a.planned : 2;
    const rb = b.planned > 0 ? b.actual / b.planned : 2;
    return ra - rb;
  });
  if (sorted[0]) {
    highlights.push(`${sorted[0].label} 예산을 잘 지켰어요.`);
  }

  const worst = sorted[sorted.length - 1];
  const suggestion = worst
    ? `다음 ${input.period === 'weekly' ? '주' : '달'}에는 ${worst.label} 예산을 조정해볼까요?`
    : `다음 ${input.period === 'weekly' ? '주' : '달'}도 꾸준히 기록해볼까요?`;

  const result: ReportOutput = {
    role: input.role,
    period: input.period,
    headline,
    highlights,
    suggestion,
    aiUsed: false,
  };

  if (input.role === 'child' && input.ageBand) {
    const tip = getEconomyTip(input.ageBand);
    result.economyTip = `💡 오늘의 경제 개념: ${tip.concept} — ${tip.body}`;
  }

  return result;
}

// ──────────────────────────────────────────────
// 리포트 생성
// ──────────────────────────────────────────────

export async function generateReport(input: ReportInput): Promise<ReportOutput> {
  try {
    const client = createClient();
    const systemPrompt = getReportSystemPrompt(input.role, input.period);
    const userMessage = buildReportUserMessage(input);

    let timer: ReturnType<typeof setTimeout>;
    const response = await Promise.race([
      client.messages.create({
        model: AI_MODEL,
        max_tokens: 512,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      }),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error('timeout')), AI_TIMEOUT_MS);
      }),
    ]).finally(() => clearTimeout(timer));

    const text =
      response.content[0].type === 'text' ? response.content[0].text : '';
    const parsed = JSON.parse(text) as {
      headline: string;
      highlights: string[];
      suggestion: string;
    };

    const output: ReportOutput = {
      role: input.role,
      period: input.period,
      headline: parsed.headline,
      highlights: parsed.highlights,
      suggestion: parsed.suggestion,
      aiUsed: true,
    };

    if (input.role === 'child' && input.ageBand) {
      const tip = getEconomyTip(input.ageBand);
      output.economyTip = `💡 오늘의 경제 개념: ${tip.concept} — ${tip.body}`;
    }

    validateReportOutput(output);

    // filterDna 통과 필수
    const fullText = [output.headline, ...output.highlights, output.suggestion].join(' ');
    const dnaResult = filterDna(fullText);
    if (!dnaResult.passed) {
      return buildFallbackReport(input);
    }

    return output;
  } catch {
    return buildFallbackReport(input);
  }
}

// ──────────────────────────────────────────────
// 헬퍼: 주차 인덱스 계산 (경제 팁 순환용)
// ──────────────────────────────────────────────

export function weekIndexFromId(weekId: string): number {
  // "YYYY-Www" → week number
  const parts = weekId.split('-W');
  if (parts.length < 2) return 0;
  return parseInt(parts[1], 10) - 1;
}
