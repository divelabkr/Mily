import { CheckIn } from '../checkin/checkinStore';

// ──────────────────────────────────────────────
// 업적 시스템 타입 정의
// CLAUDE.md §21 기반
// ──────────────────────────────────────────────

export type AchievementCategory =
  | 'record'    // A. 기록
  | 'plan'      // B. 계획
  | 'review'    // C. 회고
  | 'family'    // D. 가족
  | 'time'      // E. 시간
  | 'quirky'    // F. 엉뚱
  | 'badge'     // G. 뱃지연동
  | 'milestone' // H. 마일스톤
  | 'season';   // I. 시즌

export type AchievementRarity =
  | 'common'    // ⚪ 일상
  | 'uncommon'  // 🟢 발견
  | 'rare'      // 🔵 도전
  | 'epic'      // 🟣 전설
  | 'hidden';   // 🟡 히든

export interface AchievementContext {
  uid: string;
  totalCheckIns: number;           // 전체 체크인 횟수
  consecutiveWeeks: number;        // 연속 주 체크인 기록
  reviewCount: number;             // 전체 회고 횟수
  planCount: number;               // 전체 계획 생성 횟수
  familyLinked: boolean;           // 가족 연결 여부
  praiseCardsSent: number;         // 칭찬 카드 발송 횟수
  requestCardsSent: number;        // 요청 카드 발송 횟수
  requestCardTypes: string[];      // 사용한 요청 카드 종류 목록
  emotionTagCount: number;         // 감정 태그 사용 횟수
  emotionTagTypes: string[];       // 사용한 감정 태그 종류 목록
  memoCheckIns: number;            // 메모 있는 체크인 수
  promiseKeptCount: number;        // 약속 지킨 횟수
  underBudgetWeeks: number;        // 예산 80% 이내 주수
  choiceSpendZeroWeeks: number;    // 선택소비 0원 주수
  earnedBadges: string[];          // 획득한 경제 개념 뱃지 ID 목록
  unlockedAchievements: string[];  // 이미 해금된 업적 ID 목록
  // 시간 기반 조건용
  latestCheckIn?: CheckIn;         // 마지막 체크인 (시간대 검사)
  latestReviewAt?: number;         // 마지막 회고 타임스탬프 (ms)
  // 오늘 체크인 횟수 (엉뚱 업적용)
  todayCheckInCount: number;
  todayCheckInAmounts: number[];   // 오늘 체크인 금액 목록
}

export interface Achievement {
  id: string;
  category: AchievementCategory;
  title: string;
  description: string;
  rarity: AchievementRarity;
  isHidden: boolean;
  hint?: string | null;     // 미해금 시 힌트 ("???"는 UI에서 처리)
  seasonId?: string | null; // 시즌 업적용
  condition: (ctx: AchievementContext) => boolean;
}

// Firestore: achievements/{uid}/{achievementId}
export interface UserAchievement {
  achievementId: string;
  unlockedAt: number; // ms timestamp
  shared: boolean;
}

// Firestore: achievement_stats/{achievementId}
// 유저 1,000명 이후 배치 갱신 (주 1회 일요일)
export interface AchievementStats {
  achievementId: string;
  unlockRate: number;    // 0.0 ~ 1.0
  totalUnlocked: number;
  updatedAt: number;     // ms timestamp
}
