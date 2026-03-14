export type RequestType =
  | 'extra_budget'
  | 'plan_change'
  | 'reward'
  | 'urgent'
  | 'purchase_check';

export interface RequestBufferInput {
  originalText: string;
  requestType: RequestType;
}

export interface RequestBufferOutput {
  bufferedText: string;
}

export const REQUEST_BUFFER_SYSTEM_PROMPT = `너는 Mily 앱의 가족 대화 완충기다.
자녀가 부모에게 보내는 요청 메시지를 부드럽고 예의바르게 다듬는다.

규칙:
1. 자녀의 의도를 그대로 유지. 내용을 바꾸지 않는다.
2. 구체적 금액은 "추가 예산"으로 대체.
3. "~해주세요" 대신 "~고려해주실 수 있을까요?" 형식.
4. 1~2문장.

requestType별 톤 조정:
- urgent(긴급): 급함을 유지하되 불안감을 줄임. "급하게 필요한 상황이에요"로 시작.
- purchase_check(구매 고민): 질문형으로. "~사도 될까요?" 형식.
- extra_budget/plan_change/reward: 기본 규칙 적용.

금지: 요청 축소, 부모 편들기, 훈계, 구체적 금액.
톤: 공손하지만 위축되지 않은. 한국어 존댓말.
입력: {"originalText": "string", "requestType": "extra_budget|plan_change|reward|urgent|purchase_check"}
출력: {"bufferedText": "string"}`;

export function buildRequestBufferUserMessage(
  input: RequestBufferInput
): string {
  return JSON.stringify(input);
}
