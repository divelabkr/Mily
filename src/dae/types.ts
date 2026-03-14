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
