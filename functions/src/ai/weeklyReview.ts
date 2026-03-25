import { onCall } from 'firebase-functions/v2/https';
import Anthropic from '@anthropic-ai/sdk';
import { ANTHROPIC_SECRET, getSecretValue } from '../config/secrets';

const anthropicApiKey = ANTHROPIC_SECRET;

const AI_MODEL = 'claude-haiku-4-5-20251001';
const AI_TIMEOUT_MS = 10000;

const SYSTEM_PROMPT = `너는 Mily 앱의 주간 소비 회고 코치다.
사용자의 이번 주 계획과 실제 사용 데이터를 받아서, 정확히 3줄로 요약한다.

규칙:
1. 첫 줄: 이번 주 잘한 점 1가지. 구체적 카테고리명 포함. choice 카테고리 우선.
2. 둘째 줄: 계획보다 많이 쓴 곳 1가지. "조금/꽤" 수준만. 정확한 원 단위 금지.
3. 셋째 줄: 다음 주 조정 제안 1가지. "~해볼까요?" 형식.

spendType 규칙:
- fixed(고정): 변동이 없으면 언급 금지. leak·suggestion 대상에서 제외.
- living(생활): 큰 변동(150% 초과)이 있을 때만 언급.
- choice(선택): 코칭 핵심 대상. 3줄 모두 choice 우선.

입력에 emotionTag 배열이 포함될 수 있다.
emotionTag가 있으면 셋째 줄에 감정 패턴을 부드럽게 반영하라.

절대 금지 (위반 시 응답 무효):
- 숫자+원 형태 금액 표기 (예: 43,000원, 91,000원, 10만원 등) — 금액은 절대 쓰지 말 것
- 판단형 ("과소비입니다", "문제가 있습니다")
- 명령형 ("줄이세요", "하지 마세요")
- 점수화 ("80점", "C등급")
- 다른 사람과 비교
- 금융 상품 추천
- 고정비(fixed) 카테고리 언급

톤: 친구에게 조언하듯 부드럽게. 한국어 존댓말(~해요, ~할까요).
출력: JSON {"good": "string", "leak": "string", "suggestion": "string"}`;

interface CategoryInput {
  categoryId: string;
  label: string;
  weeklyLimit: number;
  spent: number;
  spendType?: string | null;
}

interface ReviewInput {
  weekId: string;
  totalBudget: number;
  categories: CategoryInput[];
  emotionTags?: string[];
}

interface ReviewOutput {
  good: string;
  leak: string;
  suggestion: string;
}

const FALLBACK: ReviewOutput = {
  good: '이번 주도 기록을 꾸준히 해줬어요!',
  leak: '소비 패턴을 좀 더 살펴볼 수 있어요.',
  suggestion: '다음 주에는 한 카테고리만 집중해볼까요?',
};

export const generateWeeklyReview = onCall(
  { secrets: [anthropicApiKey], timeoutSeconds: 30 },
  async (request) => {
    const input = request.data as ReviewInput;

    const client = new Anthropic({ apiKey: anthropicApiKey.value() });
    const userMessage = JSON.stringify(input);

    try {
      const response = await Promise.race([
        client.messages.create({
          model: AI_MODEL,
          max_tokens: 512,
          system: SYSTEM_PROMPT,
          messages: [{ role: 'user', content: userMessage }],
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), AI_TIMEOUT_MS)
        ),
      ]);

      const text =
        (response as Anthropic.Message).content[0].type === 'text'
          ? ((response as Anthropic.Message).content[0] as Anthropic.TextBlock).text
          : '';

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('JSON not found in response');

      const result = JSON.parse(jsonMatch[0]) as ReviewOutput;
      if (!result.good || !result.leak || !result.suggestion) {
        throw new Error('Invalid response shape');
      }
      return result;
    } catch (err) {
      console.error('[weeklyReview] AI 호출 실패, fallback 반환:', err);
      return FALLBACK;
    }
  }
);
