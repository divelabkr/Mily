import { getHomeCtaType } from '../src/engines/plan/homeCtaLogic';

// dateUtils mock
jest.mock('../src/utils/dateUtils', () => ({
  ...jest.requireActual('../src/utils/dateUtils'),
  isWeekday: jest.fn(),
}));

const { isWeekday } = require('../src/utils/dateUtils');

describe('homeCtaLogic', () => {
  it('평일: record 반환', () => {
    isWeekday.mockReturnValue(true);
    expect(getHomeCtaType()).toBe('record');
  });

  it('주말: review 반환', () => {
    isWeekday.mockReturnValue(false);
    expect(getHomeCtaType()).toBe('review');
  });
});
