import {
  getWeekId,
  getMonthId,
  isWeekday,
  isWeekend,
  isNotificationAllowed,
} from '../src/utils/dateUtils';

describe('dateUtils', () => {
  describe('getWeekId', () => {
    it('YYYY-Www 형식 반환', () => {
      const weekId = getWeekId();
      expect(weekId).toMatch(/^\d{4}-W\d{2}$/);
    });

    it('특정 날짜 처리', () => {
      const monday = new Date(2026, 2, 9); // 2026-03-09 (월요일)
      const weekId = getWeekId(monday);
      expect(weekId).toMatch(/^2026-W/);
    });
  });

  describe('getMonthId', () => {
    it('YYYY-MM 형식 반환', () => {
      const monthId = getMonthId();
      expect(monthId).toMatch(/^\d{4}-\d{2}$/);
    });
  });

  describe('isWeekday / isWeekend', () => {
    it('월~금 평일', () => {
      const monday = new Date(2026, 2, 9);
      expect(isWeekday(monday)).toBe(true);
      expect(isWeekend(monday)).toBe(false);
    });

    it('토·일 주말', () => {
      const saturday = new Date(2026, 2, 7);
      expect(isWeekday(saturday)).toBe(false);
      expect(isWeekend(saturday)).toBe(true);
    });
  });

  describe('isNotificationAllowed', () => {
    it('08:00~21:59 허용', () => {
      const morning = new Date();
      morning.setHours(9, 0, 0);
      expect(isNotificationAllowed(morning)).toBe(true);
    });

    it('22:00 이후 금지', () => {
      const night = new Date();
      night.setHours(22, 0, 0);
      expect(isNotificationAllowed(night)).toBe(false);
    });

    it('07:59 이전 금지', () => {
      const early = new Date();
      early.setHours(7, 59, 0);
      expect(isNotificationAllowed(early)).toBe(false);
    });
  });
});
