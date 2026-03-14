import {
  isValidEmail,
  isValidPassword,
  isValidInviteCode,
  isUnder14,
} from '../src/utils/validators';

describe('validators', () => {
  describe('isValidEmail', () => {
    it('유효한 이메일', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name+tag@domain.co.kr')).toBe(true);
    });
    it('유효하지 않은 이메일', () => {
      expect(isValidEmail('notanemail')).toBe(false);
      expect(isValidEmail('@missing.com')).toBe(false);
      expect(isValidEmail('')).toBe(false);
    });
  });

  describe('isValidPassword', () => {
    it('8자 이상 유효', () => {
      expect(isValidPassword('12345678')).toBe(true);
      expect(isValidPassword('longpassword!')).toBe(true);
    });
    it('7자 이하 무효', () => {
      expect(isValidPassword('1234567')).toBe(false);
      expect(isValidPassword('')).toBe(false);
    });
  });

  describe('isValidInviteCode', () => {
    it('6자리 대문자+숫자 유효', () => {
      expect(isValidInviteCode('ABCD23')).toBe(true);
      expect(isValidInviteCode('234567')).toBe(true);
    });
    it('소문자/특수문자/6자 아닌 경우 무효', () => {
      expect(isValidInviteCode('abcd23')).toBe(false);
      expect(isValidInviteCode('ABCD2')).toBe(false);
      expect(isValidInviteCode('ABCD234')).toBe(false);
      expect(isValidInviteCode('ABC D2')).toBe(false);
    });
  });

  describe('isUnder14', () => {
    const currentYear = new Date().getFullYear();
    it('14세 미만 true', () => {
      expect(isUnder14(currentYear - 10)).toBe(true);
      expect(isUnder14(currentYear - 13)).toBe(true);
    });
    it('14세 이상 false', () => {
      expect(isUnder14(currentYear - 14)).toBe(false);
      expect(isUnder14(currentYear - 20)).toBe(false);
    });
  });
});
