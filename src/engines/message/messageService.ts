// ──────────────────────────────────────────────
// messageService.ts — 통합 메시지 오케스트레이터
// Grade A: Haiku + milyPersona
// Grade B: 템플릿 풀 랜덤
// Grade C: 하드코딩
// 모든 Grade A/B 출력 → filterDna() 통과 필수
// ──────────────────────────────────────────────

import Anthropic from '@anthropic-ai/sdk';
import { getMilySystemPrompt, getAgeBand } from './milyPersona';
import type { AgeBand } from './milyPersona';
import { assertDnaClean } from './dnaFilter';
import type { WeeklyReviewInput } from '../ai/prompts/weeklyReview';
import type { RequestBufferInput } from '../ai/prompts/requestBuffer';

const AI_MODEL = 'claude-haiku-4-5-20251001';
const AI_TIMEOUT_MS = 10000;

function createClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set');
  return new Anthropic({ apiKey });
}

// ── 공통 타입 ─────────────────────────────────

export interface MessageOutput {
  message: string;
  emoji: string;
}

export interface MessageContext {
  band?: AgeBand;
  role?: 'parent' | 'child';
  age?: number;
}

function resolveBand(ctx?: MessageContext): AgeBand {
  if (ctx?.band) return ctx.band;
  if (ctx?.age) return getAgeBand(ctx.age);
  return 'D';
}

async function callHaiku(
  systemPrompt: string,
  userMessage: string,
  maxTokens = 256
): Promise<MessageOutput> {
  const client = createClient();
  let timer: ReturnType<typeof setTimeout>;
  const response = await Promise.race([
    client.messages.create({
      model: AI_MODEL,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    }),
    new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error('timeout')), AI_TIMEOUT_MS);
    }),
  ]).finally(() => clearTimeout(timer));
  const text =
    response.content[0].type === 'text' ? response.content[0].text : '';
  const parsed = JSON.parse(text) as MessageOutput;
  assertDnaClean(parsed.message);
  return parsed;
}

// ══════════════════════════════════════════════
// GRADE A — Haiku 호출
// ══════════════════════════════════════════════

export interface DailySummaryInsightInput {
  date: string;
  totalAmount: number;
  choiceAmount: number;
  checkInCount: number;
}

/**
 * 일별 지출 요약 → 밀리 한 줄 인사이트.
 * 홈 화면 AI 한 줄 영역에 사용.
 */
export async function getWeeklyReview(
  input: WeeklyReviewInput,
  ctx?: MessageContext
): Promise<MessageOutput> {
  const band = resolveBand(ctx);
  const fallback = buildFallbackMessage(
    input.totalSpent <= input.totalBudget
      ? '이번 주 예산을 잘 지켜냈어요.'
      : '이번 주도 수고했어요.',
    '✨'
  );
  try {
    return await callHaiku(
      getMilySystemPrompt(band),
      JSON.stringify({ type: 'weekly_review', data: input }),
      512
    );
  } catch {
    return fallback;
  }
}

/**
 * 요청 카드 원문 → AI 완충 텍스트.
 * CLAUDE.md: 의도 유지, 금액→"추가 예산", 1~2문장.
 */
export async function getRequestCardBuffer(
  input: RequestBufferInput,
  ctx?: MessageContext
): Promise<MessageOutput> {
  const band = resolveBand(ctx);
  const fallback = buildFallbackMessage(input.originalText, '📝');
  try {
    return await callHaiku(
      getMilySystemPrompt(band),
      JSON.stringify({ type: 'request_buffer', data: input })
    );
  } catch {
    return fallback;
  }
}

/**
 * 일별 요약 데이터 → 인사이트 메시지.
 */
export async function getDailySummaryInsight(
  input: DailySummaryInsightInput,
  ctx?: MessageContext
): Promise<MessageOutput> {
  const band = resolveBand(ctx);
  const fallback = buildFallbackMessage('오늘도 잘 기록했어요!', '📊');
  try {
    return await callHaiku(
      getMilySystemPrompt(band),
      JSON.stringify({ type: 'daily_summary', data: input })
    );
  } catch {
    return fallback;
  }
}

export interface ParentChildSignalInput {
  childName: string;
  weekId: string;
  checkInCount: number;
  hadReview: boolean;
}

/**
 * 자녀 활동 데이터 → 부모에게 보여줄 한 줄 시그널.
 * 자녀의 상세 금액/상호명 노출 없이 행동 패턴만.
 */
export async function getParentChildSignal(
  input: ParentChildSignalInput,
  ctx?: MessageContext
): Promise<MessageOutput> {
  const band: AgeBand = 'D'; // 부모에게는 항상 Band D
  const fallback = buildFallbackMessage(
    `${input.childName}이(가) 이번 주 꾸준히 기록했어요.`,
    '👨‍👩‍👧'
  );
  try {
    return await callHaiku(
      getMilySystemPrompt(band),
      JSON.stringify({ type: 'parent_child_signal', data: input })
    );
  } catch {
    return fallback;
  }
}

export interface ReconcileProposalInput {
  month: string;
  planned: number;
  actual: number;
  topChoiceCategory: string;
}

/**
 * 월간 정산 데이터 → 다음 달 조정 제안.
 * choice 우선 코칭, fixed 언급 금지.
 */
export async function getReconcileProposal(
  input: ReconcileProposalInput,
  ctx?: MessageContext
): Promise<MessageOutput> {
  const band = resolveBand(ctx);
  const isOver = input.actual > input.planned;
  const fallback = buildFallbackMessage(
    isOver
      ? `다음 달 ${input.topChoiceCategory} 예산을 조정해볼까요?`
      : '이번 달 계획을 잘 지켜냈어요.',
    '📅'
  );
  try {
    return await callHaiku(
      getMilySystemPrompt(band),
      JSON.stringify({ type: 'reconcile_proposal', data: input })
    );
  } catch {
    return fallback;
  }
}

// ══════════════════════════════════════════════
// GRADE B — 템플릿 풀 랜덤
// ══════════════════════════════════════════════

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export interface GreetingContext {
  hour: number;
  streakWeeks: number;
  role: 'parent' | 'child';
  band?: AgeBand;
}

/**
 * 시간대 + 스트릭 + 역할 기반 인사 메시지.
 */
export function getGreeting(ctx: GreetingContext): MessageOutput {
  const { hour, streakWeeks, role } = ctx;

  const timeLabel =
    hour < 6 ? '새벽' : hour < 12 ? '아침' : hour < 18 ? '오후' : '저녁';

  const streakNote =
    streakWeeks >= 4
      ? ` ${streakWeeks}주 연속이에요!`
      : streakWeeks >= 2
      ? ' 꾸준히 하고 있어요.'
      : '';

  const templates =
    role === 'child'
      ? [
          { message: `좋은 ${timeLabel}이에요.${streakNote}`, emoji: '😊' },
          { message: `${timeLabel}에도 밀리 왔네요!${streakNote}`, emoji: '✨' },
          { message: `${timeLabel}에도 기록하러 왔군요!${streakNote}`, emoji: '📝' },
        ]
      : [
          { message: `좋은 ${timeLabel}이에요.${streakNote}`, emoji: '👋' },
          { message: `${timeLabel}에도 확인하러 오셨군요!${streakNote}`, emoji: '☀️' },
          { message: `${timeLabel}에 가족 소비 돌아보러 오셨군요!${streakNote}`, emoji: '💙' },
        ];

  const result = pick(templates);
  assertDnaClean(result.message);
  return result;
}

export type AchievementRarityGrade = 'common' | 'uncommon' | 'rare' | 'epic' | 'hidden';

/**
 * 업적 희귀도별 해금 축하 메시지.
 */
export function getAchievementMessage(rarity: AchievementRarityGrade): MessageOutput {
  const templates: Record<AchievementRarityGrade, MessageOutput[]> = {
    common: [
      { message: '새 업적을 발견했어요!', emoji: '⚪' },
      { message: '기록이 쌓이고 있어요.', emoji: '✅' },
    ],
    uncommon: [
      { message: '꾸준함이 빛나는 순간이에요!', emoji: '🟢' },
      { message: '이런 기록, 쉽지 않은데 해냈네요.', emoji: '🌿' },
    ],
    rare: [
      { message: '도전적인 업적을 달성했어요!', emoji: '🔵' },
      { message: '많은 분들이 발견하지 못한 업적이에요.', emoji: '💎' },
    ],
    epic: [
      { message: '전설적인 업적이에요! 정말 대단해요.', emoji: '🟣' },
      { message: '이 기록, 오래 기억될 것 같아요.', emoji: '🌟' },
    ],
    hidden: [
      { message: '숨겨진 업적을 찾아냈어요!', emoji: '🟡' },
      { message: '비밀을 발견한 거예요. 특별한 기록이에요.', emoji: '✨' },
    ],
  };

  const result = pick(templates[rarity]);
  assertDnaClean(result.message);
  return result;
}

export type ScreenName = 'home' | 'plan' | 'family' | 'review' | 'checkin' | 'my';

/**
 * 화면별 + 역할별 빈 상태 메시지.
 */
export function getEmptyStateMessage(
  screen: ScreenName,
  role: 'parent' | 'child'
): MessageOutput {
  const map: Record<ScreenName, Record<'parent' | 'child', MessageOutput>> = {
    home: {
      parent: { message: '이번 주 첫 기록을 기다리고 있어요.', emoji: '🏠' },
      child: { message: '첫 기록을 남겨볼까요?', emoji: '✏️' },
    },
    plan: {
      parent: { message: '이번 달 계획을 세워볼까요?', emoji: '📋' },
      child: { message: '이번 주 계획이 아직 없어요.', emoji: '📅' },
    },
    family: {
      parent: { message: '가족을 초대해서 함께 시작해볼까요?', emoji: '👨‍👩‍👧' },
      child: { message: '가족 연결이 되면 카드를 주고받을 수 있어요.', emoji: '💌' },
    },
    review: {
      parent: { message: '이번 주 기록이 생기면 회고할 수 있어요.', emoji: '📊' },
      child: { message: '기록이 쌓이면 돌아볼 거리가 생겨요!', emoji: '🔍' },
    },
    checkin: {
      parent: { message: '오늘의 첫 기록을 남겨볼까요?', emoji: '✅' },
      child: { message: '오늘 뭘 썼는지 기록해볼까요?', emoji: '💸' },
    },
    my: {
      parent: { message: '아직 업적이 없어요. 첫 기록에서 시작돼요!', emoji: '🏆' },
      child: { message: '업적을 모아볼까요? 첫 기록에서 시작해요!', emoji: '🌈' },
    },
  };

  const result = map[screen][role];
  assertDnaClean(result.message);
  return result;
}

export type PraiseSituation =
  | 'budget_kept'       // 예산 지킴
  | 'first_checkin'     // 첫 체크인
  | 'review_done'       // 회고 완료
  | 'request_polite'    // 공손한 요청
  | 'streak';           // 연속 기록

/**
 * 상황별 칭찬 카드 추천 문구 (부모→자녀 발송용).
 */
export function getPraiseRecommendation(
  situation: PraiseSituation
): { type: 'well_saved' | 'good_effort' | 'thank_you'; message: string; emoji: string } {
  const map: Record<
    PraiseSituation,
    { type: 'well_saved' | 'good_effort' | 'thank_you'; message: string; emoji: string }
  > = {
    budget_kept: {
      type: 'well_saved',
      message: '이번 주 예산을 잘 지켜줬어. 고마워!',
      emoji: '💚',
    },
    first_checkin: {
      type: 'good_effort',
      message: '처음 기록한 거 잘했어. 계속 해보자!',
      emoji: '⭐',
    },
    review_done: {
      type: 'good_effort',
      message: '스스로 돌아본 거 멋져. 수고했어!',
      emoji: '✨',
    },
    request_polite: {
      type: 'thank_you',
      message: '이렇게 이야기해줘서 고마워. 같이 생각해볼게.',
      emoji: '💌',
    },
    streak: {
      type: 'good_effort',
      message: '꾸준히 기록하고 있구나. 정말 잘하고 있어!',
      emoji: '🌟',
    },
  };

  const result = map[situation];
  assertDnaClean(result.message);
  return result;
}

export type CheerType =
  | 'goal_set'          // 계획 세움
  | 'high_ratio'        // 계획 대비 높은 실적
  | 'result_easy'       // 쉬운 목표 달성
  | 'result_challenge'; // 어려운 목표 달성

/**
 * 상황별 응원 메시지.
 */
export function getCheerMessage(type: CheerType): MessageOutput {
  const templates: Record<CheerType, MessageOutput[]> = {
    goal_set: [
      { message: '계획을 세웠어요. 이번 주 기대돼요!', emoji: '🎯' },
      { message: '좋은 시작이에요. 함께 해봐요!', emoji: '🚀' },
    ],
    high_ratio: [
      { message: '이번 주 기록이 활발하네요!', emoji: '📈' },
      { message: '열심히 기록하고 있군요!', emoji: '✏️' },
    ],
    result_easy: [
      { message: '목표를 달성했어요. 잘 해냈어요!', emoji: '✅' },
      { message: '계획대로 됐네요. 수고했어요!', emoji: '😊' },
    ],
    result_challenge: [
      { message: '쉽지 않은 목표를 해냈어요. 대단해요!', emoji: '💪' },
      { message: '이번 도전, 정말 잘 해냈어요!', emoji: '🏆' },
    ],
  };

  const result = pick(templates[type]);
  assertDnaClean(result.message);
  return result;
}

// ══════════════════════════════════════════════
// GRADE C — 하드코딩
// ══════════════════════════════════════════════

/**
 * "금융 서비스 아님" 고지 (CLAUDE.md 3절 반드시 지킬 것 10번).
 * 약관 + 앱 + 스토어에 공통 사용.
 */
export function getLegalDisclaimer(): string {
  return 'Mily는 금융 서비스가 아닙니다. 가족이 함께 소비를 기록하고 돌아보는 회고 앱입니다. 금융 거래 기능은 제공하지 않습니다.';
}

export type ErrorCode =
  | 'network'
  | 'auth'
  | 'permission'
  | 'not_found'
  | 'server'
  | 'unknown';

/**
 * 에러 코드별 사용자 안내 메시지.
 */
export function getErrorMessage(code: ErrorCode): string {
  const messages: Record<ErrorCode, string> = {
    network: '인터넷 연결을 확인하고 다시 시도해주세요.',
    auth: '로그인이 필요해요. 다시 로그인해주세요.',
    permission: '이 기능을 사용할 권한이 없어요.',
    not_found: '찾을 수 없는 항목이에요.',
    server: '일시적인 오류가 발생했어요. 잠시 후 다시 시도해주세요.',
    unknown: '예상치 못한 오류가 발생했어요. 계속되면 문의해주세요.',
  };
  return messages[code];
}

/**
 * DNA 원칙 고지 (앱 내부 디버그/개발자 화면용).
 */
export function getDNANotice(): string {
  return 'Mily DNA: 판단하지 않습니다. 비교하지 않습니다. 함께 돌아볼 뿐입니다.';
}

// ── 내부 헬퍼 ─────────────────────────────────

function buildFallbackMessage(message: string, emoji: string): MessageOutput {
  return { message, emoji };
}
