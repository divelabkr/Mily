// ──────────────────────────────────────────────
// roleModelService.ts — 밀리의 밀리어네어 롤모델
// 한국 5명 + 글로벌 5명. 밴드/타겟별 필터링.
// DNA 원칙: 비교/순위화 없음. 영감 제공만.
// ──────────────────────────────────────────────

import type { AgeBand } from '../message/milyPersona';

// ── 타입 ──────────────────────────────────────

export type RoleModelCategory =
  | 'investor'
  | 'entrepreneur'
  | 'creator'
  | 'athlete';

export type RoleModelAudience = 'parent' | 'child' | 'both';

export interface AgeAsset {
  age: number;
  event: string;
  asset?: string;
}

export interface AgeComparison {
  modelId: string;
  modelName: string;
  modelAgeEvent: string | null; // 같은 나이대 이벤트
  insight: string;
}

export interface RoleModel {
  id: string;
  name: string;
  category: RoleModelCategory;
  targetAudience: RoleModelAudience;
  ageBands: AgeBand[];
  oneLiner: string;
  keyHabits: string[];        // 핵심 습관 3개
  timeline: AgeAsset[];       // 나이별 자산/사건
  quote: string;
  linkedGoalAmount?: number;  // 꿈 계산기 연결 금액 (원)
}

// ── 롤모델 데이터 ──────────────────────────────

export const ROLE_MODELS: RoleModel[] = [

  // ─── 한국 인물 ────────────────────────────────

  {
    id: 'KR-01',
    name: '정주영',
    category: 'entrepreneur',
    targetAudience: 'parent',
    ageBands: ['D'],
    oneLiner: '맨손으로 조선소를 세운 창업가',
    keyHabits: [
      '불굴의 의지 — 실패를 출발점으로',
      '현장 중심 — 직접 보고 결정한다',
      '무에서 유 — 없는 것은 만들면 된다',
    ],
    timeline: [
      { age: 18, event: '가출 후 막노동 시작' },
      { age: 27, event: '쌀가게 운영', asset: '소자본 창업' },
      { age: 30, event: '건설업 진출', asset: '첫 사업체' },
      { age: 50, event: '조선소 설립', asset: '글로벌 기업' },
    ],
    quote: '이봐, 해봤어?',
  },

  {
    id: 'KR-02',
    name: '유일한',
    category: 'entrepreneur',
    targetAudience: 'parent',
    ageBands: ['C', 'D'],
    oneLiner: '전 재산을 사회에 돌려준 기업인',
    keyHabits: [
      '정직 — 이익보다 신뢰를 먼저',
      '사회 환원 — 기업은 사회의 것',
      '장기 관점 — 100년을 바라본다',
    ],
    timeline: [
      { age: 12, event: '미국 유학 출발' },
      { age: 28, event: '채소 통조림 사업', asset: '첫 자산' },
      { age: 30, event: '유한양행 설립', asset: '제약회사' },
      { age: 80, event: '전 재산 사회 기부', asset: '사회 환원' },
    ],
    quote: '기업은 사회의 것이다.',
  },

  {
    id: 'KR-03',
    name: '김범수',
    category: 'entrepreneur',
    targetAudience: 'both',
    ageBands: ['B', 'C', 'D'],
    oneLiner: '카카오를 만든 재도전의 아이콘',
    keyHabits: [
      '도전 — 실패해도 다시 시작',
      '플랫폼 사고 — 연결이 가치다',
      '재도전 — 한 번 실패가 끝이 아니다',
    ],
    timeline: [
      { age: 20, event: '대학 시절 게임 개발 시작' },
      { age: 26, event: '대기업 입사', asset: '안정된 직장' },
      { age: 30, event: '첫 창업 (한게임)', asset: '스타트업' },
      { age: 40, event: '카카오 창업', asset: '플랫폼 기업' },
    ],
    quote: '실패를 두려워하지 않는다.',
  },

  {
    id: 'KR-04',
    name: '방시혁',
    category: 'creator',
    targetAudience: 'child',
    ageBands: ['B', 'C'],
    oneLiner: '음악을 좋아해서 글로벌 기획사를 만든 사람',
    keyHabits: [
      '콘텐츠 투자 — 좋아하는 것에 올인',
      '글로벌 시각 — 세계를 무대로',
      '팬과 소통 — 사람이 중심이다',
    ],
    timeline: [
      { age: 18, event: '음악에 빠지다' },
      { age: 25, event: '작곡가로 데뷔', asset: '저작권 자산' },
      { age: 35, event: '빅히트 설립', asset: '기획사' },
      { age: 45, event: 'K팝 글로벌화', asset: '글로벌 IP' },
    ],
    quote: '좋아하는 것을 극한으로 파라.',
  },

  {
    id: 'KR-05',
    name: '이수진',
    category: 'entrepreneur',
    targetAudience: 'both',
    ageBands: ['A', 'B', 'C', 'D'],
    oneLiner: '작은 아이디어로 여성 스타트업을 이끈 창업가',
    keyHabits: [
      '공감 — 사용자의 불편을 먼저 찾는다',
      '지속 — 매일 조금씩 나아간다',
      '나눔 — 성공은 함께 나눌 때 의미 있다',
    ],
    timeline: [
      { age: 22, event: '첫 아르바이트' },
      { age: 28, event: '작은 사이드 프로젝트 시작' },
      { age: 32, event: '스타트업 창업', asset: '초기 투자 유치' },
      { age: 38, event: '사회적 기업 성장', asset: '팀과 함께' },
    ],
    quote: '작은 시작이 큰 변화를 만든다.',
  },

  // ─── 글로벌 인물 ──────────────────────────────

  {
    id: 'GL-01',
    name: '워런 버핏',
    category: 'investor',
    targetAudience: 'both',
    ageBands: ['C', 'D'],
    oneLiner: '11세에 첫 주식을 산 인내의 투자자',
    keyHabits: [
      '복리 — 시간이 가장 큰 자산이다',
      '장기투자 — 좋은 것을 오래 갖는다',
      '독서 — 하루 500페이지 읽는다',
    ],
    timeline: [
      { age: 6, event: '껌 장사로 첫 수익' },
      { age: 11, event: '첫 주식 구매', asset: '자산 투자 시작' },
      { age: 14, event: '땅 구매로 임대 수익', asset: '부동산' },
      { age: 26, event: '투자 조합 설립', asset: '첫 펀드' },
    ],
    quote: '오늘 나무를 심는 두 번째 좋은 시간은 바로 지금이에요.',
    linkedGoalAmount: 100000,
  },

  {
    id: 'GL-02',
    name: '손정의',
    category: 'investor',
    targetAudience: 'parent',
    ageBands: ['D'],
    oneLiner: '300년 계획을 세운 비전 투자자',
    keyHabits: [
      '300년 계획 — 장기적으로 생각한다',
      '선두 투자 — 미래를 먼저 산다',
      '빠른 결단 — 5초 안에 결정한다',
    ],
    timeline: [
      { age: 16, event: '미국 유학 결심' },
      { age: 19, event: '첫 사업 아이디어 판매', asset: '초기 자금' },
      { age: 24, event: '소프트뱅크 설립', asset: '기업 설립' },
      { age: 40, event: '알리바바 초기 투자', asset: '대규모 수익' },
    ],
    quote: '10년 후를 그려라, 그리고 오늘을 살아라.',
  },

  {
    id: 'GL-03',
    name: '큐브 게임 개발자',
    category: 'creator',
    targetAudience: 'child',
    ageBands: ['B', 'C'],
    oneLiner: '혼자 만든 게임이 2조원이 된 이야기',
    keyHabits: [
      '좋아하는 것 극한 — 하루 종일 해도 안 질리는 걸 찾아라',
      '창작이 자산 — 만든 것이 평생 내 것이 된다',
      '공유 — 커뮤니티와 함께 성장했다',
    ],
    timeline: [
      { age: 16, event: '혼자 프로그래밍 독학' },
      { age: 25, event: '큐브 샌드박스 게임 개발', asset: '디지털 IP' },
      { age: 30, event: '게임 글로벌 히트', asset: '저작권 수익' },
      { age: 35, event: '2조 원에 매각', asset: '평생 자산' },
    ],
    quote: '좋아하는 걸 만들면, 세상이 알아봐.',
  },

  {
    id: 'GL-04',
    name: '말라라',
    category: 'creator',
    targetAudience: 'child',
    ageBands: ['C', 'D'],
    oneLiner: '신념 하나로 세상을 바꾼 청소년',
    keyHabits: [
      '신념 — 옳다고 믿는 것을 포기하지 않는다',
      '교육 투자 — 지식이 가장 큰 자산이다',
      '나눔 — 한 사람을 위한 목소리가 백만 명에게 닿는다',
    ],
    timeline: [
      { age: 11, event: '교육의 중요성을 알다' },
      { age: 15, event: '세상에 목소리를 냄', asset: '사회적 영향력' },
      { age: 17, event: '최연소 노벨평화상', asset: '글로벌 재단 설립' },
      { age: 25, event: '말라라 펀드 운영', asset: '교육 투자' },
    ],
    quote: '한 명의 아이, 한 권의 책, 한 자루의 펜이 세상을 바꿀 수 있어요.',
  },

  {
    id: 'GL-05',
    name: '팀 쿡',
    category: 'entrepreneur',
    targetAudience: 'parent',
    ageBands: ['D'],
    oneLiner: '꾸준함으로 세계 1위 기업 CEO가 된 사람',
    keyHabits: [
      '운영 효율 — 좋은 시스템이 좋은 결과를 만든다',
      '윤리 경영 — 올바른 방법으로 번다',
      '꾸준함 — 매일 새벽 4시에 일어난다',
    ],
    timeline: [
      { age: 22, event: '평범한 첫 직장', asset: '성실함' },
      { age: 35, event: '애플 운영 담당', asset: '글로벌 경험' },
      { age: 50, event: '애플 CEO 취임', asset: '리더십' },
      { age: 60, event: '애플 시총 3,000조 달성', asset: '역대급 성장' },
    ],
    quote: '옳은 일을 하는 것이 가장 좋은 비즈니스다.',
  },
];

// ── 쿼리 함수 ──────────────────────────────────

/**
 * 밴드 + 타겟 기반 롤모델 목록 조회.
 */
export function getRoleModels(
  band: AgeBand,
  audience: RoleModelAudience
): RoleModel[] {
  return ROLE_MODELS.filter(
    (m) =>
      m.ageBands.includes(band) &&
      (m.targetAudience === audience || m.targetAudience === 'both')
  );
}

/**
 * ID로 단건 조회.
 */
export function getRoleModelById(id: string): RoleModel | undefined {
  return ROLE_MODELS.find((m) => m.id === id);
}

/**
 * 목표 금액과 연결된 롤모델 조회.
 * linkedGoalAmount 없는 모델도 포함 (linkedGoalAmount가 목표 이하인 경우).
 */
export function getMatchedModels(goalAmount: number): RoleModel[] {
  return ROLE_MODELS.filter(
    (m) =>
      m.linkedGoalAmount == null ||
      Math.abs(m.linkedGoalAmount - goalAmount) / goalAmount <= 0.5
  );
}

/**
 * 사용자 나이(age)와 롤모델 타임라인을 비교.
 * 해당 나이대에서 롤모델이 무엇을 했는지 인사이트 반환.
 */
export function getAgeComparison(
  userAge: number,
  modelId: string
): AgeComparison {
  const model = getRoleModelById(modelId);
  if (!model) {
    return {
      modelId,
      modelName: '알 수 없음',
      modelAgeEvent: null,
      insight: '롤모델 정보를 찾을 수 없어요.',
    };
  }

  // 사용자 나이 ±3 범위 내 이벤트 찾기
  const nearby = model.timeline.find(
    (t) => Math.abs(t.age - userAge) <= 3
  );

  const modelAgeEvent = nearby
    ? `${model.name}은(는) ${nearby.age}세에 "${nearby.event}"을(를) 했어요.`
    : null;

  const insight = nearby
    ? `이 시기는 ${model.name}에게도 중요한 출발점이었어요.`
    : `${model.name}의 이야기에서 영감을 찾아봐요.`;

  return { modelId, modelName: model.name, modelAgeEvent, insight };
}
