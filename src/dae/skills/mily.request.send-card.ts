// 요청카드 발송 스킬 정의
// urgent / purchase_check 모두 이 스킬로 처리

import { SkillDefinition, SkillContext } from "../types";
import { withGateChain } from "../withGateChain";
import { MOCK_GATES } from "../mockGates";

// 기존 requestCardService의 실제 로직을 여기서 호출
// 기존 코드는 건드리지 않는다
import { sendRequestCard } from "../../engines/requestCard/requestCardService";

const SendCardSkillDef: SkillDefinition = {
  id: "mily.request.send_card",
  version: "1.0.0",
  product: "mily",
  allowedRoles: ["child"],
  timeoutMs: 10_000,
  requiredFields: ["familyId", "fromUid", "toUid", "originalText", "requestType"],

  successMetric: {
    type: "delivery_rate",
    threshold: 0.95,
    async evaluate(_input, output: any) {
      // 카드 id가 있으면 발송 성공
      return output?.id ? 1.0 : 0.0;
    },
  },

  async execute(input: any, _ctx: SkillContext) {
    // 기존 로직 그대로 위임
    const card = await sendRequestCard(
      input.familyId,
      input.fromUid,
      input.toUid,
      input.originalText,
      input.requestType,
      input.senderName
    );
    return card;
  },
};

// 래핑된 실행 함수 export
export const sendCardSkill = withGateChain(MOCK_GATES, SendCardSkillDef);
