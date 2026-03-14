/**
 * AI 톤 검수 스크립트
 * 실행: npx ts-node scripts/ai-tone-check.ts
 * 요구사항: ANTHROPIC_API_KEY 환경변수 설정 필요
 */
import Anthropic from '@anthropic-ai/sdk';
import { WEEKLY_REVIEW_SYSTEM_PROMPT } from '../src/engines/ai/prompts/weeklyReview';
import { REQUEST_BUFFER_SYSTEM_PROMPT } from '../src/engines/ai/prompts/requestBuffer';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? '' });

// 금지 표현 패턴
const FORBIDDEN_PATTERNS = [
  { pattern: /과소비/, label: '판단형-과소비' },
  { pattern: /문제가 있/, label: '판단형-문제' },
  { pattern: /줄이세요/, label: '명령형-줄여라' },
  { pattern: /하지 마세요/, label: '명령형-금지' },
  { pattern: /\d+점/, label: '점수화' },
  { pattern: /[A-F]등급/, label: '등급화' },
  { pattern: /보다 더/, label: '비교' },
  { pattern: /[1-9][0-9]{4,}원/, label: '금액-1만원이상' },
  { pattern: /송금|이체|충전|예치/, label: '금융용어' },
  { pattern: /통제|감시|실시간\s?추적/, label: '감시용어' },
];

// 샘플 회고 입력 10개
const REVIEW_SAMPLES = [
  { categories: [{ categoryId: 'food', label: '식음료', planned: 50000, actual: 45000 }, { categoryId: 'hobby', label: '취미', planned: 30000, actual: 38000 }], emotionTags: [], totalBudget: 100000, totalSpent: 85000 },
  { categories: [{ categoryId: 'food', label: '식음료', planned: 40000, actual: 65000 }, { categoryId: 'transport', label: '이동', planned: 20000, actual: 18000 }], emotionTags: ['stress'], totalBudget: 80000, totalSpent: 90000 },
  { categories: [{ categoryId: 'social', label: '모임', planned: 30000, actual: 55000 }, { categoryId: 'savings', label: '남기기', planned: 20000, actual: 20000 }], emotionTags: ['social'], totalBudget: 120000, totalSpent: 95000 },
  { categories: [{ categoryId: 'hobby', label: '취미', planned: 20000, actual: 15000 }, { categoryId: 'food', label: '식음료', planned: 60000, actual: 58000 }], emotionTags: ['reward'], totalBudget: 100000, totalSpent: 78000 },
  { categories: [{ categoryId: 'etc', label: '기타', planned: 15000, actual: 30000 }, { categoryId: 'transport', label: '이동', planned: 25000, actual: 22000 }], emotionTags: ['impulse'], totalBudget: 90000, totalSpent: 70000 },
];

// 샘플 완충 입력 5개
const BUFFER_SAMPLES = [
  { originalText: '이번 달 용돈 좀 더 주세요', requestType: 'extra_budget' as const },
  { originalText: '게임 사고 싶어서 취미 예산 올려줘', requestType: 'plan_change' as const },
  { originalText: '시험 잘 봤으니까 보상 해주세요', requestType: 'reward' as const },
  { originalText: '친구 생일이라 모임 예산이 부족해요', requestType: 'extra_budget' as const },
  { originalText: '교통비가 올라서 이동 예산이 부족해', requestType: 'plan_change' as const },
];

interface CheckResult {
  index: number;
  type: 'review' | 'buffer';
  output: string;
  violations: string[];
  passed: boolean;
}

async function checkReviewOutput(
  input: typeof REVIEW_SAMPLES[0],
  index: number
): Promise<CheckResult> {
  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 512,
    system: WEEKLY_REVIEW_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: JSON.stringify(input) }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  const violations = FORBIDDEN_PATTERNS
    .filter((p) => p.pattern.test(text))
    .map((p) => p.label);

  return {
    index,
    type: 'review',
    output: text,
    violations,
    passed: violations.length === 0,
  };
}

async function checkBufferOutput(
  input: typeof BUFFER_SAMPLES[0],
  index: number
): Promise<CheckResult> {
  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 256,
    system: REQUEST_BUFFER_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: JSON.stringify(input) }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  const violations = FORBIDDEN_PATTERNS
    .filter((p) => p.pattern.test(text))
    .map((p) => p.label);

  return {
    index,
    type: 'buffer',
    output: text,
    violations,
    passed: violations.length === 0,
  };
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('❌ ANTHROPIC_API_KEY 환경변수가 없습니다.');
    process.exit(1);
  }

  console.log('🔍 AI 톤 검수 시작...\n');

  const results: CheckResult[] = [];

  // 회고 5건
  for (let i = 0; i < REVIEW_SAMPLES.length; i++) {
    process.stdout.write(`  회고 샘플 ${i + 1}/5 검사 중...`);
    const result = await checkReviewOutput(REVIEW_SAMPLES[i], i);
    results.push(result);
    console.log(result.passed ? ' ✅' : ` ❌ [${result.violations.join(', ')}]`);
    await new Promise((r) => setTimeout(r, 500)); // rate limit 방지
  }

  // 완충 5건
  for (let i = 0; i < BUFFER_SAMPLES.length; i++) {
    process.stdout.write(`  완충 샘플 ${i + 1}/5 검사 중...`);
    const result = await checkBufferOutput(BUFFER_SAMPLES[i], i);
    results.push(result);
    console.log(result.passed ? ' ✅' : ` ❌ [${result.violations.join(', ')}]`);
    await new Promise((r) => setTimeout(r, 500));
  }

  const totalViolations = results.filter((r) => !r.passed).length;
  const passed = totalViolations === 0;

  const summary = {
    total: results.length,
    passed: results.filter((r) => r.passed).length,
    failed: totalViolations,
    results: results.map((r) => ({
      index: r.index,
      type: r.type,
      violations: r.violations,
      passed: r.passed,
      outputPreview: r.output.slice(0, 100),
    })),
    verdict: passed ? 'PASS' : 'FAIL',
  };

  console.log('\n──────────────────────────────────────');
  console.log(`결과: ${passed ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`총 ${summary.total}건 중 위반 ${summary.failed}건`);
  console.log('──────────────────────────────────────');
  console.log(JSON.stringify(summary, null, 2));

  process.exit(passed ? 0 : 1);
}

main().catch(console.error);
