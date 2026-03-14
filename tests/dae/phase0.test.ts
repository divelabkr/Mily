// DAE Phase 0 테스트
// 기존 130개 테스트는 건드리지 않음

// ──────────────────────────────────────────────
// Firebase mock (스킬 import 시 필요)
// ──────────────────────────────────────────────
jest.mock('../../src/lib/firebase', () => ({
  getFirebaseDb: jest.fn(() => ({})),
}));
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  addDoc: jest.fn(),
  getDocs: jest.fn(),
  query: jest.fn(),
  orderBy: jest.fn(),
  serverTimestamp: jest.fn(() => ({ seconds: Math.floor(Date.now() / 1000) })),
  doc: jest.fn(),
  updateDoc: jest.fn(),
}));

// 서비스 mock
jest.mock('../../src/engines/requestCard/requestCardService', () => ({
  sendRequestCard: jest.fn().mockResolvedValue({
    id: 'card_001',
    familyId: 'fam_1',
    fromUid: 'child_1',
    toUid: 'parent_1',
    originalText: '용돈 주세요',
    bufferedText: '추가 예산이 필요해요.',
    requestType: 'extra_budget',
    status: 'pending',
    createdAt: Date.now(),
  }),
  sendRequestCardViaDAE: jest.fn(),
}));

jest.mock('../../src/engines/checkin/checkinStore', () => ({
  getWeeklySpendBreakdown: jest.fn().mockReturnValue({
    fixed: 50000,
    living: 30000,
    choice: 20000,
  }),
}));

jest.mock('../../src/engines/praiseCard/praiseCardService', () => ({
  sendPraiseCard: jest.fn().mockResolvedValue({
    cardId: 'praise_001',
    familyId: 'fam_1',
    fromUid: 'parent_1',
    toUid: 'child_1',
    type: 'well_saved',
    createdAt: Date.now(),
  }),
}));

jest.mock('../../src/engines/notification/notificationService', () => ({
  notifyRequestCardReceived: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../src/engines/ai/aiToneService', () => ({
  bufferRequestText: jest.fn().mockResolvedValue({ bufferedText: '완충된 텍스트' }),
}));

import { withGateChain } from '../../src/dae/withGateChain';
import { MOCK_GATES } from '../../src/dae/mockGates';
import { SkillDefinition } from '../../src/dae/types';
import { sendCardSkill } from '../../src/dae/skills/mily.request.send-card';
import { weeklySummarySkill } from '../../src/dae/skills/mily.checkin.weekly-summary';
import { sendPraiseSkill } from '../../src/dae/skills/mily.praise.send-card';

// ──────────────────────────────────────────────
// 테스트용 최소 스킬 정의 (Firebase 없이 동작)
// ──────────────────────────────────────────────
const makeMinimalSkill = (overrides: Partial<SkillDefinition> = {}): SkillDefinition => ({
  id: 'test.skill',
  version: '1.0.0',
  product: 'mily',
  allowedRoles: ['adult'],
  timeoutMs: 5_000,
  requiredFields: [],
  successMetric: {
    type: 'test_metric',
    threshold: 0.9,
    async evaluate(_input, _output) { return 1.0; },
  },
  async execute(_input, _ctx) { return { ok: true }; },
  ...overrides,
});

// ──────────────────────────────────────────────
// 1. withGateChain — 정상 실행 시 success: true 반환
// ──────────────────────────────────────────────
describe('withGateChain — 핵심 동작', () => {
  it('정상 실행 시 success: true 반환', async () => {
    const skill = makeMinimalSkill();
    const execute = withGateChain(MOCK_GATES, skill);
    const result = await execute({}, { id: 'user_1', role: 'adult' }, 'test_task');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.output).toEqual({ ok: true });
      expect(result.executionId).toMatch(/^exec_/);
    }
  });

  // ──────────────────────────────────────────────
  // 2. G03 DNA 위반 입력 시 success: false, gateId: "G03"
  // ──────────────────────────────────────────────
  it('G03 DNA 위반 입력 시 success: false, gateId: G03', async () => {
    const skill = makeMinimalSkill();
    const execute = withGateChain(MOCK_GATES, skill);
    const result = await execute(
      { action: 'execute_payment' },
      { id: 'user_1', role: 'adult' },
      'test_task'
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.gateId).toBe('G03');
      expect(result.reason).toBe('MILY_DNA_VIOLATION');
    }
  });

  // ──────────────────────────────────────────────
  // 3. 타임아웃 초과 시 success: false 반환
  // ──────────────────────────────────────────────
  it('타임아웃 초과 시 success: false 반환', async () => {
    const slowSkill = makeMinimalSkill({
      timeoutMs: 10,
      async execute(_input, _ctx) {
        await new Promise((res) => setTimeout(res, 500));
        return { ok: true };
      },
    });
    const execute = withGateChain(MOCK_GATES, slowSkill);
    const result = await execute({}, { id: 'user_1', role: 'adult' }, 'test_task');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.reason).toBe('SKILL_TIMEOUT');
    }
  }, 10_000);

  // ──────────────────────────────────────────────
  // 4. successMetric 없는 스킬 등록 시 에러 throw
  // ──────────────────────────────────────────────
  it('successMetric 없는 스킬 등록 시 에러 throw', () => {
    const badSkill = makeMinimalSkill({
      successMetric: undefined as any,
    });

    expect(() => withGateChain(MOCK_GATES, badSkill)).toThrow(
      "[DAE] Skill 'test.skill' must define successMetric."
    );
  });
});

// ──────────────────────────────────────────────
// 5. sendCardSkill — child role로 실행 시 pass
// ──────────────────────────────────────────────
describe('sendCardSkill', () => {
  it('child role로 실행 시 success: true', async () => {
    const result = await sendCardSkill(
      {
        familyId: 'fam_1',
        fromUid: 'child_1',
        toUid: 'parent_1',
        originalText: '용돈 주세요',
        requestType: 'extra_budget',
      },
      { id: 'child_1', role: 'child' },
      'request_card_send'
    );
    expect(result.success).toBe(true);
  });

  // ──────────────────────────────────────────────
  // 6. DAE Audit 로그 콘솔 출력 확인
  // ──────────────────────────────────────────────
  it('실행 시 [DAE Audit] 로그 출력', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    await sendCardSkill(
      {
        familyId: 'fam_1',
        fromUid: 'child_1',
        toUid: 'parent_1',
        originalText: '용돈 주세요',
        requestType: 'extra_budget',
      },
      { id: 'child_1', role: 'child' },
      'request_card_send'
    );

    const logs = consoleSpy.mock.calls.map((c) => c[0]).join(' ');
    expect(logs).toMatch(/\[DAE Audit\]/);
    expect(logs).toMatch(/mily\.request\.send_card/);
    consoleSpy.mockRestore();
  });
});

// ──────────────────────────────────────────────
// 7. weeklySummarySkill — 정상 실행 시 fixed/living/choice 포함
// ──────────────────────────────────────────────
describe('weeklySummarySkill', () => {
  it('정상 실행 시 fixed/living/choice 포함 출력', async () => {
    const result = await weeklySummarySkill(
      { checkIns: [] },
      { id: 'user_1', role: 'adult' },
      'weekly_summary'
    );

    expect(result.success).toBe(true);
    if (result.success) {
      const output = result.output as any;
      expect(output).toHaveProperty('fixed');
      expect(output).toHaveProperty('living');
      expect(output).toHaveProperty('choice');
    }
  });
});

// ──────────────────────────────────────────────
// 8. sendPraiseSkill — adult role로 실행 시 pass
// ──────────────────────────────────────────────
describe('sendPraiseSkill', () => {
  it('adult role로 실행 시 success: true', async () => {
    const result = await sendPraiseSkill(
      {
        familyId: 'fam_1',
        fromUid: 'parent_1',
        toUid: 'child_1',
        type: 'well_saved',
      },
      { id: 'parent_1', role: 'adult' },
      'praise_card_send'
    );
    expect(result.success).toBe(true);
  });
});
