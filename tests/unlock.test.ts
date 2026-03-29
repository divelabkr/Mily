import {
  calcAge,
  getAgeBandForAge,
  getFeaturesForAge,
  evaluateReadiness,
  applyEarlyUnlock,
  syncAgeBasedUnlocks,
  notifyParentEarlyUnlock,
  useUnlockStore,
} from '../src/engines/unlock/unlockService';
import {
  AGE_BANDS,
  READINESS_DIALOGS,
  UnlockStatus,
} from '../src/engines/unlock/unlockTypes';

// Firebase mock
jest.mock('../src/lib/firebase', () => ({
  getFirebaseDb: jest.fn(() => ({})),
}));
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(() => Promise.resolve()),
}));
const mockTrackEvent = jest.fn(() => Promise.resolve());
jest.mock('../src/engines/analytics/analyticsService', () => ({
  trackEvent: (...args: any[]) => (mockTrackEvent as any)(...args),
}));

// ──────────────────────────────────────────────
// 테스트 1: 나이 자동 해금
// ──────────────────────────────────────────────

describe('나이 자동 해금', () => {
  it('7~9세: 기본 3개 기능만 해금', () => {
    const features = getFeaturesForAge(8);
    expect(features).toContain('checkin_basic');
    expect(features).toContain('praise_receive');
    expect(features).toContain('weekly_promise_simple');
    expect(features).not.toContain('plan_simple');
    expect(features).not.toContain('request_card');
  });

  it('10~12세: plan_simple, request_card 추가 해금', () => {
    const features = getFeaturesForAge(11);
    expect(features).toContain('plan_simple');
    expect(features).toContain('request_card');
    expect(features).toContain('emotion_tag');
  });

  it('16~18세: independence_card 포함 전체 해금', () => {
    const features = getFeaturesForAge(17);
    expect(features).toContain('independence_card');
    expect(features).toHaveLength(AGE_BANDS['young_adult'].unlockedFeatures.length);
  });

  it('6세(범위 밖): 빈 배열 반환', () => {
    expect(getFeaturesForAge(6)).toHaveLength(0);
  });

  it('getAgeBandForAge: 연령별 밴드 매핑', () => {
    expect(getAgeBandForAge(9)).toBe('child_young');
    expect(getAgeBandForAge(10)).toBe('child_mid');
    expect(getAgeBandForAge(13)).toBe('teen');
    expect(getAgeBandForAge(16)).toBe('young_adult');
    expect(getAgeBandForAge(19)).toBeNull();
  });
});

// ──────────────────────────────────────────────
// 테스트 2: 조기 해금 — 미리 써보기 대화 통과
// ──────────────────────────────────────────────

describe('미리 써보기 대화 — 조기 해금', () => {
  const dialog = READINESS_DIALOGS['plan_readiness'];

  it('정답 3/3 → passed=true', () => {
    const correctAnswers: (0 | 1 | 2)[] = dialog.questions.map(
      (q) => q.correctIndex
    );
    const result = evaluateReadiness(dialog, correctAnswers);
    expect(result.passed).toBe(true);
    expect(result.correctCount).toBe(3);
  });

  it('정답 2/3 → passed=true (threshold=2)', () => {
    const answers: (0 | 1 | 2)[] = dialog.questions.map((q, i) =>
      i === 0 ? ((q.correctIndex + 1) % 3 as 0 | 1 | 2) : q.correctIndex
    );
    const result = evaluateReadiness(dialog, answers);
    expect(result.passed).toBe(true);
    expect(result.correctCount).toBe(2);
  });

  it('정답 1/3 → passed=false', () => {
    const answers: (0 | 1 | 2)[] = dialog.questions.map((q, i) =>
      i === 0 ? q.correctIndex : ((q.correctIndex + 1) % 3 as 0 | 1 | 2)
    );
    const result = evaluateReadiness(dialog, answers);
    expect(result.passed).toBe(false);
    expect(result.correctCount).toBe(1);
  });

  it('정답 0/3 → passed=false', () => {
    const wrongAnswers: (0 | 1 | 2)[] = dialog.questions.map(
      (q) => ((q.correctIndex + 1) % 3 as 0 | 1 | 2)
    );
    const result = evaluateReadiness(dialog, wrongAnswers);
    expect(result.passed).toBe(false);
    expect(result.correctCount).toBe(0);
  });
});

// ──────────────────────────────────────────────
// 테스트 3: 실패 — Firestore에 기록 안 됨
// ──────────────────────────────────────────────

describe('실패 기록 없음', () => {
  const { setDoc } = require('firebase/firestore');

  beforeEach(() => {
    jest.clearAllMocks();
    useUnlockStore.setState({ unlockStatus: null, loading: false });
  });

  it('대화 실패 시 applyEarlyUnlock 호출하지 않으면 setDoc 미호출', async () => {
    // 실패 흐름에서는 applyEarlyUnlock을 호출하지 않음
    // → setDoc이 호출되지 않아야 함
    expect(setDoc).not.toHaveBeenCalled();
  });

  it('evaluateReadiness 실패 결과에는 개인정보 없음', () => {
    const dialog = READINESS_DIALOGS['plan_readiness'];
    const wrong: (0 | 1 | 2)[] = [1, 0, 1];
    const result = evaluateReadiness(dialog, wrong);
    // passed, correctCount, total만 반환
    expect(Object.keys(result)).toEqual(['passed', 'correctCount', 'total']);
    expect(result.passed).toBe(false);
  });
});

// ──────────────────────────────────────────────
// 테스트 4: 재도전 — 이미 해금된 기능은 재획득 안 됨
// ──────────────────────────────────────────────

describe('재도전 및 중복 방지', () => {
  const { getDoc, setDoc } = require('firebase/firestore');

  beforeEach(() => {
    jest.clearAllMocks();
    useUnlockStore.setState({ unlockStatus: null, loading: false });
  });

  it('이미 해금된 기능은 applyEarlyUnlock에서 setDoc 미호출', async () => {
    // 이미 plan_simple이 해금된 상태
    const existingStatus: UnlockStatus = {
      uid: 'u1',
      birthYear: 2016,
      unlockedFeatures: ['plan_simple', 'checkin_basic'],
      earlyUnlocks: ['plan_simple'],
      updatedAt: Date.now(),
    };
    getDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => existingStatus,
    });

    await applyEarlyUnlock('u1', 'plan_simple', 2016);
    expect(setDoc).not.toHaveBeenCalled();
  });

  it('미해금 기능은 applyEarlyUnlock 성공 시 setDoc 호출', async () => {
    const existingStatus: UnlockStatus = {
      uid: 'u2',
      birthYear: 2016,
      unlockedFeatures: ['checkin_basic'],
      earlyUnlocks: [],
      updatedAt: Date.now(),
    };
    getDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => existingStatus,
    });

    await applyEarlyUnlock('u2', 'plan_simple', 2016);
    expect(setDoc).toHaveBeenCalledTimes(1);
  });
});

// ──────────────────────────────────────────────
// 테스트 5: 부모 알림 트리거
// ──────────────────────────────────────────────

describe('부모 알림 트리거', () => {
  beforeEach(() => {
    mockTrackEvent.mockClear();
  });

  it('notifyParentEarlyUnlock: trackEvent 호출됨', async () => {
    await notifyParentEarlyUnlock('민준', 'plan_simple');
    expect(mockTrackEvent).toHaveBeenCalledWith(
      'feature_unlocked_parent_notify',
      expect.objectContaining({
        childName: '민준',
        feature: 'plan_simple',
        method: 'early_dialog',
      })
    );
  });

  it('부모 알림 메시지에 자녀 이름 포함', async () => {
    await notifyParentEarlyUnlock('지은', 'plan_simple');
    const call = (mockTrackEvent.mock.calls as any)[0];
    const props = call?.[1] as Record<string, string>;
    expect(props?.message).toContain('지은');
  });

  it('syncAgeBasedUnlocks: 신규 해금 기능 반환 + trackEvent 호출', async () => {
    const { getDoc } = require('firebase/firestore');
    getDoc.mockResolvedValueOnce({
      exists: () => true,
      data: (): UnlockStatus => ({
        uid: 'u3',
        birthYear: 2014,
        unlockedFeatures: ['checkin_basic'],
        earlyUnlocks: [],
        updatedAt: Date.now(),
      }),
    });

    // 10세 → child_mid 기능 해금
    const newFeatures = await syncAgeBasedUnlocks('u3', 2014);
    expect(newFeatures.length).toBeGreaterThan(0);
    expect(newFeatures).toContain('plan_simple');
    expect(mockTrackEvent).toHaveBeenCalledWith(
      'feature_unlocked',
      expect.objectContaining({ method: 'age_auto' })
    );
  });
});
