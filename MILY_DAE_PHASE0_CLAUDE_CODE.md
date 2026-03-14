# MILY × DAE Phase 0 — Claude Code 작업 지시서
> 목표: Mily 핵심 스킬 3개에 withGateChain 껍데기 장착
> 조건: 기존 코드 동작 변경 없음. 구조만 잡는다. 테스트 130/130 유지.

---

## 작업 전 필수 확인

1. 현재 프로젝트 구조 파악
2. requestCardService.ts, checkinStore.ts 위치 확인
3. 기존 테스트 130개 전부 통과 상태 확인 후 시작

---

## 핵심 원칙 (절대 위반 금지)

- 기존 함수 시그니처 변경 금지
- 기존 비즈니스 로직 변경 금지
- 테스트 130/130 유지 필수
- Gate는 현재 전부 MOCK (pass만 반환) — 실제 로직 구현 안 함
- Mily DNA 금지어: 금융실행/감시/데이터판매 관련 표현 금지

---

## STEP 1: DAE 코어 파일 생성

### 생성 위치: `src/dae/`

---

### 파일 1: `src/dae/types.ts`

```typescript
// Dive Autonomy Engine — 핵심 타입 정의
// Mily × DAE Phase 0

export type GateStatus = "pass" | "fail" | "defer";

export interface GateResult {
  status: GateStatus;
  reason?: string;
  evidence?: Record<string, unknown>;
  retryAfter?: number;
}

export interface Gate {
  gateId: string;
  layer: "L0" | "L1" | "L2";
  evaluate(ctx: SkillContext): Promise<GateResult>;
  audit(ctx: SkillContext, result: GateResult): Promise<void>;
}

export interface Caller {
  id: string;
  role: "child" | "adult" | "system";
}

export interface ExecutionMetrics {
  durationMs: number;
  outputSize: number;
  qualityScore?: number;
}

export interface SkillContext {
  executionId: string;
  skillId: string;
  skillVersion: string;
  input: unknown;
  caller: Caller;
  taskType: string;
  output?: unknown;
  metrics?: ExecutionMetrics;
  gateResults: Record<string, GateResult>;
  finalStatus?: GateStatus;
  startTs: number;
}

export interface SkillDefinition {
  id: string;                        // "mily.request.send_card" 형식
  version: string;                   // semver
  product: "mily";
  allowedRoles: Caller["role"][];
  timeoutMs: number;
  requiredFields: string[];
  successMetric: {
    type: string;
    threshold: number;
    evaluate(input: unknown, output: unknown): Promise<number>;
  };
  execute(input: unknown, ctx: SkillContext): Promise<unknown>;
}

export type SkillResult =
  | { success: true; output: unknown; metrics: ExecutionMetrics; executionId: string }
  | { success: false; gateId: string; status: "fail" | "defer"; reason: string; executionId: string };
```

---

### 파일 2: `src/dae/mockGates.ts`

```typescript
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
```

---

### 파일 3: `src/dae/withGateChain.ts`

```typescript
// Dive Autonomy Engine — 핵심 래퍼
// withGateChain(gates, skill) → execute(input, caller, taskType)

import { Gate, SkillDefinition, SkillResult, SkillContext, ExecutionMetrics } from "./types";

function generateId(): string {
  return `exec_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function withGateChain(
  gates: Gate[],
  skill: SkillDefinition
) {
  // 등록 시 successMetric 필수 검증
  if (!skill.successMetric) {
    throw new Error(`[DAE] Skill '${skill.id}' must define successMetric.`);
  }

  return async function execute(
    input: unknown,
    caller: { id: string; role: "child" | "adult" | "system" },
    taskType: string
  ): Promise<SkillResult> {
    const executionId = generateId();
    const ctx: SkillContext = {
      executionId,
      skillId: skill.id,
      skillVersion: skill.version,
      input,
      caller,
      taskType,
      gateResults: {},
      startTs: Date.now(),
    };

    // Gate 순차 실행
    for (const gate of gates) {
      let result;

      if (gate.gateId === "G04") {
        // G04: 실제 스킬 실행
        try {
          const output = await Promise.race([
            skill.execute(input, ctx),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error("SKILL_TIMEOUT")), skill.timeoutMs)
            ),
          ]);
          ctx.output = output;
          ctx.metrics = {
            durationMs: Date.now() - ctx.startTs,
            outputSize: JSON.stringify(output).length,
          };
          result = await gate.evaluate(ctx);
        } catch (err: any) {
          result = {
            status: "fail" as const,
            reason: err.message,
            evidence: { skillId: skill.id },
          };
        }
      } else {
        result = await gate.evaluate(ctx);
      }

      // 항상 audit (G06 제외)
      if (gate.gateId !== "G06") {
        await gate.audit(ctx, result).catch(() => {});
      }

      ctx.gateResults[gate.gateId] = result;

      if (result.status !== "pass") {
        ctx.finalStatus = result.status;

        // 실패해도 G06은 반드시 실행 (감사 기록)
        const auditGate = gates.find((g) => g.gateId === "G06");
        if (auditGate && gate.gateId !== "G06") {
          await auditGate.evaluate(ctx).catch(() => {});
        }

        return {
          success: false,
          gateId: gate.gateId,
          status: result.status,
          reason: result.reason ?? "Unknown",
          executionId,
        };
      }
    }

    ctx.finalStatus = "pass";
    return {
      success: true,
      output: ctx.output,
      metrics: ctx.metrics!,
      executionId,
    };
  };
}
```

---

### 파일 4: `src/dae/index.ts`

```typescript
// DAE 진입점 — 이것만 import하면 됨
export { withGateChain } from "./withGateChain";
export { MOCK_GATES } from "./mockGates";
export type { SkillDefinition, SkillResult, Caller, Gate } from "./types";
```

---

## STEP 2: Mily 스킬 정의 파일 생성

### 생성 위치: `src/dae/skills/`

---

### 파일 5: `src/dae/skills/mily.request.send-card.ts`

```typescript
// 요청카드 발송 스킬 정의
// urgent / purchase_check 모두 이 스킬로 처리

import { SkillDefinition, SkillContext } from "../types";
import { withGateChain } from "../withGateChain";
import { MOCK_GATES } from "../mockGates";

// 기존 requestCardService의 실제 로직을 여기서 호출
// 기존 코드는 건드리지 않는다
import { sendRequestCard } from "../../../services/requestCardService";

const SendCardSkillDef: SkillDefinition = {
  id: "mily.request.send_card",
  version: "1.0.0",
  product: "mily",
  allowedRoles: ["child"],
  timeoutMs: 10_000,
  requiredFields: ["type", "amount", "reason"],

  successMetric: {
    type: "delivery_rate",
    threshold: 0.95,
    async evaluate(_input, output: any) {
      // 발송 성공 여부
      return output?.delivered === true ? 1.0 : 0.0;
    },
  },

  async execute(input: any, _ctx: SkillContext) {
    // 기존 로직 그대로 위임
    const result = await sendRequestCard({
      type: input.type,
      amount: input.amount,
      reason: input.reason,
      isUrgent: input.isUrgent ?? false,
    });
    return { delivered: result.success, cardId: result.cardId };
  },
};

// 래핑된 실행 함수 export
export const sendCardSkill = withGateChain(MOCK_GATES, SendCardSkillDef);
```

---

### 파일 6: `src/dae/skills/mily.checkin.weekly-summary.ts`

```typescript
// 주간 소비 요약 스킬 정의

import { SkillDefinition, SkillContext } from "../types";
import { withGateChain } from "../withGateChain";
import { MOCK_GATES } from "../mockGates";
import { getWeeklySpendBreakdown } from "../../../stores/checkinStore";

const WeeklySummarySkillDef: SkillDefinition = {
  id: "mily.checkin.weekly_summary",
  version: "1.0.0",
  product: "mily",
  allowedRoles: ["child", "adult"],
  timeoutMs: 5_000,
  requiredFields: ["userId", "weekStart"],

  successMetric: {
    type: "data_completeness",
    threshold: 0.9,
    async evaluate(_input, output: any) {
      // 고정/생활/선택 세 항목이 모두 있으면 성공
      const has = (k: string) => output?.[k] !== undefined;
      return (has("fixed") && has("living") && has("choice")) ? 1.0 : 0.0;
    },
  },

  async execute(input: any, _ctx: SkillContext) {
    const breakdown = await getWeeklySpendBreakdown(input.userId, input.weekStart);
    return breakdown;
  },
};

export const weeklySummarySkill = withGateChain(MOCK_GATES, WeeklySummarySkillDef);
```

---

### 파일 7: `src/dae/skills/mily.praise.send-card.ts`

```typescript
// 칭찬카드 발송 스킬 정의

import { SkillDefinition, SkillContext } from "../types";
import { withGateChain } from "../withGateChain";
import { MOCK_GATES } from "../mockGates";

// 기존 칭찬카드 서비스 import (경로는 실제 프로젝트에 맞게 조정)
import { sendPraiseCard } from "../../../services/praiseCardService";

const SendPraiseSkillDef: SkillDefinition = {
  id: "mily.praise.send_card",
  version: "1.0.0",
  product: "mily",
  allowedRoles: ["adult"],
  timeoutMs: 8_000,
  requiredFields: ["targetChildId", "message"],

  successMetric: {
    type: "delivery_rate",
    threshold: 0.95,
    async evaluate(_input, output: any) {
      return output?.delivered === true ? 1.0 : 0.0;
    },
  },

  async execute(input: any, _ctx: SkillContext) {
    const result = await sendPraiseCard({
      targetChildId: input.targetChildId,
      message: input.message,
    });
    return { delivered: result.success, cardId: result.cardId };
  },
};

export const sendPraiseSkill = withGateChain(MOCK_GATES, SendPraiseSkillDef);
```

---

## STEP 3: 기존 서비스 연결 (최소 수정)

### requestCardService.ts 수정 지침

**기존 코드 건드리지 말고**, 기존 함수를 아래 방식으로 DAE 스킬 통해 호출하는
새 함수를 **추가**한다.

```typescript
// requestCardService.ts 하단에 추가
// 기존 함수는 절대 수정 안 함

import { sendCardSkill } from "../dae/skills/mily.request.send-card";

// DAE 래핑 버전 (신규 화면에서 이걸 쓰면 됨)
export async function sendRequestCardViaDAE(
  input: { type: string; amount: number; reason: string; isUrgent?: boolean },
  callerId: string
) {
  const result = await sendCardSkill(
    input,
    { id: callerId, role: "child" },
    "request_card_send"
  );

  if (!result.success) {
    console.warn(`[DAE] sendRequestCard blocked at ${result.gateId}: ${result.reason}`);
    throw new Error(result.reason);
  }

  return result.output;
}
```

---

## STEP 4: DAE 전용 테스트 추가

### 생성 위치: `tests/dae/`

### 파일: `tests/dae/phase0.test.ts`

다음 케이스를 테스트한다:

```
1. withGateChain — 정상 실행 시 success: true 반환
2. withGateChain — G03 DNA 위반 입력 시 success: false, gateId: "G03" 반환
3. withGateChain — 타임아웃 초과 시 success: false 반환
4. withGateChain — successMetric 없는 스킬 등록 시 에러 throw
5. sendCardSkill — child role로 실행 시 pass
6. sendCardSkill — 콘솔에 DAE Audit 로그 출력 확인
7. weeklySummarySkill — 정상 실행 시 fixed/living/choice 포함 출력
8. sendPraiseSkill — adult role로 실행 시 pass
```

**기존 130개 테스트는 건드리지 않는다.**
새 테스트를 추가해서 전체 통과 수를 138개 이상으로 만든다.

---

## STEP 5: 최종 확인

작업 완료 후 반드시 확인:

```bash
# 1. 전체 테스트 통과 확인 (기존 130 + 신규 8 이상)
npm test

# 2. TypeScript 컴파일 에러 없음 확인
npx tsc --noEmit

# 3. DAE Audit 로그 출력 확인
# 스킬 실행 시 콘솔에 아래 형식 출력되어야 함:
# [DAE Audit] mily.request.send_card v1.0.0 | caller: user_001(child) | task: request_card_send | status: pass | ts: ...
```

---

## 완료 후 보고 형식

```
DAE Phase 0 완료 보고

생성 파일:
- src/dae/types.ts
- src/dae/mockGates.ts
- src/dae/withGateChain.ts
- src/dae/index.ts
- src/dae/skills/mily.request.send-card.ts
- src/dae/skills/mily.checkin.weekly-summary.ts
- src/dae/skills/mily.praise.send-card.ts

수정 파일:
- services/requestCardService.ts (하단 추가만)

테스트 결과: 기존 130 + 신규 N = 합계 통과

DAE Audit 로그 샘플:
[DAE Audit] mily.request.send_card ...

다음 단계 (Phase 1):
- G03 DNA Compliance 실제 구현
- G06 WORM Audit Chain 구현
- 실유저 데이터 수집 시작
```

---

## 참고: 전체 DAE 구조 (Phase 0 범위 표시)

```
DAE 5단계 루프:

Observe   → Phase 0: G06 콘솔 로그 (시작)
Inspect   → Phase 2: 실유저 데이터 후
Amend     → Phase 2: 실유저 데이터 후
HumanGate → Phase 2: 실유저 데이터 후
Evaluate  → Phase 2: 실유저 데이터 후

지금은 구조만. 데이터는 유저가 만들어준다.
```

---

*Dive Lab 내부 전용 | Mily × DAE Phase 0 | 2026.03*
