"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bufferRequestCard = void 0;
const https_1 = require("firebase-functions/v2/https");
const params_1 = require("firebase-functions/params");
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
const anthropicApiKey = (0, params_1.defineSecret)('ANTHROPIC_API_KEY');
const AI_MODEL = 'claude-haiku-4-5-20251001';
const AI_TIMEOUT_MS = 10000;
const SYSTEM_PROMPT = `너는 Mily 앱의 가족 대화 완충기다.
자녀가 부모에게 보내는 요청 메시지를 부드럽고 예의바르게 다듬는다.

규칙:
1. 자녀의 의도를 그대로 유지. 내용을 바꾸지 않는다.
2. 구체적 금액은 "추가 예산"으로 대체.
3. "~해주세요" 대신 "~고려해주실 수 있을까요?" 형식.
4. 1~2문장.

requestType별 톤:
- urgent(긴급): 급함을 유지하되 불안감을 줄임. "급하게 필요한 상황이에요"로 시작.
- purchase_check(구매 고민): 질문형으로. "~사도 될까요?" 형식.
- extra_budget / plan_change / reward: 기본 규칙 적용.

금지: 요청 축소, 부모 편들기, 훈계, 구체적 금액.
톤: 공손하지만 위축되지 않은. 한국어 존댓말.
입력: {"originalText": "string", "requestType": "extra_budget|plan_change|reward|urgent|purchase_check"}
출력: {"bufferedText": "string"}`;
exports.bufferRequestCard = (0, https_1.onCall)({ secrets: [anthropicApiKey], timeoutSeconds: 30 }, async (request) => {
    const input = request.data;
    const client = new sdk_1.default({ apiKey: anthropicApiKey.value() });
    try {
        const response = await Promise.race([
            client.messages.create({
                model: AI_MODEL,
                max_tokens: 256,
                system: SYSTEM_PROMPT,
                messages: [{ role: 'user', content: JSON.stringify(input) }],
            }),
            new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), AI_TIMEOUT_MS)),
        ]);
        const text = response.content[0].type === 'text'
            ? response.content[0].text
            : '';
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch)
            throw new Error('JSON not found');
        const result = JSON.parse(jsonMatch[0]);
        if (!result.bufferedText)
            throw new Error('Invalid shape');
        return result;
    }
    catch (err) {
        console.error('[requestBuffer] AI 호출 실패, 원문 반환:', err);
        return { bufferedText: input.originalText };
    }
});
//# sourceMappingURL=requestBuffer.js.map