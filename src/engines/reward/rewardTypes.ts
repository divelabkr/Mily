// ──────────────────────────────────────────────
// rewardTypes.ts — 운영자 깜짝 보상 쿠폰 시스템 타입
// DNA: 앱 내 알림 전용, Mily 명의, 자녀 프라이버시 존중
// ──────────────────────────────────────────────

export type CouponBrand = '스타벅스' | 'CU' | 'GS25' | '기타';
export type CouponValue = 2000 | 3000 | 5000;

export interface CouponPayload {
  couponId: string;          // 자동 생성
  title: string;
  description: string;
  couponCode: string;
  brand: CouponBrand;
  value: CouponValue;
  expiresAt: Date;           // sentAt + 30일 자동 계산
  usedAt?: Date;
  sentAt: Date;
  recipientUid: string;
  isMinor: boolean;
  /**
   * 선물함 아이콘 표시 여부
   * true  : 아이콘 표시 (쿠폰 도착 시)
   * false : 아이콘 숨김 (사용완료 또는 만료 시)
   * 발송 전: 아이콘 자체 미존재
   */
  isVisible: boolean;
}

// Firestore 저장용 (Date → number)
export interface CouponDoc
  extends Omit<CouponPayload, 'expiresAt' | 'usedAt' | 'sentAt'> {
  expiresAt: number;
  usedAt?: number;
  sentAt: number;
}

export interface RewardSettings {
  /**
   * 자녀가 쿠폰을 받았을 때 부모에게도 알림 발송 여부
   * 기본값: true (자녀가 설정에서 변경 가능)
   */
  notifyParentOnCoupon: boolean;
}

// ──────────────────────────────────────────────
// 발송 조건 (3개 모두 충족 필요)
// ──────────────────────────────────────────────

export interface EligibilityResult {
  eligible: boolean;
  reasons: {
    accountAgeMonths: number;    // 5개월 이상 필요
    promiseKeptRate: number;     // 0.9 이상 필요
    isActiveSubscriber: boolean; // 활성 구독자
  };
}

// ──────────────────────────────────────────────
// 쿠폰 상태 분류
// ──────────────────────────────────────────────

export type CouponStatus = 'active' | 'used' | 'expired';

export interface CouponWithStatus extends CouponPayload {
  status: CouponStatus;
}
