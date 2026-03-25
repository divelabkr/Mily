// ──────────────────────────────────────────────
// promiseLoopV2.test.ts — 약속 루프 서비스 테스트
// ──────────────────────────────────────────────

import {
  getPromiseFeedbackMessage,
  executePromiseLoop,
  getPromiseStatus,
  getGoodMoments,
  PromiseLoopFlowResult,
} from '../src/engines/review/promiseLoopService';

jest.mock('../src/lib/firebase', () => ({
  getFirebaseDb: jest.fn(() => ({})),
}));
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(() => Promise.resolve({ exists: () => false })),
  collection: jest.fn(),
  getDocs: jest.fn(() => Promise.resolve({ docs: [] })),
  query: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
}));
jest.mock('../src/engines/monitoring/posthogService', () => ({
  capture: jest.fn(),
}));
jest.mock('../src/engines/notification/notificationService', () => ({
  isAllowedHour: jest.fn(() => true),
}));
jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  scheduleNotificationAsync: jest.fn(() => Promise.resolve()),
}));
jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
}));

const BLAME_WORDS = ['잘못', '안됐', '실패'];
const DNA_FORBIDDEN = ['통제', '감시', '훈계'];

describe('getPromiseFeedbackMessage', () => {
  it('kept=true → 메시지에 "지켰어요" 포함', () => {
    const msg = getPromiseFeedbackMessage(true);
    expect(msg).toContain('지켰어요');
  });

  it('kept=false → 메시지에 "다음 주" 포함', () => {
    const msg = getPromiseFeedbackMessage(false);
    expect(msg).toContain('다음 주');
  });

  it('kept=null → 메시지에 "확인" 포함', () => {
    const msg = getPromiseFeedbackMessage(null);
    expect(msg).toContain('확인');
  });

  it('kept=true → 비난 단어 미포함 (잘못, 안됐, 실패)', () => {
    const msg = getPromiseFeedbackMessage(true);
    for (const word of BLAME_WORDS) {
      expect(msg).not.toContain(word);
    }
  });

  it('kept=false → 비난 단어 미포함 (잘못, 안됐, 실패)', () => {
    const msg = getPromiseFeedbackMessage(false);
    for (const word of BLAME_WORDS) {
      expect(msg).not.toContain(word);
    }
  });
});

describe('executePromiseLoop', () => {
  it('약속 미달성 시 → kept=false, parentNotified=false', async () => {
    // getDoc이 exists()=false를 반환하므로 kept=null → kept=false 경로
    const result: PromiseLoopFlowResult = await executePromiseLoop(
      'uid-test',
      '2026-W13',
      '민준',
      'child-uid-test'
    );
    expect(result.kept).toBe(false);
    expect(result.parentNotified).toBe(false);
  });

  it('반환 타입에 필수 필드 kept, parentNotified, achievementTriggered 존재', async () => {
    const result = await executePromiseLoop(
      'uid-test',
      '2026-W13',
      '민준',
      'child-uid-test'
    );
    expect(result).toHaveProperty('kept');
    expect(result).toHaveProperty('parentNotified');
    expect(result).toHaveProperty('achievementTriggered');
  });
});

describe('getPromiseStatus', () => {
  it('존재하지 않는 문서 → promiseText=null, kept=null', async () => {
    const status = await getPromiseStatus('non-existent-uid', '2026-W13');
    expect(status.promiseText).toBeNull();
    expect(status.kept).toBeNull();
  });
});

describe('getGoodMoments', () => {
  it('데이터 없을 때 빈 배열 반환', async () => {
    const moments = await getGoodMoments('uid-test', undefined, '2026-W13');
    expect(Array.isArray(moments)).toBe(true);
    expect(moments.length).toBe(0);
  });
});

describe('DNA 검사 — 약속 루프 메시지', () => {
  it('모든 kept 상태 메시지에 통제/감시/훈계 미포함', () => {
    const messages = [
      getPromiseFeedbackMessage(true),
      getPromiseFeedbackMessage(false),
      getPromiseFeedbackMessage(null),
    ];
    for (const msg of messages) {
      for (const word of DNA_FORBIDDEN) {
        expect(msg).not.toContain(word);
      }
    }
  });
});
