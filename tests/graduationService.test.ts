/**
 * graduationService.test.ts
 * 성년 전환 오케스트레이션 단위 테스트
 */

import {
  runGraduation,
  shouldShowCelebration,
  markCelebrationShown,
  isGraduationEligible,
} from '../src/engines/graduation/graduationService';

// firebase 모킹
jest.mock('../src/lib/firebase', () => ({
  getFirebaseDb: jest.fn(() => ({})),
}));

// posthog 모킹
jest.mock('../src/engines/monitoring/posthogService', () => ({
  capture: jest.fn(),
}));

// familyEnhanceService 모킹
const mockGraduateToAdult = jest.fn().mockResolvedValue(undefined);
jest.mock('../src/engines/family/familyEnhanceService', () => ({
  graduateToAdult: (...args: any[]) => (mockGraduateToAdult as any)(...args),
  calcAgeAtDate: jest.requireActual('../src/engines/family/familyEnhanceService').calcAgeAtDate,
}));

// firestore 모킹
const mockGetDoc = jest.fn();
const mockUpdateDoc = jest.fn().mockResolvedValue(undefined);
const mockDoc = jest.fn(() => ({ id: 'mock-ref' }));
const mockServerTimestamp = jest.fn(() => 'SERVER_TS');

jest.mock('firebase/firestore', () => ({
  doc: (...args: any[]) => (mockDoc as any)(...args),
  getDoc: (...args: any[]) => (mockGetDoc as any)(...args),
  updateDoc: (...args: any[]) => (mockUpdateDoc as any)(...args),
  serverTimestamp: () => mockServerTimestamp(),
}));

function makeUserSnap(data: Record<string, unknown>) {
  return { exists: () => true, data: () => data };
}

beforeEach(() => {
  jest.clearAllMocks();
});

// ──────────────────────────────────────────────
// 1. isGraduationEligible()
// ──────────────────────────────────────────────

describe('isGraduationEligible()', () => {
  it('만 18세 이상이면 true', () => {
    const now = new Date();
    expect(isGraduationEligible(now.getFullYear() - 18, 1, 1)).toBe(true);
    expect(isGraduationEligible(now.getFullYear() - 20, 6, 15)).toBe(true);
  });

  it('만 17세이면 false', () => {
    const now = new Date();
    expect(isGraduationEligible(now.getFullYear() - 17, 1, 1)).toBe(false);
  });
});

// ──────────────────────────────────────────────
// 2. runGraduation()
// ──────────────────────────────────────────────

describe('runGraduation()', () => {
  it('만 18세 미만이면 success=false 즉시 반환', async () => {
    const now = new Date();
    const result = await runGraduation('uid-minor', now.getFullYear() - 15, 1, 1);

    expect(result.success).toBe(false);
    expect(mockGetDoc).not.toHaveBeenCalled();
    expect(mockGraduateToAdult).not.toHaveBeenCalled();
  });

  it('유저 문서 없으면 success=false', async () => {
    const now = new Date();
    mockGetDoc.mockResolvedValueOnce({ exists: () => false });

    const result = await runGraduation('uid-nouser', now.getFullYear() - 20, 1, 1);

    expect(result.success).toBe(false);
    expect(mockGraduateToAdult).not.toHaveBeenCalled();
  });

  it('이미 전환된 유저는 alreadyGraduated=true 반환', async () => {
    const now = new Date();
    mockGetDoc.mockResolvedValueOnce(
      makeUserSnap({ graduatedAt: 'SERVER_TS', role: 'individual' })
    );

    const result = await runGraduation('uid-already', now.getFullYear() - 20, 1, 1);

    expect(result.success).toBe(true);
    expect(result.alreadyGraduated).toBe(true);
    expect(mockGraduateToAdult).not.toHaveBeenCalled();
  });

  it('정상 전환 성공 + graduation_achieved 업적 반환', async () => {
    const now = new Date();
    mockGetDoc.mockResolvedValueOnce(
      makeUserSnap({ role: 'child' }) // graduatedAt 없음
    );

    const result = await runGraduation('uid-adult', now.getFullYear() - 18, 1, 1);

    expect(result.success).toBe(true);
    expect(result.alreadyGraduated).toBe(false);
    expect(result.achievementsUnlocked).toContain('graduation_achieved');
    expect(mockGraduateToAdult).toHaveBeenCalledWith('uid-adult', expect.any(Number), 1, 1);
  });

  it('couponSent는 항상 false (쿠폰은 호출 측 별도 처리)', async () => {
    const now = new Date();
    mockGetDoc.mockResolvedValueOnce(makeUserSnap({ role: 'child' }));

    const result = await runGraduation(
      'uid-coupon',
      now.getFullYear() - 18, 1, 1,
      { couponEnabled: true }
    );

    expect(result.couponSent).toBe(false);
  });
});

// ──────────────────────────────────────────────
// 3. shouldShowCelebration()
// ──────────────────────────────────────────────

describe('shouldShowCelebration()', () => {
  it('graduatedAt + celebrationShown=false이면 true', async () => {
    mockGetDoc.mockResolvedValueOnce(
      makeUserSnap({ graduatedAt: 'TS', graduationCelebrationShown: false })
    );

    const result = await shouldShowCelebration('uid-001');
    expect(result).toBe(true);
  });

  it('celebrationShown=true이면 false', async () => {
    mockGetDoc.mockResolvedValueOnce(
      makeUserSnap({ graduatedAt: 'TS', graduationCelebrationShown: true })
    );

    const result = await shouldShowCelebration('uid-002');
    expect(result).toBe(false);
  });

  it('문서 없으면 false', async () => {
    mockGetDoc.mockResolvedValueOnce({ exists: () => false });
    const result = await shouldShowCelebration('uid-003');
    expect(result).toBe(false);
  });
});

// ──────────────────────────────────────────────
// 4. markCelebrationShown()
// ──────────────────────────────────────────────

describe('markCelebrationShown()', () => {
  it('updateDoc 호출 확인', async () => {
    await markCelebrationShown('uid-001');
    expect(mockUpdateDoc).toHaveBeenCalledTimes(1);
    const [, updateData] = mockUpdateDoc.mock.calls[0];
    expect(updateData.graduationCelebrationShown).toBe(true);
  });
});
