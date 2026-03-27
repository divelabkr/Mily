// ──────────────────────────────────────────────
// requestCard.integration.test.ts — 요청 카드 + 합의 루프 통합 테스트
// ──────────────────────────────────────────────

jest.mock('../../../src/lib/firebase', () => ({ getFirebaseDb: jest.fn(() => ({})) }));

const mockDb: Record<string, any> = {};

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(() => ({ _col: 'mock' })),
  doc: jest.fn((db: any, col: string, id?: string) => {
    const key = id ? `${col}/${id}` : `${col}/new_id`;
    return { _key: key, id: id ?? 'new_id' };
  }),
  setDoc: jest.fn(async (ref: any, data: any) => { mockDb[ref._key] = data; }),
  getDoc: jest.fn(async (ref: any) => ({
    exists: () => !!mockDb[ref._key],
    data: () => mockDb[ref._key] ?? null,
  })),
  updateDoc: jest.fn(async (ref: any, updates: any) => {
    if (mockDb[ref._key]) Object.assign(mockDb[ref._key], updates);
  }),
  getDocs: jest.fn(() => Promise.resolve({ empty: true, docs: [] })),
  query: jest.fn((ref: any) => ref),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  Timestamp: { now: () => ({ toMillis: () => Date.now() }) },
}));

jest.mock('../../../src/engines/message/dnaFilter', () => ({
  filterDna: jest.fn(() => ({ passed: true, violations: [] })),
  assertDnaClean: jest.fn(),
}));
jest.mock('../../../src/engines/ai/aiToneService', () => ({
  bufferRequestText: jest.fn(() => Promise.resolve({ bufferedText: 'AI 완충 텍스트' })),
}));
jest.mock('../../../src/engines/notification/notificationService', () => ({
  notifyRequestCardReceived: jest.fn(() => Promise.resolve()),
}));

import {
  canTransition,
  STAGE_LABELS,
  AgreementStage,
  createAgreementLoop,
  transitionStage,
  addReflection,
} from '../../../src/engines/agreement/agreementLoopService';

// ── 상태 머신 전이 규칙 테스트 ──────────────────

describe('RequestCard Integration: AgreementLoop 상태 머신', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(mockDb).forEach((k) => delete mockDb[k]);
  });

  test('1. request → declined 전이 가능', () => {
    expect(canTransition('request', 'declined')).toBe(true);
  });

  test('2. request → completed 전이 가능 (즉시 승인)', () => {
    expect(canTransition('request', 'completed')).toBe(true);
  });

  test('3. declined → counter 전이 가능', () => {
    expect(canTransition('declined', 'counter')).toBe(true);
  });

  test('4. counter → conditional 전이 가능', () => {
    expect(canTransition('counter', 'conditional')).toBe(true);
  });

  test('5. completed → reflect 전이 가능', () => {
    expect(canTransition('completed', 'reflect')).toBe(true);
  });

  test('6. reflect → 어떤 상태로도 전이 불가', () => {
    const stages: AgreementStage[] = ['request', 'declined', 'counter', 'conditional', 'completed', 'reflect'];
    for (const s of stages) {
      expect(canTransition('reflect', s)).toBe(false);
    }
  });

  test('7. request → counter 직접 전이 불가 (declined 거쳐야)', () => {
    expect(canTransition('request', 'counter')).toBe(false);
  });

  test('8. STAGE_LABELS 6개 모두 정의됨', () => {
    const stages: AgreementStage[] = ['request', 'declined', 'counter', 'conditional', 'completed', 'reflect'];
    for (const s of stages) {
      expect(STAGE_LABELS[s]).toBeDefined();
      expect(STAGE_LABELS[s].length).toBeGreaterThan(0);
    }
  });

  test('9. createAgreementLoop → stage가 request로 시작', async () => {
    const loop = await createAgreementLoop({
      familyId: 'fam1',
      childUid: 'child1',
      parentUid: 'parent1',
      requestCardId: 'rc1',
    });
    expect(loop.stage).toBe('request');
    expect(loop.id).toBeDefined();
  });

  test('10. transitionStage → 유효한 전이 성공 (request → declined)', async () => {
    const loopData = {
      id: 'loop1',
      familyId: 'fam1',
      childUid: 'child1',
      parentUid: 'parent1',
      requestCardId: 'rc1',
      stage: 'request' as AgreementStage,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    mockDb['agreement_loops/loop1'] = loopData;

    const updated = await transitionStage('loop1', 'declined');
    expect(updated.stage).toBe('declined');
  });

  test('11. transitionStage → 잘못된 전이 시 throw', async () => {
    const loopData = {
      id: 'loop2',
      familyId: 'fam1',
      childUid: 'child1',
      parentUid: 'parent1',
      requestCardId: 'rc2',
      stage: 'reflect' as AgreementStage,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    mockDb['agreement_loops/loop2'] = loopData;

    await expect(transitionStage('loop2', 'request')).rejects.toThrow();
  });

  test('12. transitionStage → completed 시 completedAt 기록', async () => {
    const loopData = {
      id: 'loop3',
      familyId: 'fam1',
      childUid: 'child1',
      parentUid: 'parent1',
      requestCardId: 'rc3',
      stage: 'request' as AgreementStage,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    mockDb['agreement_loops/loop3'] = loopData;

    const updated = await transitionStage('loop3', 'completed');
    expect(updated.completedAt).toBeDefined();
    expect(updated.completedAt).toBeGreaterThan(0);
  });

  test('13. addReflection → DNA 필터 통과 시 정상 저장', async () => {
    const loopData = {
      id: 'loop4',
      familyId: 'fam1',
      childUid: 'child1',
      parentUid: 'parent1',
      requestCardId: 'rc4',
      stage: 'completed' as AgreementStage,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    mockDb['agreement_loops/loop4'] = loopData;

    await expect(
      addReflection('loop4', { childNote: '잘 합의했어요', recordedAt: Date.now() })
    ).resolves.not.toThrow();
  });

  test('14. addReflection → DNA 위반 시 throw', async () => {
    const { filterDna } = require('../../../src/engines/message/dnaFilter');
    filterDna.mockReturnValueOnce({ passed: false, violations: [{ matched: '통제' }] });

    const loopData = {
      id: 'loop5',
      stage: 'completed' as AgreementStage,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    mockDb['agreement_loops/loop5'] = loopData;

    await expect(
      addReflection('loop5', { childNote: '통제받았어요', recordedAt: Date.now() })
    ).rejects.toThrow(/DNA 위반/);
  });

  test('15. 존재하지 않는 loopId → transitionStage throw', async () => {
    await expect(transitionStage('nonexistent_loop', 'declined')).rejects.toThrow();
  });
});
