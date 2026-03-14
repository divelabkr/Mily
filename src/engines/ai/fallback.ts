import { WeeklyReviewInput, WeeklyReviewOutput } from './prompts/weeklyReview';
import { DEFAULT_CATEGORIES } from '../plan/defaultCategories';

export function buildFallbackReview(
  input: WeeklyReviewInput
): WeeklyReviewOutput {
  // 가장 잘 지킨 카테고리 (실제/계획 비율 가장 낮은 것)
  const sorted = [...input.categories].sort((a, b) => {
    const ratioA = a.planned > 0 ? a.actual / a.planned : 2;
    const ratioB = b.planned > 0 ? b.actual / b.planned : 2;
    return ratioA - ratioB;
  });

  const best = sorted[0];
  const worst = sorted[sorted.length - 1];

  const bestLabel =
    DEFAULT_CATEGORIES.find((c) => c.id === best?.categoryId)?.label ??
    best?.label ??
    '';
  const worstLabel =
    DEFAULT_CATEGORIES.find((c) => c.id === worst?.categoryId)?.label ??
    worst?.label ??
    '';

  return {
    good: `이번 주 ${bestLabel} 예산을 잘 지켰어요.`,
    leak: `${worstLabel}가 조금 늘었네요.`,
    suggestion: `다음 주에는 ${worstLabel} 예산을 조정해볼까요?`,
  };
}

export function buildFallbackBufferedText(originalText: string): string {
  return originalText;
}
