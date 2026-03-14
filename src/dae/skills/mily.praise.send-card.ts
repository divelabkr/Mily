// 칭찬카드 발송 스킬 정의

import { SkillDefinition, SkillContext } from "../types";
import { withGateChain } from "../withGateChain";
import { MOCK_GATES } from "../mockGates";

// 기존 칭찬카드 서비스 import
import { sendPraiseCard } from "../../engines/praiseCard/praiseCardService";

const SendPraiseSkillDef: SkillDefinition = {
  id: "mily.praise.send_card",
  version: "1.0.0",
  product: "mily",
  allowedRoles: ["adult"],
  timeoutMs: 8_000,
  requiredFields: ["familyId", "fromUid", "toUid", "type"],

  successMetric: {
    type: "delivery_rate",
    threshold: 0.95,
    async evaluate(_input, output: any) {
      return output?.cardId ? 1.0 : 0.0;
    },
  },

  async execute(input: any, _ctx: SkillContext) {
    const card = await sendPraiseCard(
      input.familyId,
      input.fromUid,
      input.toUid,
      input.type
    );
    return card;
  },
};

export const sendPraiseSkill = withGateChain(MOCK_GATES, SendPraiseSkillDef);
