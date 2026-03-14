// Phase 0 — 전부 pass 반환하는 Mock Gate
// 나중에 실제 Gate로 교체만 하면 됨

import { Gate, SkillContext, GateResult } from "./types";

const PASS: GateResult = { status: "pass" };

export const MockG01: Gate = {
  gateId: "G01",
  layer: "L0",
  async evaluate(_ctx: SkillContext): Promise<GateResult> {
    // TODO Phase 1: 입력 스키마 검증 구현
    return PASS;
  },
  async audit(_ctx, _result) {
    // TODO Phase 1: audit 구현
  },
};

export const MockG02: Gate = {
  gateId: "G02",
  layer: "L0",
  async evaluate(_ctx: SkillContext): Promise<GateResult> {
    // TODO Phase 1: 권한 체크 구현
    return PASS;
  },
  async audit(_ctx, _result) {},
};

export const MockG03: Gate = {
  gateId: "G03",
  layer: "L0",
  async evaluate(ctx: SkillContext): Promise<GateResult> {
    // TODO Phase 1: Mily DNA 금지 패턴 실제 검사 구현
    // 금지: 금융실행/감시/데이터판매 관련 패턴
    const serialized = JSON.stringify(ctx.input);
    const FORBIDDEN = [/execute_payment/i, /surveillance/i, /sell_data/i];
    for (const pattern of FORBIDDEN) {
      if (pattern.test(serialized)) {
        return {
          status: "fail",
          reason: "MILY_DNA_VIOLATION",
          evidence: { pattern: pattern.toString() },
        };
      }
    }
    return PASS;
  },
  async audit(_ctx, _result) {},
};

export const MockG04: Gate = {
  gateId: "G04",
  layer: "L1",
  async evaluate(_ctx: SkillContext): Promise<GateResult> {
    // 실제 실행은 withGateChain이 처리
    // TODO Phase 1: 실행 메트릭 수집 구현
    return PASS;
  },
  async audit(_ctx, _result) {},
};

export const MockG05: Gate = {
  gateId: "G05",
  layer: "L1",
  async evaluate(_ctx: SkillContext): Promise<GateResult> {
    // TODO Phase 1: success_metric 평가 구현
    return PASS;
  },
  async audit(_ctx, _result) {},
};

export const MockG06: Gate = {
  gateId: "G06",
  layer: "L2",
  async evaluate(ctx: SkillContext): Promise<GateResult> {
    // Phase 0: 콘솔 로그만 (나중에 WORM Audit Chain으로 교체)
    console.log(`[DAE Audit] ${ctx.skillId} v${ctx.skillVersion} | ` +
      `caller: ${ctx.caller.id}(${ctx.caller.role}) | ` +
      `task: ${ctx.taskType} | ` +
      `status: ${ctx.finalStatus} | ` +
      `ts: ${new Date(ctx.startTs).toISOString()}`);
    // TODO Phase 1: WORM Audit Chain + SHA-256 Hash Chain 구현
    return PASS;
  },
  async audit(_ctx, _result) {},
};

export const MOCK_GATES = [MockG01, MockG02, MockG03, MockG04, MockG05, MockG06];
