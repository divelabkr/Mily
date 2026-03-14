// 주간 소비 요약 스킬 정의

import { SkillDefinition, SkillContext } from "../types";
import { withGateChain } from "../withGateChain";
import { MOCK_GATES } from "../mockGates";
import { getWeeklySpendBreakdown, CheckIn } from "../../engines/checkin/checkinStore";

const WeeklySummarySkillDef: SkillDefinition = {
  id: "mily.checkin.weekly_summary",
  version: "1.0.0",
  product: "mily",
  allowedRoles: ["child", "adult"],
  timeoutMs: 5_000,
  requiredFields: ["checkIns"],

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
    const checkIns: CheckIn[] = input.checkIns ?? [];
    const breakdown = getWeeklySpendBreakdown(checkIns);
    return breakdown;
  },
};

export const weeklySummarySkill = withGateChain(MOCK_GATES, WeeklySummarySkillDef);
