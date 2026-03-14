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
