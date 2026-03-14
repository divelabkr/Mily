import { generateReferralCode } from '../src/engines/family/referral';

// Firebase mock
jest.mock('../src/lib/firebase', () => ({
  getFirebaseDb: jest.fn(() => ({})),
}));
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  setDoc: jest.fn(),
  getDoc: jest.fn(),
  updateDoc: jest.fn(),
  serverTimestamp: jest.fn(),
}));
jest.mock('../src/engines/analytics/analyticsService', () => ({
  Events: { referralSent: jest.fn(), referralAccepted: jest.fn() },
}));

describe('referral', () => {
  describe('generateReferralCode', () => {
    it('6자리 코드 생성', () => {
      const code = generateReferralCode();
      expect(code).toHaveLength(6);
    });

    it('대문자+숫자만 포함', () => {
      const code = generateReferralCode();
      expect(code).toMatch(/^[A-Z0-9]{6}$/);
    });

    it('호출마다 다른 코드 생성 (확률적 통과)', () => {
      const codes = new Set(Array.from({ length: 10 }, generateReferralCode));
      expect(codes.size).toBeGreaterThan(1);
    });
  });
});
