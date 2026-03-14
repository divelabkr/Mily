// ──────────────────────────────────────────────
// 경제 개념 뱃지 타입
// CLAUDE.md §20 기반 — 9종, 수집이지 점수 아님
// ──────────────────────────────────────────────

export type BadgeId =
  | 'budget'       // 예산
  | 'plan'         // 계획
  | 'review'       // 회고
  | 'fixed_cost'   // 고정비
  | 'negotiate'    // 협상
  | 'emergency'    // 비상금
  | 'promise'      // 약속
  | 'consensus'    // 합의
  | 'independence'; // 독립

export interface EconomicBadge {
  id: BadgeId;
  label: string;         // 한국어 이름
  description: string;   // 개념 설명 (1~2줄)
  emoji: string;         // 뱃지 아이콘
  triggerHint: string;   // "어떻게 얻나요?" 힌트 텍스트
}

export interface BadgeContext {
  uid: string;
  totalBudgetSet: boolean;     // 예산 > 0인 계획 생성 여부
  planCount: number;           // 계획 생성 횟수
  reviewCount: number;         // 회고 완료 횟수
  hasFixedCheckIn: boolean;    // 고정비(fixed) 카테고리 체크인 여부
  hasNegotiatedCard: boolean;  // 요청 카드 'adjusting' 응답 경험
  hasUrgentRequest: boolean;   // urgent 유형 요청 카드 발송 경험
  hasWeeklyPromise: boolean;   // 이번 주 약속 설정 경험
  hasCheeredResponse: boolean; // 요청 카드 'cheered' 응답 경험
  consecutiveWeeks: number;    // 연속 주 기록
  familyLinked: boolean;       // 가족 연결 여부
  earnedBadges: BadgeId[];     // 이미 획득한 뱃지 ID 목록
}

// Firestore: economic_badges/{uid}/{badgeId}
export interface UserBadge {
  badgeId: BadgeId;
  earnedAt: number; // ms timestamp
}
