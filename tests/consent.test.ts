import {
  isUnder14,
  isValidGuardianEmail,
  isValidGuardianPhone,
} from '../src/engines/consent/consentService';

// Firestore 의존 함수(createConsent, requestGuardianConsent 등)는
// Firebase 에뮬레이터 환경에서 별도 통합 테스트로 처리.
// 여기서는 순수 함수만 테스트한다.

describe('consentService — 순수 함수', () => {

  describe('isUnder14', () => {
    const currentYear = new Date().getFullYear();

    it('현재 연도 - 13 → true (13세)', () => {
      expect(isUnder14(currentYear - 13)).toBe(true);
    });

    it('현재 연도 - 7 → true (7세)', () => {
      expect(isUnder14(currentYear - 7)).toBe(true);
    });

    it('현재 연도 - 14 → false (정확히 14세)', () => {
      // 생년도 기반 단순 계산: currentYear - birthYear < 14
      expect(isUnder14(currentYear - 14)).toBe(false);
    });

    it('현재 연도 - 15 → false (15세)', () => {
      expect(isUnder14(currentYear - 15)).toBe(false);
    });

    it('현재 연도 - 18 → false (18세)', () => {
      expect(isUnder14(currentYear - 18)).toBe(false);
    });
  });

  describe('isValidGuardianEmail', () => {
    it('정상 이메일 → true', () => {
      expect(isValidGuardianEmail('parent@example.com')).toBe(true);
    });

    it('서브도메인 이메일 → true', () => {
      expect(isValidGuardianEmail('user@mail.company.co.kr')).toBe(true);
    });

    it('@없음 → false', () => {
      expect(isValidGuardianEmail('notanemail')).toBe(false);
    });

    it('도메인 없음 → false', () => {
      expect(isValidGuardianEmail('user@')).toBe(false);
    });

    it('빈 문자열 → false', () => {
      expect(isValidGuardianEmail('')).toBe(false);
    });
  });

  describe('isValidGuardianPhone', () => {
    it('010-XXXX-XXXX 형식 → true', () => {
      expect(isValidGuardianPhone('010-1234-5678')).toBe(true);
    });

    it('하이픈 없는 010XXXXXXXX → true', () => {
      expect(isValidGuardianPhone('01012345678')).toBe(true);
    });

    it('+82로 시작하는 E.164 → true', () => {
      expect(isValidGuardianPhone('+821012345678')).toBe(true);
    });

    it('011 번호 → true (구형 번호)', () => {
      expect(isValidGuardianPhone('01112345678')).toBe(true);
    });

    it('일반 전화번호 (02) → false', () => {
      expect(isValidGuardianPhone('02-1234-5678')).toBe(false);
    });

    it('빈 문자열 → false', () => {
      expect(isValidGuardianPhone('')).toBe(false);
    });
  });
});
