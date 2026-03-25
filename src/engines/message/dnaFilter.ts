// ──────────────────────────────────────────────
// dnaFilter.ts — CLAUDE.md 3절 DNA 원칙 수호자
// AI 출력 및 앱 내 모든 문자열의 DNA 위반 검사
// ──────────────────────────────────────────────

export type DnaViolationType =
  | 'forbidden_word'        // 금지어 (송금, 이체, 통제 등)
  | 'judgment'              // 판단형 표현 ("과소비", "잘못됐어요")
  | 'nagging'               // 잔소리형 ("줄이세요", "해야만 해요")
  | 'scoring'               // 점수화/등급화 ("80점", "C등급")
  | 'ranking'               // 순위화 ("상위 N%", "최우수")
  | 'personality_diagnosis'; // 성향 진단형 ("충동형이야", "너는 ~형")

export interface DnaViolation {
  type: DnaViolationType;
  matched: string;
}

export interface DnaFilterResult {
  passed: boolean;
  violations: DnaViolation[];
}

// ── 금지어 목록 (CLAUDE.md 3절) ──────────────
const FORBIDDEN_WORDS: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /송금/, label: '송금' },
  { pattern: /이체/, label: '이체' },
  { pattern: /충전/, label: '충전' },
  { pattern: /예치/, label: '예치' },
  { pattern: /지갑/, label: '지갑' },
  { pattern: /머니/, label: '머니' },
  { pattern: /자산관리/, label: '자산관리' },
  { pattern: /금융관리/, label: '금융관리' },
  { pattern: /통제/, label: '통제' },
  { pattern: /감시/, label: '감시' },
  { pattern: /소비 성적/, label: '소비 성적' },
  { pattern: /문제 소비자/, label: '문제 소비자' },
  { pattern: /실시간 추적/, label: '실시간 추적' },
  { pattern: /조기 해금 시험/, label: '조기 해금 시험' },
  { pattern: /최우수 가족/, label: '최우수 가족' },
  // 17절 오케스트라 DNA 체크리스트 (영문)
  { pattern: /\beligible/i, label: 'eligible' },
  { pattern: /\bapprove/i, label: 'approve' },
  { pattern: /\breject/i, label: 'reject' },
];

// ── 판단형 표현 ───────────────────────────────
const JUDGMENT_PATTERNS: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /과소비/, label: '과소비' },
  { pattern: /문제가 있/, label: '문제가 있' },
  { pattern: /잘못됐/, label: '잘못됐' },
  { pattern: /나쁜 소비/, label: '나쁜 소비' },
  { pattern: /낭비/, label: '낭비' },
  { pattern: /AI가 교정/, label: 'AI가 교정' },
  { pattern: /AI가 판단/, label: 'AI가 판단' },
];

// ── 잔소리형 표현 ─────────────────────────────
const NAGGING_PATTERNS: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /줄이세요/, label: '줄이세요' },
  { pattern: /하지 마세요/, label: '하지 마세요' },
  { pattern: /야만 해/, label: '해야만 해' },
  { pattern: /반드시 해야/, label: '반드시 해야' },
  { pattern: /절대 하면 안/, label: '절대 하면 안' },
  { pattern: /그러면 안 돼/, label: '그러면 안 돼' },
];

// ── 점수화/등급화 ─────────────────────────────
const SCORING_PATTERNS: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /\d+점/, label: 'N점' },
  { pattern: /[A-F]등급/, label: 'A-F등급' },
  { pattern: /소비 점수/, label: '소비 점수' },
  { pattern: /훈계/, label: '훈계' },
  { pattern: /낙인/, label: '낙인' },
];

// ── 순위화/비교 ───────────────────────────────
const RANKING_PATTERNS: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /상위 \d+%/, label: '상위 N%' },
  { pattern: /등수/, label: '등수' },
  { pattern: /순위/, label: '순위' },
  { pattern: /랭킹/, label: '랭킹' },
  { pattern: /리더보드/, label: '리더보드' },
  { pattern: /최우수/, label: '최우수' },
];

// ── 성향 진단형 (CLAUDE.md 3절 17번) ──────────
const PERSONALITY_PATTERNS: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /너는 .{1,10}형 아이야/, label: '성향 진단형' },
  { pattern: /충동형/, label: '충동형' },
  { pattern: /계획형이야/, label: '계획형이야' },
  { pattern: /너는 .{1,10}형이야/, label: '성향 라벨링' },
];

// ── 공개 API ──────────────────────────────────

/**
 * 텍스트의 DNA 위반 여부를 검사한다.
 * 위반 없으면 passed: true, 위반 있으면 violations 배열에 상세 내용.
 */
export function filterDna(text: string): DnaFilterResult {
  const violations: DnaViolation[] = [];

  for (const { pattern, label } of FORBIDDEN_WORDS) {
    if (pattern.test(text)) {
      violations.push({ type: 'forbidden_word', matched: label });
    }
  }
  for (const { pattern, label } of JUDGMENT_PATTERNS) {
    if (pattern.test(text)) {
      violations.push({ type: 'judgment', matched: label });
    }
  }
  for (const { pattern, label } of NAGGING_PATTERNS) {
    if (pattern.test(text)) {
      violations.push({ type: 'nagging', matched: label });
    }
  }
  for (const { pattern, label } of SCORING_PATTERNS) {
    if (pattern.test(text)) {
      violations.push({ type: 'scoring', matched: label });
    }
  }
  for (const { pattern, label } of RANKING_PATTERNS) {
    if (pattern.test(text)) {
      violations.push({ type: 'ranking', matched: label });
    }
  }
  for (const { pattern, label } of PERSONALITY_PATTERNS) {
    if (pattern.test(text)) {
      violations.push({ type: 'personality_diagnosis', matched: label });
    }
  }

  return { passed: violations.length === 0, violations };
}

/**
 * DNA 위반 시 throw (서비스 레이어에서 응답 무효 처리용).
 * CLAUDE.md 3절: "절대 금지 (위반 시 응답 무효)" 패턴.
 */
export function assertDnaClean(text: string): void {
  const result = filterDna(text);
  if (!result.passed) {
    const summary = result.violations.map((v) => v.matched).join(', ');
    throw new Error(`DNA 위반 (응답 무효): ${summary}`);
  }
}
