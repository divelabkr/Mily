// DAE 래핑 버전 (신규 화면에서 이걸 쓰면 됨)
// requestCardService와 순환 참조를 막기 위해 별도 파일로 분리

import { sendCardSkill } from '../../dae/skills/mily.request.send-card';
import { RequestCard, RequestType } from './requestCardStore';

export async function sendRequestCardViaDAE(
  input: {
    familyId: string;
    fromUid: string;
    toUid: string;
    originalText: string;
    requestType: RequestType;
    senderName?: string;
  },
  callerId: string
): Promise<RequestCard> {
  const result = await sendCardSkill(
    input,
    { id: callerId, role: 'child' },
    'request_card_send'
  );

  if (!result.success) {
    console.warn(`[DAE] sendRequestCard blocked at ${result.gateId}: ${result.reason}`);
    throw new Error(result.reason);
  }

  return result.output as RequestCard;
}
