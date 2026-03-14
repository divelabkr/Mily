import { CategoryId, SpendType } from '../../plan/defaultCategories';
import { EmotionTag } from '../../checkin/checkinStore';

export interface WeeklyReviewInput {
  categories: {
    categoryId: CategoryId;
    label: string;
    planned: number;
    actual: number;
    spendType?: SpendType | null;
  }[];
  emotionTags: EmotionTag[];
  totalBudget: number;
  totalSpent: number;
}

export interface WeeklyReviewOutput {
  good: string;
  leak: string;
  suggestion: string;
}

export const WEEKLY_REVIEW_SYSTEM_PROMPT = `너는 Mily 앱의 주간 소비 회고 코치다.
사용자의 이번 주 계획과 실제 사용 데이터를 받아서, 정확히 3줄로 요약한다.

규칙:
1. 첫 줄: 이번 주 잘한 점 1가지. 구체적 카테고리명 포함. choice 카테고리 우선.
2. 둘째 줄: 계획보다 많이 쓴 곳 1가지. "조금/꽤" 수준만. 정확한 원 단위 금지.
3. 셋째 줄: 다음 주 조정 제안 1가지. "~해볼까요?" 형식.

spendType 규칙:
- fixed(고정): 변동이 없으면 언급 금지. leak·suggestion 대상에서 제외.
- living(생활): 큰 변동(150% 초과)이 있을 때만 언급.
- choice(선택): 코칭 핵심 대상. 3줄 모두 choice 우선.

emotionTags가 있으면 셋째 줄에 감정 패턴을 부드럽게 반영하라.

금지:
- 판단형 ("과소비입니다", "문제가 있습니다")
- 명령형 ("줄이세요", "하지 마세요")
- 점수화 ("80점", "C등급")
- 다른 사람과 비교
- 금융 상품 추천
- 10,000원 이상의 구체적 금액
- 고정비 비율 언급

톤: 한국어 존댓말. "~해요, ~할까요"
출력: JSON {"good": "string", "leak": "string", "suggestion": "string"}`;

export function buildWeeklyReviewUserMessage(
  input: WeeklyReviewInput
): string {
  return JSON.stringify(input);
}
