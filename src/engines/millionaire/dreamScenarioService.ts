// ──────────────────────────────────────────────
// dreamScenarioService.ts — 꿈 시나리오 + 계산기
// IP 없이 세계관만. 시뮬레이터 연결.
// DNA 원칙: 점수/비교 없음. 호기심 유발만.
// ──────────────────────────────────────────────

import type { AgeBand } from '../message/milyPersona';

// ── 타입 ──────────────────────────────────────

export interface DreamScenario {
  id: string;
  title: string;
  emoji: string;
  description: string;          // IP 없이 세계관만
  realWorldPrice: number;       // 원
  priceSource: string;
  funFact: string;              // 충격 포인트 (판단형 없음)
  monthlyToAchieve: number;     // 시뮬레이터 기본값 (원/월)
  parentTalkingPoint: string;   // 가족 대화 소재
  targetBands?: AgeBand[];      // 적합 밴드 (없으면 전체)
}

// ── 시나리오 데이터 ────────────────────────────

export const DREAM_SCENARIOS: DreamScenario[] = [
  {
    id: 'DS-01',
    title: '공주의 성',
    emoji: '🏰',
    description: '동화 속 그 성처럼, 실제로 존재하는 거대한 궁궐. 한 나라의 역사가 담긴 공간이에요.',
    realWorldPrice: 500_000_000_000,
    priceSource: '경복궁 복원 추산 비용 기준',
    funFact: '용돈 만 원씩 모으면 약 4만 년이 걸려요. 그래서 우리에게 "역사 유산"이 있나봐요!',
    monthlyToAchieve: 1_000_000,
    parentTalkingPoint: '우리 집이랑 이 성이랑 차이가 뭘까? 유지비는 얼마나 들까?',
    targetBands: ['A', 'B'],
  },
  {
    id: 'DS-02',
    title: '나만의 섬',
    emoji: '🏝️',
    description: '바다 한가운데 아무도 없는 섬. 실제로 한국에도 살 수 있는 작은 섬들이 있어요.',
    realWorldPrice: 500_000_000,
    priceSource: '한국 소형 무인도서 매매 기준',
    funFact: '한국에서 살 수 있는 가장 저렴한 섬 가격이에요. 유지비가 더 들 수 있어요!',
    monthlyToAchieve: 500_000,
    parentTalkingPoint: '섬을 소유하면 세금은 어떻게 낼까? 섬에서 살려면 뭐가 필요할까?',
    targetBands: ['B', 'C'],
  },
  {
    id: 'DS-03',
    title: '우주 여행',
    emoji: '🚀',
    description: '지구 밖에서 지구를 내려다보는 경험. 이제 민간인도 갈 수 있는 시대가 왔어요.',
    realWorldPrice: 450_000_000,
    priceSource: '민간 우주 관광 티켓 현재 가격',
    funFact: '현재 가장 비싼 여행 상품이에요. 10년 후엔 훨씬 저렴해질 수도 있어요.',
    monthlyToAchieve: 1_500_000,
    parentTalkingPoint: '기술이 발전하면 우주 여행 가격도 내려갈까? 비행기 가격이 왜 싸졌을까?',
    targetBands: ['C', 'D'],
  },
  {
    id: 'DS-04',
    title: '우리 동네 아파트',
    emoji: '🏠',
    description: '매일 지나치는 바로 그 아파트. 언젠가 내 이름으로 소유하는 날이 올 수 있어요.',
    realWorldPrice: 0, // 국토부 API 실시간 조회 예정
    priceSource: '국토교통부 실거래가 (지역마다 다름)',
    funFact: '부모님이 이 집을 처음 보셨을 때 얼마였을까요? 부동산은 시간에 따라 바뀌어요.',
    monthlyToAchieve: 2_000_000,
    parentTalkingPoint: '우리 집은 언제 샀어? 그때랑 지금이랑 가격이 어떻게 바뀌었어?',
    targetBands: ['C', 'D'],
  },
  {
    id: 'DS-05',
    title: '게임 회사 차리기',
    emoji: '🎮',
    description: '내가 만든 캐릭터, 내가 설계한 세계. 작은 팀에서 시작한 게임 회사가 세상을 바꿨어요.',
    realWorldPrice: 50_000_000,
    priceSource: '소규모 게임 스타트업 초기 설립 비용',
    funFact: '유명한 큐브 게임은 혼자서 시작했어요. 장비가 아니라 아이디어가 핵심이에요.',
    monthlyToAchieve: 200_000,
    parentTalkingPoint: '게임을 만들려면 뭘 배워야 할까? 수익은 어떻게 낼까?',
    targetBands: ['B', 'C'],
  },
  {
    id: 'DS-06',
    title: '유튜브 채널 1억뷰',
    emoji: '🎬',
    description: '1억 명이 내 영상을 본다면? 콘텐츠가 자산이 되는 시대가 왔어요.',
    realWorldPrice: 30_000_000,
    priceSource: '채널 초기 장비 + 1년 운영 비용 추산',
    funFact: '조회수 1억 = 광고 수익 약 1~3억 원. 콘텐츠는 한 번 만들면 계속 돈을 벌어요.',
    monthlyToAchieve: 100_000,
    parentTalkingPoint: '유튜버는 어떻게 돈을 벌까? 구독자 1명이 얼마의 가치일까?',
    targetBands: ['B', 'C'],
  },
  {
    id: 'DS-07',
    title: '마법사의 학교',
    emoji: '⚡',
    description: '영국에 실제로 있는 기숙학교. 4년 내내 친구들과 함께 살며 공부하는 특별한 경험이에요.',
    realWorldPrice: 200_000_000,
    priceSource: '영국 명문 기숙학교 4년 총 학비 기준',
    funFact: '실제 영국 기숙학교 연간 학비는 5,000만 원 이상이에요. 장학금이 있는 이유가 있어요!',
    monthlyToAchieve: 500_000,
    parentTalkingPoint: '교육에 투자하는 게 왜 중요할까? 장학금은 어떻게 받을 수 있을까?',
    targetBands: ['A', 'B', 'C'],
  },
  {
    id: 'DS-08',
    title: 'K-팝 기획사',
    emoji: '🎵',
    description: '내가 좋아하는 아이돌을 직접 발굴하고 키우는 기획사. 음악이 비즈니스가 되는 세계예요.',
    realWorldPrice: 1_000_000_000,
    priceSource: '소형 K-팝 기획사 설립 비용 추산',
    funFact: '지금은 글로벌 기업이 된 한 유명 기획사도 처음엔 단칸방에서 시작했어요.',
    monthlyToAchieve: 1_000_000,
    parentTalkingPoint: '기획사는 어떻게 돈을 벌까? 저작권이 왜 중요한지 알아?',
    targetBands: ['B', 'C', 'D'],
  },
  {
    id: 'DS-09',
    title: '내 책 출판',
    emoji: '📚',
    description: '내가 쓴 이야기가 책이 되어 세상에 나온다면? 작가는 글 하나로 세상을 바꾸기도 해요.',
    realWorldPrice: 5_000_000,
    priceSource: '자비출판 + 초기 마케팅 비용 기준',
    funFact: '세계에서 가장 유명한 어린이 소설 작가는 12번 거절당하고도 포기하지 않았어요.',
    monthlyToAchieve: 50_000,
    parentTalkingPoint: '글쓰기는 어떻게 자산이 될 수 있을까? 저작권은 얼마나 오래 유지될까?',
    targetBands: ['A', 'B', 'C', 'D'],
  },
  {
    id: 'DS-10',
    title: '동물원 만들기',
    emoji: '🦁',
    description: '내가 좋아하는 동물들을 직접 돌보고 사람들에게 소개하는 나만의 공간이에요.',
    realWorldPrice: 50_000_000_000,
    priceSource: '소형 사파리 파크 설립 비용 기준',
    funFact: '서울동물원 연간 운영비는 약 300억 원이에요. 동물 한 마리 밥값이 얼마일까요?',
    monthlyToAchieve: 5_000_000,
    parentTalkingPoint: '동물원은 어떻게 운영 자금을 마련할까? 입장료만으로 운영될까?',
    targetBands: ['A', 'B'],
  },
];

// ── 쿼리 함수 ──────────────────────────────────

/**
 * 밴드별 꿈 시나리오 목록.
 */
export function getDreamScenarios(band: AgeBand): DreamScenario[] {
  return DREAM_SCENARIOS.filter(
    (d) => !d.targetBands || d.targetBands.includes(band)
  );
}

/**
 * ID로 단건 조회.
 */
export function getDreamById(id: string): DreamScenario | undefined {
  return DREAM_SCENARIOS.find((d) => d.id === id);
}

/**
 * 월 저축 금액과 복리율로 목표 달성 개월 수 계산.
 * annualRate = 연 이율 (0.03 = 3%)
 */
export function calculateTimeToAchieve(
  dream: DreamScenario,
  monthlySaving: number,
  annualRate = 0
): number {
  if (monthlySaving <= 0) return Infinity;
  if (dream.realWorldPrice === 0) return 0; // 실시간 조회 필요

  const monthlyRate = annualRate / 12;
  let accumulated = 0;
  let months = 0;

  while (accumulated < dream.realWorldPrice && months < 120 * 12) {
    accumulated = accumulated * (1 + monthlyRate) + monthlySaving;
    months++;
  }

  return months;
}
