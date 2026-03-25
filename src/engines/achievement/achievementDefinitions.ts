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

  // ─── A-2. 기록 추가 (streak/milestone) ──────

  {
    id: 'streak_3',
    category: 'record',
    title: '3일 연속!',
    description: '3일 연속 체크인을 완료했어요.',
    rarity: 'common',
    isHidden: false,
    hint: '3일 연속 기록',
    condition: (ctx) => ctx.dailyCheckInStreak >= 3,
  },
  {
    id: 'streak_7',
    category: 'record',
    title: '일주일 매일',
    description: '7일 연속 체크인! 매일 기록하는 습관이에요.',
    rarity: 'uncommon',
    isHidden: false,
    hint: '7일 연속 기록',
    condition: (ctx) => ctx.dailyCheckInStreak >= 7,
  },
  {
    id: 'streak_30',
    category: 'record',
    title: '30일의 기적',
    description: '30일 연속 체크인 달성! 진정한 기록왕이에요.',
    rarity: 'rare',
    isHidden: false,
    hint: '30일 연속 기록',
    condition: (ctx) => ctx.dailyCheckInStreak >= 30,
  },
  {
    id: 'records_10',
    category: 'record',
    title: '10개의 발자국',
    description: '체크인 10회 달성!',
    rarity: 'common',
    isHidden: false,
    hint: '체크인 10회',
    condition: (ctx) => ctx.totalCheckIns >= 10,
  },

  // ─── B. 계획/절약 (plan) ───────────────────

  {
    id: 'first_save',
    category: 'plan',
    title: '첫 저금',
    description: '처음으로 저금(남기기) 카테고리를 사용했어요.',
    rarity: 'common',
    isHidden: false,
    hint: '저금 카테고리 1회 체크인',
    condition: (ctx) => ctx.savingsCheckIns >= 1,
  },
  {
    id: 'budget_kept',
    category: 'plan',
    title: '알뜰살뜰',
    description: '예산의 80% 이내로 한 주를 마쳤어요.',
    rarity: 'common',
    isHidden: false,
    hint: '주 예산 80% 이내',
    condition: (ctx) => ctx.underBudgetWeeks >= 1,
  },
  {
    id: 'choice_down',
    category: 'plan',
    title: '선택소비 감소',
    description: '지난주보다 선택 소비가 줄었어요. 잘했어요!',
    rarity: 'uncommon',
    isHidden: false,
    hint: '선택소비 전주 대비 감소',
    condition: (ctx) => ctx.choiceSpendDecreased,
  },
  {
    id: 'promise_kept',
    category: 'plan',
    title: '약속 이행',
    description: '이번 주 약속을 지켰어요.',
    rarity: 'common',
    isHidden: false,
    hint: '약속 지키기 1회',
    condition: (ctx) => ctx.promiseKeptCount >= 1,
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

  // ─── D-3. 대화 추가 ─────────────────────────

  {
    id: 'contract_complete',
    category: 'family',
    title: '합의 완료',
    description: '가족 약속(합의)을 완료했어요.',
    rarity: 'uncommon',
    isHidden: false,
    hint: '가족 합의 1회 완료',
    condition: (ctx) => ctx.contractsCompleted >= 1,
  },

  // ─── G. 성장 (badge) ──────────────────────────

  {
    id: 'first_report',
    category: 'badge',
    title: '첫 리포트',
    description: '처음으로 주간 리포트를 확인했어요.',
    rarity: 'common',
    isHidden: false,
    hint: '리포트 1회 확인',
    condition: (ctx) => ctx.reviewCount >= 1,
  },
  {
    id: 'weekly_review_done',
    category: 'badge',
    title: '주간 회고 완료',
    description: '주간 회고를 완료했어요. 꾸준히 돌아보는 습관이에요!',
    rarity: 'common',
    isHidden: false,
    hint: '회고 완료 1회',
    condition: (ctx) => ctx.reviewCount >= 1,
  },
  {
    id: 'economy_tip_x5',
    category: 'badge',
    title: '경제 상식 탐험가',
    description: '경제 상식을 5개 읽었어요. 지식이 쌓이고 있어요!',
    rarity: 'uncommon',
    isHidden: false,
    hint: '경제 상식 5개 열람',
    condition: (ctx) => ctx.economyTipsViewed >= 5,
  },
  {
    id: 'band_up',
    category: 'badge',
    title: '밴드 업그레이드',
    description: '연령 밴드가 올라갔어요! 새로운 기능이 열렸어요.',
    rarity: 'uncommon',
    isHidden: false,
    hint: '연령 밴드 업그레이드',
    condition: (ctx) => ctx.ageBandUpgraded,
  },
  {
    id: 'graduation',
    category: 'badge',
    title: '성년 전환',
    description: '어른이 됐어요! 밀리와 함께 성장한 여정이에요.',
    rarity: 'epic',
    isHidden: false,
    hint: '성년 전환 완료',
    condition: (ctx) => ctx.isGraduated,
  },
  {
    id: 'millionaire_start',
    category: 'badge',
    title: '밀리어네어 시작',
    description: '밀리어네어 여정이 시작됐어요!',
    rarity: 'rare',
    isHidden: false,
    hint: '밀리 경험치 1000 이상',
    condition: (ctx) => ctx.totalMilyXp >= 1000,
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

  // ─── E-2. 시간 추가 ────────────────────────

  {
    id: 'daily_streak_7',
    category: 'time',
    title: '한 주 매일 기록',
    description: '7일 연속 체크인! 진정한 일일 기록자예요.',
    rarity: 'rare',
    isHidden: false,
    hint: '7일 연속 기록',
    condition: (ctx) => ctx.dailyCheckInStreak >= 7,
  },
  {
    id: 'comeback',
    category: 'time',
    title: '돌아온 기록자',
    description: '2주 만에 다시 돌아왔어요. 다시 시작하는 것도 멋진 일이에요!',
    rarity: 'uncommon',
    isHidden: false,
    hint: '2주 이상 쉬고 복귀',
    condition: (ctx) => ctx.daysSinceLastCheckIn >= 14 && ctx.totalCheckIns >= 2,
  },

  // ─── D-2. 가족 추가 ──────────────────────────

  {
    id: 'request_resolved',
    category: 'family',
    title: '합의 달성',
    description: '요청 카드가 합의로 완료됐어요.',
    rarity: 'uncommon',
    isHidden: false,
    hint: '요청 카드 합의 1회',
    condition: (ctx) => ctx.requestCardsResolved >= 1,
  },
  {
    id: 'praise_received_3',
    category: 'family',
    title: '응원 수집가',
    description: '칭찬 카드를 3번 받았어요.',
    rarity: 'uncommon',
    isHidden: false,
    hint: '칭찬 카드 3회 수신',
    condition: (ctx) => ctx.praiseCardsReceived >= 3,
  },

  // ─── B-2. 계획/절약 추가 ──────────────────────

  {
    id: 'no_impulse_week',
    category: 'plan',
    title: '충동 없는 주',
    description: '이번 주 충동 소비 태그 없이 마쳤어요.',
    rarity: 'uncommon',
    isHidden: false,
    hint: '충동 태그 0회인 주',
    condition: (ctx) => ctx.totalCheckIns >= 3 && !ctx.emotionTagTypes.includes('impulse'),
  },
  {
    id: 'give_first',
    category: 'plan',
    title: '첫 나눔',
    description: '처음으로 나눔 소비를 기록했어요. 따뜻한 마음이에요!',
    rarity: 'common',
    isHidden: false,
    hint: '나눔 소비 1회',
    condition: (ctx) => ctx.giveCheckIns >= 1,
  },

  // ─── C-2. 회고/성장 추가 ──────────────────────

  {
    id: 'economy_tip_5',
    category: 'review',
    title: '경제 호기심',
    description: '경제 상식을 5개 읽었어요. 지식이 쌓이고 있어요!',
    rarity: 'uncommon',
    isHidden: false,
    hint: '경제 상식 5개 열람',
    condition: (ctx) => ctx.economyTipsViewed >= 5,
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

  // ─── H. 마일스톤 — 성년 전환 (graduation) ───

  {
    id: 'graduation_achieved',
    category: 'milestone',
    title: '어른이 됐어요!',
    description: 'Mily와 함께 성장해서 성인이 되었어요. 앞으로도 함께해요.',
    rarity: 'epic',
    isHidden: false,
    hint: '성년 전환 완료',
    condition: (ctx) => ctx.unlockedAchievements.includes('graduation_achieved'),
  },
  {
    id: 'graduation_journey',
    category: 'milestone',
    title: '함께한 시간',
    description: '가족과 24주 이상 함께 계획하고 기록했어요.',
    rarity: 'rare',
    isHidden: false,
    hint: '가족 연결 + 24주 이상',
    condition: (ctx) => ctx.familyLinked && ctx.consecutiveWeeks >= 24,
  },
  {
    id: 'graduation_planner',
    category: 'milestone',
    title: '내 예산, 내가 정해요',
    description: '성인으로 전환 후 첫 번째 예산 계획을 만들었어요.',
    rarity: 'uncommon',
    isHidden: false,
    hint: '성년 전환 후 계획 1회 생성',
    condition: (ctx) => ctx.unlockedAchievements.includes('graduation_planner'),
  },
  // ─── 히든 업적 추가 ─────────────────────────

  {
    id: 'perfect_month',
    category: 'milestone',
    title: '완벽한 한 달',
    description: '한 달간 모든 주 예산을 지키고 회고까지 완료했어요.',
    rarity: 'hidden',
    isHidden: true,
    hint: null,
    condition: (ctx) => ctx.underBudgetWeeks >= 4 && ctx.reviewCount >= 4 && ctx.consecutiveWeeks >= 4,
  },
  {
    id: 'mily_millionaire',
    category: 'milestone',
    title: '밀리어네어',
    description: '밀리의 모든 여정을 함께한 전설적인 사용자.',
    rarity: 'hidden',
    isHidden: true,
    hint: null,
    condition: (ctx) =>
      ctx.totalCheckIns >= 100 &&
      ctx.reviewCount >= 20 &&
      ctx.consecutiveWeeks >= 24 &&
      ctx.familyLinked &&
      ctx.earnedBadges.length >= 5,
  },

  // ─── 희귀 히든 업적 추가 ─────────────────────

  {
    id: 'rat_race_escape',
    category: 'milestone',
    title: '래트레이스 탈출',
    description: '자유 지수 100%를 달성했어요! 경제적 자유의 첫걸음이에요.',
    rarity: 'hidden',
    isHidden: true,
    hint: null,
    condition: (ctx) => ctx.freedomIndex >= 100,
  },
  {
    id: 'family_bank_master',
    category: 'milestone',
    title: '패밀리뱅크 마스터',
    description: '패밀리뱅크의 모든 미션을 완료했어요.',
    rarity: 'hidden',
    isHidden: true,
    hint: null,
    condition: (ctx) => ctx.familyBankCompleted,
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
