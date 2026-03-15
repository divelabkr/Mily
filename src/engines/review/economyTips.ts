// ──────────────────────────────────────────────
// economyTips.ts — 연령 밴드별 경제 개념 팁
// 아동 리포트에만 포함. 점수화/평가 금지.
// ──────────────────────────────────────────────

import { AgeBand } from './reportTypes';

export interface EconomyTip {
  id: string;
  ageBand: AgeBand;
  concept: string;   // 경제 개념 이름
  body: string;      // 짧은 설명 (1~2문장)
}

export const ECONOMY_TIPS: Record<AgeBand, EconomyTip[]> = {
  // Band A: 7~9세 — 아주 간단한 개념
  A: [
    {
      id: 'a_budget',
      ageBand: 'A',
      concept: '예산이란?',
      body: '쓸 수 있는 돈을 미리 정하는 거예요. 예산 안에서 쓰면 계획을 지킨 거예요!',
    },
    {
      id: 'a_saving',
      ageBand: 'A',
      concept: '저축이란?',
      body: '나중에 쓰기 위해 돈을 모아두는 거예요. 조금씩 모으면 나중에 큰 것도 살 수 있어요.',
    },
    {
      id: 'a_need_want',
      ageBand: 'A',
      concept: '필요한 것 vs 갖고 싶은 것',
      body: '꼭 필요한 것(음식, 학용품)과 갖고 싶은 것(장난감)을 구분해봐요.',
    },
    {
      id: 'a_price',
      ageBand: 'A',
      concept: '가격이란?',
      body: '물건에는 값이 있어요. 비싼 것일수록 더 많은 돈이 필요해요.',
    },
  ],

  // Band B: 10~12세 — 계획과 비교
  B: [
    {
      id: 'b_plan',
      ageBand: 'B',
      concept: '계획 소비',
      body: '미리 계획하고 쓰면 후회가 줄어요. "이번 주엔 OO에 얼마 쓸게요" 하고 정해보세요.',
    },
    {
      id: 'b_fixed_variable',
      ageBand: 'B',
      concept: '고정 지출 vs 변동 지출',
      body: '학원비처럼 매달 같은 것은 고정 지출, 군것질처럼 달라지는 것은 변동 지출이에요.',
    },
    {
      id: 'b_opportunity_cost',
      ageBand: 'B',
      concept: '기회비용',
      body: '어떤 것을 선택하면 다른 것을 포기해야 해요. 그 포기한 것이 기회비용이에요.',
    },
    {
      id: 'b_comparison',
      ageBand: 'B',
      concept: '가격 비교',
      body: '같은 물건도 가게마다 가격이 달라요. 비교해보면 더 현명하게 살 수 있어요.',
    },
  ],

  // Band C: 13~15세 — 협상과 목표
  C: [
    {
      id: 'c_negotiate',
      ageBand: 'C',
      concept: '협상',
      body: '원하는 것을 얻기 위해 이유를 설명하고 상대방을 설득하는 과정이에요.',
    },
    {
      id: 'c_goal',
      ageBand: 'C',
      concept: '목표 저축',
      body: '사고 싶은 것의 가격을 목표로 정하고, 매주 얼마씩 모을지 계획해보세요.',
    },
    {
      id: 'c_income',
      ageBand: 'C',
      concept: '수입이란?',
      body: '일을 하거나 용돈을 받는 것처럼 들어오는 돈이에요. 수입 범위 안에서 계획을 세워요.',
    },
    {
      id: 'c_emergency',
      ageBand: 'C',
      concept: '비상금',
      body: '예상치 못한 상황에 대비해 따로 모아두는 돈이에요. 평소에 조금씩 챙겨두면 든든해요.',
    },
  ],

  // Band D: 16~18세 — 심화 개념
  D: [
    {
      id: 'd_interest',
      ageBand: 'D',
      concept: '이자',
      body: '돈을 빌리면 이자를 더 내야 하고, 저축하면 이자를 받아요. 이자율이 높을수록 영향이 커요.',
    },
    {
      id: 'd_compound',
      ageBand: 'D',
      concept: '복리',
      body: '이자에 또 이자가 붙는 구조예요. 일찍 시작할수록 효과가 커지는 게 복리의 힘이에요.',
    },
    {
      id: 'd_tax',
      ageBand: 'D',
      concept: '세금',
      body: '나라 운영을 위해 소득이나 소비에서 일정 비율을 내요. 부가가치세(VAT)가 대표적이에요.',
    },
    {
      id: 'd_independence',
      ageBand: 'D',
      concept: '경제적 독립',
      body: '스스로 수입을 만들고 지출을 관리하는 것이에요. 지금 습관이 독립의 기초가 돼요.',
    },
  ],
};

// ──────────────────────────────────────────────
// 팁 선택 — 주 번호 기반 순환 (매주 다른 팁)
// ──────────────────────────────────────────────

export function getEconomyTip(ageBand: AgeBand, weekIndex = 0): EconomyTip {
  const tips = ECONOMY_TIPS[ageBand];
  return tips[weekIndex % tips.length];
}
