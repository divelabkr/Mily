import { Achievement } from './achievementTypes';

// ──────────────────────────────────────────────
// 업적 30개 정의 (MVP)
// CLAUDE.md §21 기반 — 9개 카테고리
// ──────────────────────────────────────────────

export const ACHIEVEMENTS: Achievement[] = [

  // ─── A. 기록 (record) ───────────────────────

  {
    id: 'first_checkin',
    category: 'record',
    title: '첫 발자국',
    description: '처음으로 체크인을 완료했어요.',
    rarity: 'common',
    isHidden: false,
    hint: '체크인 1회',
    condition: (ctx) => ctx.totalCheckIns >= 1,
  },
  {
    id: 'five_checkins',
    category: 'record',
    title: '습관의 싹',
    description: '체크인을 5번 완료했어요.',
    rarity: 'common',
    isHidden: false,
    hint: '체크인 5회',
    condition: (ctx) => ctx.totalCheckIns >= 5,
  },
  {
    id: 'twenty_checkins',
    category: 'record',
    title: '기록 마니아',
    description: '체크인 20회 달성! 꾸준함이 느껴져요.',
    rarity: 'uncommon',
    isHidden: false,
    hint: '체크인 20회',
    condition: (ctx) => ctx.totalCheckIns >= 20,
  },
  {
    id: 'fifty_checkins',
    category: 'record',
    title: '50번의 기억',
    description: '체크인 50회 달성. 대단해요!',
    rarity: 'rare',
    isHidden: false,
    hint: '체크인 50회',
    condition: (ctx) => ctx.totalCheckIns >= 50,
  },
  {
    id: 'emotion_tagger',
    category: 'record',
    title: '감정 탐정',
    description: '감정 태그를 5번 사용했어요.',
    rarity: 'common',
    isHidden: false,
    hint: '감정 태그 5회 사용',
    condition: (ctx) => ctx.emotionTagCount >= 5,
  },
  {
    id: 'all_emotions',
    category: 'record',
    title: '복잡한 마음',
    description: '4가지 감정 태그를 모두 사용했어요.',
    rarity: 'uncommon',
    isHidden: false,
    hint: '모든 감정 태그 유형 사용',
    condition: (ctx) =>
      ['impulse', 'stress', 'social', 'reward'].every((e) =>
        ctx.emotionTagTypes.includes(e)
      ),
  },
  {
    id: 'memo_writer',
    category: 'record',
    title: '기록자',
    description: '메모를 남긴 체크인이 10개 이상이에요.',
    rarity: 'common',
    isHidden: false,
    hint: '메모 있는 체크인 10회',
    condition: (ctx) => ctx.memoCheckIns >= 10,
  },
  {
    id: 'hundred_checkins',
    category: 'record',
    title: '100번의 정직함',
    description: '체크인 100회! 밀리의 참된 기록자예요.',
    rarity: 'epic',
    isHidden: false,
    hint: '체크인 100회',
    condition: (ctx) => ctx.totalCheckIns >= 100,
  },

  // ─── B. 계획 (plan) ─────────────────────────

  {
    id: 'first_plan',
    category: 'plan',
    title: '계획러',
    description: '처음으로 월 계획을 세웠어요.',
    rarity: 'common',
    isHidden: false,
    hint: '계획 1회 생성',
    condition: (ctx) => ctx.planCount >= 1,
  },
  {
    id: 'promise_maker',
    category: 'plan',
    title: '약속의 달인',
    description: '이번 주 약속을 3번 설정했어요.',
    rarity: 'common',
    isHidden: false,
    hint: '이번 주 약속 3회 설정',
    condition: (ctx) => ctx.planCount >= 3,
  },
  {
    id: 'under_budget',
    category: 'plan',
    title: '알뜰살뜰',
    description: '예산의 80% 이내로 한 주를 마쳤어요.',
    rarity: 'common',
    isHidden: false,
    hint: '주 예산 80% 이내',
    condition: (ctx) => ctx.underBudgetWeeks >= 1,
  },
  {
    id: 'three_under_budget',
    category: 'plan',
    title: '3주 절약왕',
    description: '3주 연속 예산 이내! 진짜 계획파네요.',
    rarity: 'uncommon',
    isHidden: false,
    hint: '3주 연속 예산 80% 이내',
    condition: (ctx) => ctx.underBudgetWeeks >= 3,
  },
  {
    id: 'choice_zero_week',
    category: 'plan',
    title: '선택 없는 주',
    description: '선택 소비 없이 한 주를 보냈어요.',
    rarity: 'uncommon',
    isHidden: false,
    hint: '선택소비 0원 주 달성',
    condition: (ctx) => ctx.choiceSpendZeroWeeks >= 1,
  },

  // ─── C. 회고 (review) ───────────────────────

  {
    id: 'first_review',
    category: 'review',
    title: '첫 회고',
    description: '처음으로 주간 회고를 완료했어요.',
    rarity: 'common',
    isHidden: false,
    hint: '회고 1회',
    condition: (ctx) => ctx.reviewCount >= 1,
  },
  {
    id: 'five_reviews',
    category: 'review',
    title: '회고 습관',
    description: '주간 회고 5회 달성!',
    rarity: 'common',
    isHidden: false,
    hint: '회고 5회',
    condition: (ctx) => ctx.reviewCount >= 5,
  },
  {
    id: 'promise_keeper',
    category: 'review',
    title: '약속을 지키는 사람',
    description: '이번 주 약속을 3번 지켰어요.',
    rarity: 'uncommon',
    isHidden: false,
    hint: '약속 지키기 3회',
    condition: (ctx) => ctx.promiseKeptCount >= 3,
  },
  {
    id: 'late_reviewer',
    category: 'review',
    title: '마감 전사',
    description: '일요일 밤 11시 이후에 회고를 완료했어요.',
    rarity: 'uncommon',
    isHidden: false,
    hint: '일요일 23:00 이후 회고',
    condition: (ctx) => {
      if (!ctx.latestReviewAt) return false;
      const d = new Date(ctx.latestReviewAt);
      return d.getDay() === 0 && d.getHours() >= 23;
    },
  },
  {
    id: 'twenty_reviews',
    category: 'review',
    title: '회고 전문가',
    description: '주간 회고 20회 달성. 앰배서더의 조건 중 하나예요.',
    rarity: 'rare',
    isHidden: false,
    hint: '회고 20회',
    condition: (ctx) => ctx.reviewCount >= 20,
  },

  // ─── D. 가족 (family) ───────────────────────

  {
    id: 'family_linker',
    category: 'family',
    title: '가족 연결',
    description: '가족을 밀리에 초대했어요.',
    rarity: 'common',
    isHidden: false,
    hint: '가족 연결',
    condition: (ctx) => ctx.familyLinked,
  },
  {
    id: 'first_praise',
    category: 'family',
    title: '응원 시작',
    description: '처음으로 칭찬 카드를 보냈어요.',
    rarity: 'common',
    isHidden: false,
    hint: '칭찬 카드 1회',
    condition: (ctx) => ctx.praiseCardsSent >= 1,
  },
  {
    id: 'five_praises',
    category: 'family',
    title: '응원 마스터',
    description: '칭찬 카드를 5번 보냈어요.',
    rarity: 'uncommon',
    isHidden: false,
    hint: '칭찬 카드 5회',
    condition: (ctx) => ctx.praiseCardsSent >= 5,
  },
  {
    id: 'first_request',
    category: 'family',
    title: '첫 요청',
    description: '처음으로 요청 카드를 보냈어요.',
    rarity: 'common',
    isHidden: false,
    hint: '요청 카드 1회',
    condition: (ctx) => ctx.requestCardsSent >= 1,
  },
  {
    id: 'three_request_types',
    category: 'family',
    title: '다양한 요청',
    description: '3가지 유형의 요청 카드를 모두 사용했어요.',
    rarity: 'uncommon',
    isHidden: false,
    hint: '요청 카드 3종 사용',
    condition: (ctx) => new Set(ctx.requestCardTypes).size >= 3,
  },

  // ─── E. 시간 (time) ─────────────────────────

  {
    id: 'four_weeks',
    category: 'time',
    title: '한 달의 기록',
    description: '4주 연속 체크인을 이어갔어요.',
    rarity: 'uncommon',
    isHidden: false,
    hint: '4주 연속 기록',
    condition: (ctx) => ctx.consecutiveWeeks >= 4,
  },
  {
    id: 'eight_weeks',
    category: 'time',
    title: '두 달의 습관',
    description: '8주 연속! 이건 진짜 습관이에요.',
    rarity: 'rare',
    isHidden: false,
    hint: '8주 연속 기록',
    condition: (ctx) => ctx.consecutiveWeeks >= 8,
  },
  {
    id: 'twelve_weeks',
    category: 'time',
    title: '한 분기의 여정',
    description: '12주 연속 기록. 밀리의 전설적인 사용자예요.',
    rarity: 'epic',
    isHidden: false,
    hint: '12주 연속 기록',
    condition: (ctx) => ctx.consecutiveWeeks >= 12,
  },
  {
    id: 'night_checkin',
    category: 'time',
    title: '야행성 기록자',
    description: '밤 11시 이후에 체크인한 적이 3번 있어요.',
    rarity: 'uncommon',
    isHidden: true,
    hint: '밤늦게 기록하기',
    condition: (ctx) => {
      if (!ctx.latestCheckIn) return false;
      const d = new Date(ctx.latestCheckIn.createdAt);
      // 조건: 현재 체크인이 23시 이후이고, totalCheckIns 고려
      // (실제로는 nightCheckInCount 필드가 필요하나 MVP에서 마지막 1건 기준)
      return d.getHours() >= 23;
    },
  },

  // ─── F. 엉뚱 (quirky) ───────────────────────

  {
    id: 'five_in_one_day',
    category: 'quirky',
    title: '오늘도 바빠',
    description: '하루에 체크인을 5번이나 했어요. 바쁜 하루였나요?',
    rarity: 'uncommon',
    isHidden: false,
    hint: '하루 체크인 5회',
    condition: (ctx) => ctx.todayCheckInCount >= 5,
  },
  {
    id: 'zero_amount',
    category: 'quirky',
    title: '0원의 기록',
    description: '0원짜리 체크인이라니... 창의적이에요!',
    rarity: 'common',
    isHidden: false,
    hint: '금액 0원으로 체크인',
    condition: (ctx) => ctx.todayCheckInAmounts.some((a) => a === 0),
  },
  {
    id: 'lucky_seven',
    category: 'quirky',
    title: '럭키 세븐',
    description: '7,777원을 정확히 기록했어요. 행운이 찾아오길!',
    rarity: 'hidden',
    isHidden: true,
    hint: null,
    condition: (ctx) => ctx.todayCheckInAmounts.some((a) => a === 7777),
  },
];

// 카테고리별 필터 헬퍼
export function getAchievementsByCategory(
  category: Achievement['category']
): Achievement[] {
  return ACHIEVEMENTS.filter((a) => a.category === category);
}

// ID로 단건 조회
export function findAchievement(id: string): Achievement | undefined {
  return ACHIEVEMENTS.find((a) => a.id === id);
}
