/**
 * 회고 AI 호출 직접 테스트 (에뮬레이터 불필요)
 * 실행: node scripts/test-ai-review.mjs
 */
import Anthropic from '@anthropic-ai/sdk';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// .env 파싱
const __dir = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dir, '../.env');
const envLines = readFileSync(envPath, 'utf8').split('\n');
for (const line of envLines) {
  const [k, ...rest] = line.split('=');
  if (k && rest.length) process.env[k.trim()] = rest.join('=').trim();
}

const API_KEY = process.env.ANTHROPIC_API_KEY;
if (!API_KEY) { console.error('ANTHROPIC_API_KEY 없음'); process.exit(1); }

const SYSTEM_PROMPT = `너는 Mily 앱의 주간 소비 회고 코치다.
사용자의 이번 주 계획과 실제 사용 데이터를 받아서, 정확히 3줄로 요약한다.

규칙:
1. 첫 줄: 이번 주 잘한 점 1가지. 구체적 카테고리명 포함. choice 카테고리 우선.
2. 둘째 줄: 계획보다 많이 쓴 곳 1가지. "조금/꽤" 수준만. 정확한 원 단위 금지.
3. 셋째 줄: 다음 주 조정 제안 1가지. "~해볼까요?" 형식.

spendType 규칙:
- fixed(고정): 변동이 없으면 언급 금지.
- living(생활): 큰 변동(150% 초과)이 있을 때만 언급.
- choice(선택): 코칭 핵심 대상.

절대 금지 (위반 시 응답 무효):
- 숫자+원 형태 금액 표기 (예: 43,000원, 91,000원, 10만원 등) — 금액은 절대 쓰지 말 것
- 판단형, 명령형, 점수화, 고정비(fixed) 카테고리 언급.
톤: 친구에게 조언하듯. 한국어 존댓말.
출력: JSON {"good": "string", "leak": "string", "suggestion": "string"}`;

const TEST_INPUT = {
  weekId: '2026-W11',
  totalBudget: 400000,
  categories: [
    { categoryId: 'food',      label: '식음료', weeklyLimit: 80000,  spent: 62000, spendType: 'living' },
    { categoryId: 'transport', label: '이동',   weeklyLimit: 40000,  spent: 38000, spendType: 'living' },
    { categoryId: 'hobby',     label: '취미',   weeklyLimit: 60000,  spent: 91000, spendType: 'choice' },
    { categoryId: 'social',    label: '모임',   weeklyLimit: 60000,  spent: 43000, spendType: 'choice' },
    { categoryId: 'savings',   label: '남기기', weeklyLimit: 100000, spent: 100000, spendType: 'fixed' },
    { categoryId: 'etc',       label: '기타',   weeklyLimit: 60000,  spent: 15000, spendType: 'choice' },
  ],
  emotionTags: ['social', 'reward'],
};

console.log('=== Mily 회고 AI 테스트 ===');
console.log('입력:', JSON.stringify(TEST_INPUT, null, 2));
console.log('\nClaude API 호출 중...\n');

const client = new Anthropic({ apiKey: API_KEY });

try {
  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 512,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: JSON.stringify(TEST_INPUT) }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  const result = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

  console.log('=== 응답 (raw) ===');
  console.log(text);
  console.log('\n=== 파싱된 JSON ===');
  console.log(JSON.stringify(result, null, 2));
  console.log('\n=== 사용 토큰 ===');
  console.log(`  input: ${response.usage.input_tokens}, output: ${response.usage.output_tokens}`);
} catch (err) {
  console.error('API 오류:', err.message);
}
