/**
 * rewardService.test.ts
 * 운영자 깜짝 보상 쿠폰 서비스 단위 테스트
 */

import {
  isEligible,
  getCoupons,
  hasActiveCoupons,
  markAsUsed,
  checkAndExpireCoupons,
  getRewardSettings,
  updateRewardSettings,
} from '../src/engines/reward/rewardService';

// httpsCallable 모킹
const mockHttpsCallable = jest.fn();
jest.mock('../src/lib/firebase', () => ({
  getFirebaseApp: jest.fn(() => ({})),
  getFirebaseAuth: jest.fn(),
  getFirebaseDb: jest.fn(() => ({})),
  getFirebaseFunctions: jest.fn(() => ({})),
}));
jest.mock('firebase/functions', () => ({
  httpsCallable: () => mockHttpsCallable,
}));

// posthog 모킹
jest.mock('../src/engines/monitoring/posthogService', () => ({
  capture: jest.fn(),
}));

// notification 모킹
jest.mock('../src/engines/notification/notificationService', () => ({
  notifyCouponReceived: jest.fn().mockResolvedValue(undefined),
  notifyParentCouponAlert: jest.fn().mockResolvedValue(undefined),
}));

// firestore 모킹
const mockSetDoc = jest.fn().mockResolvedValue(undefined);
const mockUpdateDoc = jest.fn().mockResolvedValue(undefined);
const mockGetDoc = jest.fn();
const mockGetDocs = jest.fn();
const mockDoc = jest.fn(() => ({ id: 'mock-ref' }));
const mockCollection = jest.fn(() => ({ id: 'mock-collection' }));
const mockQuery = jest.fn((...args: any[]) => args[0]);
const mockWhere = jest.fn();
const mockDeleteField = jest.fn(() => 'DELETE_SENTINEL');

jest.mock('firebase/firestore', () => ({
  doc: (...args: any[]) => (mockDoc as any)(...args),
  collection: (...args: any[]) => (mockCollection as any)(...args),
  getDoc: (...args: any[]) => (mockGetDoc as any)(...args),
  getDocs: (...args: any[]) => (mockGetDocs as any)(...args),
  setDoc: (...args: any[]) => (mockSetDoc as any)(...args),
  updateDoc: (...args: any[]) => (mockUpdateDoc as any)(...args),
  query: (...args: any[]) => (mockQuery as any)(...args),
  where: (...args: any[]) => (mockWhere as any)(...args),
  deleteField: () => mockDeleteField(),
}));

// ─── 공통 헬퍼 ───────────────────────────────

const NOW = Date.now();
const FIVE_MONTHS_AGO = NOW - 5 * 30 * 24 * 60 * 60 * 1000 - 1000; // 5개월 초과
const FOUR_MONTHS_AGO = NOW - 4 * 30 * 24 * 60 * 60 * 1000;        // 4개월 미만

function makeUserSnap(createdAtMs: number) {
  return {
    exists: () => true,
    data: () => ({ createdAt: { toMillis: () => createdAtMs } }),
  };
}

function makeReviewsSnap(kept: number, total: number) {
  const docs: { data: () => Record<string, unknown> }[] = [];
  for (let i = 0; i < kept; i++) docs.push({ data: () => ({ promiseKept: true }) });
  for (let i = 0; i < total - kept; i++) docs.push({ data: () => ({ promiseKept: false }) });
  return { forEach: (fn: (d: { data: () => Record<string, unknown> }) => void) => docs.forEach(fn) };
}

function makeSubSnap(isActive: boolean) {
  return { exists: () => true, data: () => ({ isActive }) };
}

function makeCouponSnap(coupons: Array<Record<string, unknown>>) {
  return {
    forEach: (fn: (d: { data: () => Record<string, unknown> }) => void) =>
      coupons.forEach((c) => fn({ data: () => c })),
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

// ──────────────────────────────────────────────
// 1. isEligible() — 발송 자격 검사
// ──────────────────────────────────────────────

describe('isEligible()', () => {
  it('가입 5개월 미만이면 false 반환', async () => {
    // 가입 4개월
    mockGetDoc
      .mockResolvedValueOnce(makeUserSnap(FOUR_MONTHS_AGO)) // users/uid
      .mockResolvedValueOnce(makeSubSnap(true));             // subscriptions/uid
    mockGetDocs.mockResolvedValueOnce(makeReviewsSnap(10, 10)); // 100% 이행

    const result = await isEligible('uid-001');

    expect(result).toBe(false);
  });

  it('약속 이행률 90% 미만이면 false 반환', async () => {
    // 가입 6개월, 이행률 80%
    mockGetDoc
      .mockResolvedValueOnce(makeUserSnap(FIVE_MONTHS_AGO))
      .mockResolvedValueOnce(makeSubSnap(true));
    mockGetDocs.mockResolvedValueOnce(makeReviewsSnap(8, 10)); // 80%

    const result = await isEligible('uid-002');

    expect(result).toBe(false);
  });

  it('비활성 구독자이면 false 반환', async () => {
    mockGetDoc
      .mockResolvedValueOnce(makeUserSnap(FIVE_MONTHS_AGO))
      .mockResolvedValueOnce(makeSubSnap(false)); // 비활성
    mockGetDocs.mockResolvedValueOnce(makeReviewsSnap(10, 10));

    const result = await isEligible('uid-003');

    expect(result).toBe(false);
  });

  it('모든 조건 충족 시 true 반환', async () => {
    mockGetDoc
      .mockResolvedValueOnce(makeUserSnap(FIVE_MONTHS_AGO)) // 5개월+
      .mockResolvedValueOnce(makeSubSnap(true));             // 활성
    mockGetDocs.mockResolvedValueOnce(makeReviewsSnap(10, 10)); // 100%

    const result = await isEligible('uid-004');

    expect(result).toBe(true);
  });
});

// ──────────────────────────────────────────────
// 2. hasActiveCoupons() — 선물함 아이콘 표시 여부
// ──────────────────────────────────────────────

describe('hasActiveCoupons()', () => {
  it('활성 쿠폰 있으면 true 반환', async () => {
    const futureCoupon = {
      couponId: 'c1',
      isVisible: true,
      usedAt: undefined,
      expiresAt: NOW + 7 * 24 * 60 * 60 * 1000, // 7일 후
    };
    mockGetDocs.mockResolvedValueOnce(makeCouponSnap([futureCoupon]));

    const result = await hasActiveCoupons('uid-005');

    expect(result).toBe(true);
  });

  it('isVisible=false이면 false 반환', async () => {
    const hiddenCoupon = {
      couponId: 'c2',
      isVisible: false,
      usedAt: undefined,
      expiresAt: NOW + 7 * 24 * 60 * 60 * 1000,
    };
    mockGetDocs.mockResolvedValueOnce(makeCouponSnap([hiddenCoupon]));

    const result = await hasActiveCoupons('uid-006');

    expect(result).toBe(false);
  });

  it('만료된 쿠폰만 있으면 false 반환', async () => {
    const expiredCoupon = {
      couponId: 'c3',
      isVisible: true,
      usedAt: undefined,
      expiresAt: NOW - 1000, // 이미 만료
    };
    mockGetDocs.mockResolvedValueOnce(makeCouponSnap([expiredCoupon]));

    const result = await hasActiveCoupons('uid-007');

    expect(result).toBe(false);
  });
});

// ──────────────────────────────────────────────
// 3. markAsUsed() — 사용 완료 처리
// ──────────────────────────────────────────────

describe('markAsUsed()', () => {
  it('사용 완료 시 Functions callable 호출', async () => {
    const couponSnap = {
      exists: () => true,
      data: () => ({
        couponId: 'c10',
        brand: '스타벅스',
        value: 5000,
        isVisible: true,
      }),
    };
    mockGetDoc.mockResolvedValueOnce(couponSnap);
    mockHttpsCallable.mockResolvedValueOnce({ data: { success: true } });

    await markAsUsed('uid-008', 'c10');

    expect(mockHttpsCallable).toHaveBeenCalledWith({ uid: 'uid-008', couponId: 'c10' });
  });
});

// ──────────────────────────────────────────────
// 4. checkAndExpireCoupons() — 만료 처리
// ──────────────────────────────────────────────

describe('checkAndExpireCoupons()', () => {
  it('Functions callable로 만료 처리 위임', async () => {
    mockHttpsCallable.mockResolvedValueOnce({ data: { expired: 1 } });

    await checkAndExpireCoupons('uid-009');

    expect(mockHttpsCallable).toHaveBeenCalledWith({ uid: 'uid-009' });
  });
});

// ──────────────────────────────────────────────
// 5. 부모 알림 설정 — notifyParentOnCoupon
// ──────────────────────────────────────────────

const { notifyCouponReceived, notifyParentCouponAlert } = jest.requireMock(
  '../src/engines/notification/notificationService'
) as {
  notifyCouponReceived: jest.Mock;
  notifyParentCouponAlert: jest.Mock;
};

describe('notifyParentOnCoupon 설정', () => {
  it('getRewardSettings — 기본값 notifyParentOnCoupon=true', async () => {
    mockGetDoc.mockResolvedValueOnce({ exists: () => false });

    const settings = await getRewardSettings('uid-010');

    expect(settings.notifyParentOnCoupon).toBe(true);
  });

  it('updateRewardSettings — Firestore에 저장 후 capture 호출', async () => {
    const { capture } = jest.requireMock('../src/engines/monitoring/posthogService') as {
      capture: jest.Mock;
    };

    await updateRewardSettings('uid-011', { notifyParentOnCoupon: false });

    expect(mockSetDoc).toHaveBeenCalledTimes(1);
    expect(capture).toHaveBeenCalledWith('reward_settings_changed', { notifyParent: false });
  });
});
