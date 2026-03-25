// ──────────────────────────────────────────────
// lifeEventService.ts — 생활 이벤트 엔진
// 매월 1개 랜덤. 3개월 내 재출현 방지.
// DNA 준수: 보너스/도전/가족결정 — 판단형 없음.
// ──────────────────────────────────────────────

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { getFirebaseDb } from '../../lib/firebase';
import type { AgeBand } from '../message/milyPersona';

// ── 타입 ──────────────────────────────────────

export type LifeEventType = 'bonus' | 'challenge' | 'family_decision';
export type EventAction =
  | 'log_income'
  | 'make_decision'
  | 'family_discussion'
  | 'send_request_card';

export type LinkedFeature =
  | 'request_card'
  | 'contract'
  | 'simulator'
  | 'cooling'
  | 'give_category';

export interface LifeEvent {
  id: string;
  type: LifeEventType;
  emoji: string;
  title: string;
  description: string;
  financialImpact?: number;       // 양수=수입, 음수=지출
  actionRequired?: EventAction;
  linkedFeature?: LinkedFeature;
  targetBands?: AgeBand[];        // 없으면 전체
  weight: number;                 // 출현 가중치 (1~10)
}

// ── 이벤트 풀 (30개) ───────────────────────────

export const LIFE_EVENTS: LifeEvent[] = [

  // ─── 보너스 이벤트 (10개) ─────────────────────

  {
    id: 'LE-01',
    type: 'bonus',
    emoji: '🎂',
    title: '할머니 용돈',
    description: '생일에 할머니께서 용돈을 주셨어요. 고마운 마음을 기록해봐요!',
    financialImpact: 20_000,
    actionRequired: 'log_income',
    targetBands: ['A', 'B'],
    weight: 8,
  },
  {
    id: 'LE-02',
    type: 'bonus',
    emoji: '📚',
    title: '독서 퀴즈 1등',
    description: '학교 독서 퀴즈에서 1등을 했어요! 노력이 보상받았어요.',
    financialImpact: 5_000,
    actionRequired: 'log_income',
    targetBands: ['A', 'B', 'C'],
    weight: 5,
  },
  {
    id: 'LE-03',
    type: 'bonus',
    emoji: '♻️',
    title: '중고 장난감 팔기',
    description: '쓰지 않는 장난감을 정리해서 팔았어요. 물건을 자산으로 바꾸는 첫 경험이에요!',
    financialImpact: 8_000,
    actionRequired: 'log_income',
    weight: 7,
  },
  {
    id: 'LE-04',
    type: 'bonus',
    emoji: '🏆',
    title: '글짓기 대회 수상',
    description: '글짓기 대회에서 입상했어요. 내 생각이 가치 있다는 걸 알게 됐어요.',
    financialImpact: 10_000,
    actionRequired: 'log_income',
    targetBands: ['B', 'C', 'D'],
    weight: 4,
  },
  {
    id: 'LE-05',
    type: 'bonus',
    emoji: '🏃',
    title: '심부름 완료',
    description: '부모님 심부름을 완료해서 용돈을 받았어요. 작은 일도 가치가 있어요.',
    financialImpact: 3_000,
    actionRequired: 'log_income',
    targetBands: ['A', 'B'],
    weight: 9,
  },
  {
    id: 'LE-06',
    type: 'bonus',
    emoji: '🧧',
    title: '설날 세뱃돈',
    description: '새해 첫날 세뱃돈을 받았어요! 이 돈으로 무엇을 할지 계획해봐요.',
    financialImpact: 50_000,
    actionRequired: 'log_income',
    linkedFeature: 'simulator',
    weight: 3,
  },
  {
    id: 'LE-07',
    type: 'bonus',
    emoji: '🌱',
    title: '재활용 분리수거 보상',
    description: '학교 분리수거 활동에 참여해서 보상을 받았어요. 환경도 지키고 용돈도!',
    financialImpact: 1_000,
    actionRequired: 'log_income',
    targetBands: ['A', 'B'],
    weight: 6,
  },
  {
    id: 'LE-08',
    type: 'bonus',
    emoji: '🎨',
    title: '그림 팔기 성공',
    description: '내가 그린 그림이 팔렸어요! 창작이 수입이 되는 첫 경험이에요.',
    financialImpact: 5_000,
    actionRequired: 'log_income',
    targetBands: ['A', 'B', 'C'],
    weight: 4,
  },
  {
    id: 'LE-09',
    type: 'bonus',
    emoji: '🛍️',
    title: '학교 벼룩시장 수익',
    description: '벼룩시장에서 물건을 팔아서 수익이 생겼어요. 작은 사업가가 됐어요!',
    financialImpact: 12_000,
    actionRequired: 'log_income',
    weight: 5,
  },
  {
    id: 'LE-10',
    type: 'bonus',
    emoji: '🎁',
    title: '친구 감사 선물',
    description: '친구가 고마워서 선물을 줬어요. 관계도 가치가 있다는 걸 느꼈어요.',
    financialImpact: 2_000,
    actionRequired: 'log_income',
    weight: 4,
  },

  // ─── 도전 이벤트 (10개) ───────────────────────

  {
    id: 'LE-11',
    type: 'challenge',
    emoji: '🦷',
    title: '치과 예약이 있어요',
    description: '치과 검진 예약이 생겼어요. 건강 관리 비용에 대해 가족과 이야기해봐요.',
    actionRequired: 'family_discussion',
    weight: 5,
  },
  {
    id: 'LE-12',
    type: 'challenge',
    emoji: '📱',
    title: '핸드폰 액정이 깨졌어요',
    description: '핸드폰 화면이 깨져서 수리가 필요해요. 요청 카드를 보내볼까요?',
    actionRequired: 'send_request_card',
    linkedFeature: 'request_card',
    targetBands: ['C', 'D'],
    weight: 4,
  },
  {
    id: 'LE-13',
    type: 'challenge',
    emoji: '🌧️',
    title: '소풍 취소, 환불 받을 수 있을까요?',
    description: '소풍이 취소됐어요. 환불 절차에 대해 부모님과 이야기해봐요.',
    actionRequired: 'family_discussion',
    weight: 3,
  },
  {
    id: 'LE-14',
    type: 'challenge',
    emoji: '🎁',
    title: '친구 생일 선물 필요해요',
    description: '친구 생일이 다가왔어요. 예산 안에서 선물을 골라볼까요?',
    actionRequired: 'make_decision',
    linkedFeature: 'simulator',
    weight: 6,
  },
  {
    id: 'LE-15',
    type: 'challenge',
    emoji: '📚',
    title: '갑자기 학원비가 올랐어요',
    description: '학원비가 올랐다는 소식이 왔어요. 가족 예산에 어떤 영향이 있을지 이야기해봐요.',
    actionRequired: 'family_discussion',
    weight: 4,
  },
  {
    id: 'LE-16',
    type: 'challenge',
    emoji: '🎮',
    title: '게임 시즌 패스 출시',
    description: '좋아하는 게임의 시즌 패스가 나왔어요. 정말 필요한지 생각해볼 시간이에요.',
    actionRequired: 'make_decision',
    linkedFeature: 'cooling',
    targetBands: ['B', 'C'],
    weight: 5,
  },
  {
    id: 'LE-17',
    type: 'challenge',
    emoji: '💸',
    title: '핸드폰 데이터 초과 요금',
    description: '이번 달 데이터 초과 요금이 나왔어요. 다음 달엔 어떻게 관리할까요?',
    actionRequired: 'family_discussion',
    targetBands: ['C', 'D'],
    weight: 4,
  },
  {
    id: 'LE-18',
    type: 'challenge',
    emoji: '📸',
    title: '단체 사진 구입 비용',
    description: '학교 단체 사진을 구입할 기회가 생겼어요. 추억의 가치를 생각해봐요.',
    actionRequired: 'make_decision',
    targetBands: ['A', 'B', 'C'],
    weight: 3,
  },
  {
    id: 'LE-19',
    type: 'challenge',
    emoji: '👟',
    title: '체육복을 잃어버렸어요',
    description: '체육복이 없어졌어요. 어떻게 해결할지 가족과 이야기해봐요.',
    actionRequired: 'family_discussion',
    weight: 4,
  },
  {
    id: 'LE-20',
    type: 'challenge',
    emoji: '🙏',
    title: '동생이 용돈 빌려달래요',
    description: '동생이 용돈을 빌려달라고 했어요. 빌려줄지, 어떤 조건으로 할지 생각해봐요.',
    actionRequired: 'family_discussion',
    linkedFeature: 'contract',
    weight: 4,
  },

  // ─── 가족 결정 이벤트 (10개) ─────────────────

  {
    id: 'LE-21',
    type: 'family_decision',
    emoji: '💡',
    title: '에어컨 수리비 발생',
    description: '에어컨이 고장났어요. 수리비를 어떻게 마련할지 가족이 함께 생각해봐요.',
    financialImpact: -500_000,
    actionRequired: 'family_discussion',
    weight: 3,
  },
  {
    id: 'LE-22',
    type: 'family_decision',
    emoji: '🏖️',
    title: '가족 여행 계획',
    description: '가족 여행을 계획 중이에요. 함께 저금 목표를 세워볼까요?',
    actionRequired: 'family_discussion',
    linkedFeature: 'simulator',
    weight: 5,
  },
  {
    id: 'LE-23',
    type: 'family_decision',
    emoji: '🐶',
    title: '강아지 병원비',
    description: '반려동물이 아파서 병원에 갔어요. 반려동물 의료비에 대해 이야기해봐요.',
    financialImpact: -200_000,
    actionRequired: 'family_discussion',
    weight: 3,
  },
  {
    id: 'LE-24',
    type: 'family_decision',
    emoji: '🏠',
    title: '이사 계획 발생',
    description: '이사를 고민 중이에요. 집과 관련된 큰 결정을 가족이 함께해봐요.',
    actionRequired: 'family_discussion',
    linkedFeature: 'simulator',
    weight: 2,
  },
  {
    id: 'LE-25',
    type: 'family_decision',
    emoji: '🎁',
    title: '명절 선물 예산',
    description: '명절이 다가왔어요. 가족 선물 예산을 함께 정해봐요.',
    actionRequired: 'family_discussion',
    weight: 4,
  },
  {
    id: 'LE-26',
    type: 'family_decision',
    emoji: '📖',
    title: '학원 추가 등록 고민',
    description: '새 학원을 등록할지 고민이에요. 투자 가치에 대해 가족과 이야기해봐요.',
    actionRequired: 'family_discussion',
    weight: 4,
  },
  {
    id: 'LE-27',
    type: 'family_decision',
    emoji: '🚗',
    title: '자동차 수리비',
    description: '자동차를 수리해야 해요. 예상치 못한 지출을 어떻게 준비할지 이야기해봐요.',
    financialImpact: -300_000,
    actionRequired: 'family_discussion',
    weight: 3,
  },
  {
    id: 'LE-28',
    type: 'family_decision',
    emoji: '💧',
    title: '수도세 폭탄',
    description: '이번 달 수도세가 많이 나왔어요. 절약 챌린지를 시작해볼까요?',
    financialImpact: -50_000,
    actionRequired: 'family_discussion',
    weight: 4,
  },
  {
    id: 'LE-29',
    type: 'family_decision',
    emoji: '💐',
    title: '부모님 경조사',
    description: '경조사가 생겼어요. 나눔의 의미에 대해 가족이 함께 이야기해봐요.',
    actionRequired: 'family_discussion',
    linkedFeature: 'give_category',
    weight: 3,
  },
  {
    id: 'LE-30',
    type: 'family_decision',
    emoji: '🏦',
    title: '집 대출 이자 납부일',
    description: '이번 달 대출 이자 납부일이에요. 이자가 뭔지, 왜 생기는지 이야기해봐요.',
    actionRequired: 'family_discussion',
    weight: 3,
  },
];

// ── 이벤트 이력 저장 (재출현 방지) ────────────

interface EventHistory {
  familyId: string;
  recentEventIds: string[]; // 최근 3개월 이벤트 ID
  updatedAt: number;
}

async function getEventHistory(familyId: string): Promise<EventHistory> {
  try {
    const ref = doc(getFirebaseDb(), 'life_event_history', familyId);
    const snap = await getDoc(ref);
    if (snap.exists()) return snap.data() as EventHistory;
  } catch { /* ignore */ }
  return { familyId, recentEventIds: [], updatedAt: 0 };
}

// ── 가중치 기반 랜덤 선택 ──────────────────────

function weightedRandom(events: LifeEvent[]): LifeEvent {
  const totalWeight = events.reduce((sum, e) => sum + e.weight, 0);
  let rand = Math.random() * totalWeight;
  for (const event of events) {
    rand -= event.weight;
    if (rand <= 0) return event;
  }
  return events[events.length - 1];
}

// ── 공개 API ──────────────────────────────────

/**
 * 이번 달 이벤트 1개 랜덤 선택.
 * 최근 3개월 내 재출현 방지.
 */
export async function getMonthlyEvent(
  familyId: string,
  _month: string  // "YYYY-MM" (현재는 히스토리 key로 사용 예정)
): Promise<LifeEvent> {
  const history = await getEventHistory(familyId);
  const excluded = new Set(history.recentEventIds);

  const candidates = LIFE_EVENTS.filter((e) => !excluded.has(e.id));
  const pool = candidates.length > 0 ? candidates : LIFE_EVENTS;

  const selected = weightedRandom(pool);

  // 이력 업데이트 (최근 3개 유지)
  const newRecent = [...history.recentEventIds, selected.id].slice(-3);
  try {
    const ref = doc(getFirebaseDb(), 'life_event_history', familyId);
    await setDoc(ref, {
      familyId,
      recentEventIds: newRecent,
      updatedAt: Date.now(),
    });
  } catch { /* ignore */ }

  return selected;
}

/**
 * 이벤트 ID로 단건 조회.
 */
export function getEventById(id: string): LifeEvent | undefined {
  return LIFE_EVENTS.find((e) => e.id === id);
}

/**
 * 타입별 이벤트 목록.
 */
export function getEventsByType(type: LifeEventType): LifeEvent[] {
  return LIFE_EVENTS.filter((e) => e.type === type);
}

/**
 * 밴드별 필터링.
 */
export function getEventsForBand(band: AgeBand): LifeEvent[] {
  return LIFE_EVENTS.filter(
    (e) => !e.targetBands || e.targetBands.includes(band)
  );
}
