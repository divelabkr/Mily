/**
 * promiseLoop.test.ts
 * 약속-행동-인정 루프 단위 테스트
 */

import {
  getPromiseFeedbackMessage,
  trackPromiseKept,
  trackPromiseMissed,
  notifyParentPromiseKept,
  getGoodMoments,
} from '../src/engines/review/promiseLoopService';

// posthog 모킹
const mockCapture = jest.fn();
jest.mock('../src/engines/monitoring/posthogService', () => ({
  capture: (...args: any[]) => (mockCapture as any)(...args),
}));

// firebase 모킹
jest.mock('../src/lib/firebase', () => ({
  getFirebaseDb: jest.fn(() => ({})),
}));

// firebase/firestore 모킹
const mockGetDoc = jest.fn();
const mockGetDocs = jest.fn(() => Promise.resolve({ docs: [] }));
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: (...args: any[]) => (mockGetDoc as any)(...args),
  collection: jest.fn(),
  getDocs: (...args: any[]) => (mockGetDocs as any)(...args),
  query: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
}));

// react-native Platform 모킹 (OS = 'ios' → 알림 허용)
jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
}));

// expo-notifications 모킹
const mockSchedule = jest.fn(() => Promise.resolve());
jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  scheduleNotificationAsync: (...args: any[]) => (mockSchedule as any)(...args),
}));

// notificationService 모킹
const mockIsAllowedHour = jest.fn(() => true);
jest.mock('../src/engines/notification/notificationService', () => ({
  isAllowedHour: () => mockIsAllowedHour(),
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockGetDocs.mockResolvedValue({ docs: [] });
  mockIsAllowedHour.mockReturnValue(true);
  mockSchedule.mockResolvedValue(undefined);
});

// ──────────────────────────────────────────────
// 1. getPromiseFeedbackMessage()
// ──────────────────────────────────────────────

describe('getPromiseFeedbackMessage()', () => {
  it('kept=true → 달성 메시지', () => {
    const msg = getPromiseFeedbackMessage(true);
    expect(msg).toContain('약속을 지켰어요');
  });

  it('kept=false → 비난 없는 격려 메시지', () => {
    const msg = getPromiseFeedbackMessage(false);
    expect(msg).toContain('괜찮아요');
    expect(msg).toContain('다음 주');
  });

  it('kept=null → 확인 유도 메시지', () => {
    const msg = getPromiseFeedbackMessage(null);
    expect(msg.length).toBeGreaterThan(0);
  });

  it('kept=false 메시지에 비난/훈계 표현 없음', () => {
    const msg = getPromiseFeedbackMessage(false);
    expect(msg).not.toContain('실패');
    expect(msg).not.toContain('못했');
    expect(msg).not.toContain('나쁜');
    expect(msg).not.toContain('문제');
  });
});

// ──────────────────────────────────────────────
// 2. trackPromiseKept()
// ──────────────────────────────────────────────

describe('trackPromiseKept()', () => {
  it('promise_kept 이벤트 발생', () => {
    trackPromiseKept('2025-W10', '운동 30분 하기');
    expect(mockCapture).toHaveBeenCalledWith(
      'promise_kept',
      expect.objectContaining({ weekId: '2025-W10', hasText: true })
    );
  });

  it('promiseText 있음 → hasText=true', () => {
    trackPromiseKept('2025-W10', '책 읽기');
    expect(mockCapture).toHaveBeenCalledWith(
      'promise_kept',
      expect.objectContaining({ hasText: true })
    );
  });
});

// ──────────────────────────────────────────────
// 3. trackPromiseMissed()
// ──────────────────────────────────────────────

describe('trackPromiseMissed()', () => {
  it('promise_missed 이벤트 발생', () => {
    trackPromiseMissed('2025-W10');
    expect(mockCapture).toHaveBeenCalledWith(
      'promise_missed',
      expect.objectContaining({ weekId: '2025-W10' })
    );
  });
});

// ──────────────────────────────────────────────
// 4. notifyParentPromiseKept()
// ──────────────────────────────────────────────

describe('notifyParentPromiseKept()', () => {
  it('권한 허용 + 허용된 시간 → 알림 발송', async () => {
    await notifyParentPromiseKept('민준');
    expect(mockSchedule).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.objectContaining({
          title: expect.stringContaining('약속 달성'),
          body: expect.stringContaining('민준'),
        }),
      })
    );
  });

  it('알림 본문에 칭찬 카드 제안 포함', async () => {
    await notifyParentPromiseKept('지은');
    const call = (mockSchedule.mock.calls as any)[0]?.[0];
    expect(call.content.body).toContain('칭찬 카드');
  });

  it('허용되지 않은 시간 → 알림 발송 안 함', async () => {
    mockIsAllowedHour.mockReturnValueOnce(false);
    await notifyParentPromiseKept('민준');
    expect(mockSchedule).not.toHaveBeenCalled();
  });
});

// ──────────────────────────────────────────────
// 5. getGoodMoments()
// ──────────────────────────────────────────────

describe('getGoodMoments()', () => {
  it('약속 미달성 → promise_kept 모먼트 없음', async () => {
    mockGetDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ weeklyPromise: '운동하기', promiseKept: false }),
    });

    const moments = await getGoodMoments('uid1', undefined, '2025-W10');
    expect(moments.filter((m) => m.type === 'promise_kept')).toHaveLength(0);
  });

  it('약속 달성 → promise_kept 모먼트 포함', async () => {
    mockGetDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ weeklyPromise: '운동하기', promiseKept: true }),
    });

    const moments = await getGoodMoments('uid1', undefined, '2025-W10');
    const kept = moments.filter((m) => m.type === 'promise_kept');
    expect(kept).toHaveLength(1);
    expect(kept[0].description).toContain('운동하기');
  });

  it('Firestore 오류 → 빈 배열 반환 (graceful fallback)', async () => {
    mockGetDoc.mockRejectedValueOnce(new Error('Firestore error'));

    const moments = await getGoodMoments('uid1', undefined, '2025-W10');
    expect(Array.isArray(moments)).toBe(true);
  });

  it('familyId 없음 → 칭찬 카드 조회 생략 (getDocs 미호출)', async () => {
    mockGetDoc.mockResolvedValueOnce({ exists: () => false });

    await getGoodMoments('uid1', undefined, '2025-W10');
    expect(mockGetDocs).not.toHaveBeenCalled();
  });
});
