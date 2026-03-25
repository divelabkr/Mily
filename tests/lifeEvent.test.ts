jest.mock('../src/lib/firebase', () => ({ getFirebaseDb: jest.fn(() => ({})) }));
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(() => ({})),
  getDoc: jest.fn(() => Promise.resolve({ exists: () => false })),
  setDoc: jest.fn(() => Promise.resolve()),
  updateDoc: jest.fn(() => Promise.resolve()),
}));

import {
  LIFE_EVENTS, getEventById, getEventsByType, getEventsForBand,
  getMonthlyEvent, LifeEventType,
} from '../src/engines/cashflow/lifeEventService';

describe('lifeEventService', () => {
  test('1. LIFE_EVENTS has exactly 30 entries', () => {
    expect(LIFE_EVENTS).toHaveLength(30);
  });

  test('2. Bonus events: getEventsByType("bonus") has 10 entries', () => {
    expect(getEventsByType('bonus')).toHaveLength(10);
  });

  test('3. Challenge events: getEventsByType("challenge") has 10 entries', () => {
    expect(getEventsByType('challenge')).toHaveLength(10);
  });

  test('4. Family decision events: getEventsByType("family_decision") has 10 entries', () => {
    expect(getEventsByType('family_decision')).toHaveLength(10);
  });

  test('5. getEventById("LE-01") returns the bonus event with emoji "🎂"', () => {
    const event = getEventById('LE-01');
    expect(event).toBeDefined();
    expect(event?.emoji).toBe('🎂');
  });

  test('6. getEventById("LE-06") has financialImpact 50000 (세뱃돈)', () => {
    const event = getEventById('LE-06');
    expect(event).toBeDefined();
    expect(event?.financialImpact).toBe(50000);
  });

  test('7. getEventById("nonexistent") returns undefined', () => {
    expect(getEventById('nonexistent')).toBeUndefined();
  });

  test('8. All events have id, type, emoji, title, description', () => {
    for (const event of LIFE_EVENTS) {
      expect(event).toHaveProperty('id');
      expect(event).toHaveProperty('type');
      expect(event).toHaveProperty('emoji');
      expect(event).toHaveProperty('title');
      expect(event).toHaveProperty('description');
    }
  });

  test('9. All events have weight > 0', () => {
    for (const event of LIFE_EVENTS) {
      expect(event.weight).toBeGreaterThan(0);
    }
  });

  test('10. getEventsForBand("A") returns subset (events without targetBands or with "A" in targetBands)', () => {
    const events = getEventsForBand('A');
    expect(events.length).toBeGreaterThan(0);
    for (const event of events) {
      const hasNoTargetBands = !event.targetBands || event.targetBands.length === 0;
      const hasBandA = event.targetBands?.includes('A');
      expect(hasNoTargetBands || hasBandA).toBe(true);
    }
  });

  test('11. getEventsForBand("D") returns events matching band D', () => {
    const events = getEventsForBand('D');
    expect(events.length).toBeGreaterThan(0);
    for (const event of events) {
      const hasNoTargetBands = !event.targetBands || event.targetBands.length === 0;
      const hasBandD = event.targetBands?.includes('D');
      expect(hasNoTargetBands || hasBandD).toBe(true);
    }
  });

  test('12. getMonthlyEvent returns a LifeEvent (async test)', async () => {
    const event = await getMonthlyEvent('A');
    expect(event).toBeDefined();
    expect(event).toHaveProperty('id');
    expect(event).toHaveProperty('type');
    expect(event).toHaveProperty('emoji');
    expect(event).toHaveProperty('title');
    expect(event).toHaveProperty('description');
  });

  test('13. All challenge events have actionRequired defined', () => {
    const challengeEvents = getEventsByType('challenge');
    for (const event of challengeEvents) {
      expect(event.actionRequired).toBeDefined();
    }
  });

  test('14. All family_decision events have actionRequired === "family_discussion"', () => {
    const familyEvents = getEventsByType('family_decision');
    for (const event of familyEvents) {
      expect(event.actionRequired).toBe('family_discussion');
    }
  });

  test('15. No event description/title contains DNA-forbidden words', () => {
    const forbidden = ['통제', '감시', '과소비', '훈계', '낙인'];
    for (const event of LIFE_EVENTS) {
      for (const word of forbidden) {
        expect(event.title).not.toContain(word);
        expect(event.description).not.toContain(word);
      }
    }
  });
});
