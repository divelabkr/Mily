// ──────────────────────────────────────────────
// economyTips.ts — 연령 밴드별 경제 개념 팁
// 아동 리포트에만 포함. 점수화/평가 금지.
// ──────────────────────────────────────────────

import { AgeBand } from './reportTypes';

export interface EconomyTip {
  id: string;
  ageBand: AgeBand;
  concept: string;        // 경제 개념 이름
  body: string;           // 짧은 설명 (1~2문장)
  curiosityHook?: string; // 호기심 유발 질문
  emoji?: string;         // 대표 이모지
}

export const ECONOMY_TIPS: Record<AgeBand, EconomyTip[]> = {
  // Band A: 7~9세 — 아주 간단한 개념
  A: [
    {
      id: 'a_piggy',
      ageBand: 'A',
      concept: '저금통에 100원씩 넣으면?',
      body: '매일 100원씩 모으면 한 달이면 3,000원이에요. 작은 동전도 모이면 커져요!',
      curiosityHook: '100원이 3,000원이 되는 마법, 알고 싶지 않아?',
      emoji: '🐷',
    },
    {
      id: 'a_price_tag',
      ageBand: 'A',
      concept: '가격표의 비밀',
      body: '가격표를 보면 이 물건이 얼마인지 알 수 있어요. 같은 물건도 가게마다 다를 수 있어요.',
      curiosityHook: '왜 같은 과자가 편의점이랑 마트에서 가격이 다를까?',
      emoji: '🛒',
    },
    {
      id: 'a_allowance_use',
      ageBand: 'A',
      concept: '용돈의 세 가지 사용법',
      body: '용돈은 쓰기, 모으기, 나누기 세 가지로 나눠볼 수 있어요.',
      curiosityHook: '용돈을 세 바구니에 나누면 어떻게 될까?',
      emoji: '🧺',
    },
    {
      id: 'a_price_diff',
      ageBand: 'A',
      concept: '물건 가격은 왜 다를까?',
      body: '같은 물건이어도 만드는 데 드는 비용이 다르면 가격이 달라요.',
      curiosityHook: '왜 어떤 연필은 비싸고 어떤 건 싼 걸까?',
      emoji: '🤔',
    },
    {
      id: 'a_save_vs_allowance',
      ageBand: 'A',
      concept: '저금과 용돈의 차이',
      body: '용돈은 쓸 수 있는 돈이고, 저금은 나중을 위해 모아두는 돈이에요.',
      curiosityHook: '용돈을 다 쓰면 어떻게 될까? 모으면?',
      emoji: '💰',
    },
    {
      id: 'a_budget',
      ageBand: 'A',
      concept: '예산이란?',
      body: '쓸 수 있는 돈을 미리 정하는 거예요. 예산 안에서 쓰면 계획을 지킨 거예요!',
      curiosityHook: '이번 주 용돈으로 뭘 살 수 있을까?',
      emoji: '📋',
    },
  ],

  // Band B: 10~12세 — 계획과 비교
  B: [
    {
      id: 'b_budget_what',
      ageBand: 'B',
      concept: '예산이란 무엇일까?',
      body: '미리 계획하고 쓰면 후회가 줄어요. "이번 주엔 OO에 얼마 쓸게요" 하고 정해보세요.',
      curiosityHook: '한 달 용돈으로 계획을 세우면 어떻게 달라질까?',
      emoji: '📊',
    },
    {
      id: 'b_frugal_vs_cheap',
      ageBand: 'B',
      concept: '절약 vs 짠돌이 차이',
      body: '절약은 필요한 곳에 잘 쓰는 거고, 짠돌이는 무조건 안 쓰는 거예요. 진짜 절약은 현명한 선택이에요.',
      curiosityHook: '절약하는 사람과 짠돌이, 뭐가 다를까?',
      emoji: '🤓',
    },
    {
      id: 'b_opportunity_cost',
      ageBand: 'B',
      concept: '기회비용: 하나를 사면 못 사는 것',
      body: '어떤 것을 선택하면 다른 것을 포기해야 해요. 그 포기한 것이 기회비용이에요.',
      curiosityHook: '게임을 사면 포기해야 하는 건 뭘까?',
      emoji: '⚖️',
    },
    {
      id: 'b_credit',
      ageBand: 'B',
      concept: '신용이란 무엇일까?',
      body: '"약속을 지키는 사람"이라는 믿음이에요. 약속을 잘 지키면 신용이 올라가요.',
      curiosityHook: '약속을 잘 지키면 왜 돈을 빌리기 쉬워질까?',
      emoji: '🤝',
    },
    {
      id: 'b_sale',
      ageBand: 'B',
      concept: '할인과 세일의 진실',
      body: '세일이라고 다 이득은 아니에요. 정말 필요한 건지 먼저 생각해보면 좋아요.',
      curiosityHook: '50% 할인인데 왜 손해일 수 있을까?',
      emoji: '🏷️',
    },
    {
      id: 'b_fixed_variable',
      ageBand: 'B',
      concept: '고정 지출 vs 변동 지출',
      body: '학원비처럼 매달 같은 것은 고정 지출, 군것질처럼 달라지는 것은 변동 지출이에요.',
      curiosityHook: '매달 꼭 나가는 돈은 뭐가 있을까?',
      emoji: '📌',
    },
  ],

  // Band C: 13~15세 — 협상과 목표
  C: [
    {
      id: 'c_asset_debt',
      ageBand: 'C',
      concept: '자산 vs 부채 (Kiyosaki 방식)',
      body: '내 주머니에 돈을 넣어주는 게 자산, 빼가는 게 부채예요. 자산을 먼저 만들어봐요.',
      curiosityHook: '스마트폰은 자산일까 부채일까?',
      emoji: '💡',
    },
    {
      id: 'c_passive_income',
      ageBand: 'C',
      concept: '수동소득이란?',
      body: '일하지 않아도 들어오는 수입이에요. 저축 이자나 콘텐츠 수익 같은 거예요.',
      curiosityHook: '자는 동안에도 돈을 벌 수 있다면?',
      emoji: '💤',
    },
    {
      id: 'c_compound',
      ageBand: 'C',
      concept: '복리의 마법',
      body: '이자에 또 이자가 붙는 구조예요. 시간이 지날수록 눈덩이처럼 불어나요.',
      curiosityHook: '100만 원이 10년 뒤 얼마가 될까?',
      emoji: '🔮',
    },
    {
      id: 'c_inflation',
      ageBand: 'C',
      concept: '인플레이션이란?',
      body: '물가가 전체적으로 올라가는 현상이에요. 같은 돈으로 살 수 있는 게 줄어들어요.',
      curiosityHook: '10년 전 떡볶이 가격이 지금이랑 같았을까?',
      emoji: '📈',
    },
    {
      id: 'c_stock_intro',
      ageBand: 'C',
      concept: '주식이 뭔지 알아?',
      body: '회사의 일부를 사는 거예요. 회사가 잘되면 내 지분 가치도 올라가요.',
      curiosityHook: '좋아하는 브랜드의 주인이 될 수 있다면?',
      emoji: '📊',
    },
    {
      id: 'c_emergency',
      ageBand: 'C',
      concept: '비상금',
      body: '예상치 못한 상황에 대비해 따로 모아두는 돈이에요. 평소에 조금씩 챙겨두면 든든해요.',
      curiosityHook: '갑자기 필요한 돈이 생기면 어떻게 할까?',
      emoji: '🆘',
    },
  ],

  // Band D: 16~18세 — 심화 개념
  D: [
    {
      id: 'd_cashflow',
      ageBand: 'D',
      concept: '현금흐름 방향 이해하기',
      body: '돈이 들어오는 길과 나가는 길을 파악하면 재정 계획의 첫걸음이에요.',
      curiosityHook: '내 돈은 어디서 와서 어디로 가고 있을까?',
      emoji: '🔄',
    },
    {
      id: 'd_leverage',
      ageBand: 'D',
      concept: '레버리지: 위험한 무기',
      body: '빌린 돈으로 투자하면 수익도 커지지만 손실도 커져요. 양날의 검이에요.',
      curiosityHook: '왜 부자들은 빚을 쓰면서도 더 부자가 될까?',
      emoji: '⚔️',
    },
    {
      id: 'd_financial_statement',
      ageBand: 'D',
      concept: '재무제표 읽는 법',
      body: '회사의 건강 상태를 보여주는 문서예요. 수입, 지출, 자산을 한눈에 볼 수 있어요.',
      curiosityHook: '좋아하는 회사가 정말 돈을 잘 버는지 확인하려면?',
      emoji: '📄',
    },
    {
      id: 'd_rat_race',
      ageBand: 'D',
      concept: '수동소득으로 생활비 충당하기',
      body: '수동소득이 생활비를 넘으면 돈이 돈을 버는 구조가 돼요. 자산 쌓기가 핵심이에요.',
      curiosityHook: '일하지 않아도 생활비가 나오려면 뭐가 필요할까?',
      emoji: '🏃',
    },
    {
      id: 'd_buffett',
      ageBand: 'D',
      concept: '워런 버핏의 첫 번째 원칙',
      body: '"잃지 마라." 수익보다 손실을 먼저 생각하는 것이 현명한 판단의 시작이에요.',
      curiosityHook: '세계 최고 부자가 가장 중요하게 생각하는 한 가지는?',
      emoji: '🧓',
    },
    {
      id: 'd_compound',
      ageBand: 'D',
      concept: '복리의 마법',
      body: '이자에 또 이자가 붙는 구조예요. 일찍 시작할수록 효과가 커지는 게 복리의 힘이에요.',
      curiosityHook: '20살에 시작한 사람이 30살에 시작한 사람보다 왜 유리할까?',
      emoji: '📐',
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
