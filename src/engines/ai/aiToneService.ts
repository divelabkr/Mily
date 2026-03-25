import Anthropic from '@anthropic-ai/sdk';
import {
  WEEKLY_REVIEW_SYSTEM_PROMPT,
  buildWeeklyReviewUserMessage,
  WeeklyReviewInput,
  WeeklyReviewOutput,
} from './prompts/weeklyReview';
import {
  REQUEST_BUFFER_SYSTEM_PROMPT,
  buildRequestBufferUserMessage,
  RequestBufferInput,
  RequestBufferOutput,
} from './prompts/requestBuffer';
import { buildFallbackReview, buildFallbackBufferedText } from './fallback';

const AI_TIMEOUT_MS = 10000;
const AI_MODEL = 'claude-haiku-4-5-20251001';

// Anthropic SDK는 Cloud Functions에서만 실행 (API 키 보호)
// React Native 클라이언트에서 직접 호출 금지
function createClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY not set');
  }
  return new Anthropic({ apiKey });
}

export async function generateWeeklyReview(
  input: WeeklyReviewInput
): Promise<WeeklyReviewOutput> {
  try {
    const client = createClient();

    let timer: ReturnType<typeof setTimeout>;
    const response = await Promise.race([
      client.messages.create({
        model: AI_MODEL,
        max_tokens: 512,
        system: WEEKLY_REVIEW_SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: buildWeeklyReviewUserMessage(input),
          },
        ],
      }),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error('timeout')), AI_TIMEOUT_MS);
      }),
    ]).finally(() => clearTimeout(timer));

    const text =
      response.content[0].type === 'text' ? response.content[0].text : '';
    const parsed = JSON.parse(text) as WeeklyReviewOutput;

    // 금지 표현 검사
    validateAiOutput(parsed.good + parsed.leak + parsed.suggestion);

    return parsed;
  } catch {
    return buildFallbackReview(input);
  }
}

export async function bufferRequestText(
  input: RequestBufferInput
): Promise<RequestBufferOutput> {
  try {
    const client = createClient();

    let timer2: ReturnType<typeof setTimeout>;
    const response = await Promise.race([
      client.messages.create({
        model: AI_MODEL,
        max_tokens: 256,
        system: REQUEST_BUFFER_SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: buildRequestBufferUserMessage(input),
          },
        ],
      }),
      new Promise<never>((_, reject) => {
        timer2 = setTimeout(() => reject(new Error('timeout')), AI_TIMEOUT_MS);
      }),
    ]).finally(() => clearTimeout(timer2));

    const text =
      response.content[0].type === 'text' ? response.content[0].text : '';
    return JSON.parse(text) as RequestBufferOutput;
  } catch {
    return { bufferedText: buildFallbackBufferedText(input.originalText) };
  }
}

// ──────────────────────────────────────────────
// AI 출력 금지 표현 검증
// ──────────────────────────────────────────────

const FORBIDDEN_PATTERNS = [
  /과소비/,
  /문제가 있/,
  /줄이세요/,
  /하지 마세요/,
  /\d+점/,
  /[A-F]등급/,
  /통제/,
  /감시/,
  /훈계/,
];

function validateAiOutput(text: string): void {
  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(text)) {
      throw new Error(`AI output contains forbidden pattern: ${pattern}`);
    }
  }
}
