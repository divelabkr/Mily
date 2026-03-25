import { filterDna, assertDnaClean } from '../src/engines/message/dnaFilter';
import type { DnaFilterResult } from '../src/engines/message/dnaFilter';

describe('dnaFilter', () => {
  describe('filterDna — 정상 통과', () => {
    it('빈 문자열은 통과', () => {
      const result = filterDna('');
      expect(result.passed).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it('제안형 문장은 통과', () => {
      const result = filterDna('이번 주 취미 예산을 조금 조정해볼까요?');
      expect(result.passed).toBe(true);
    });

    it('기간 기반 서술은 통과', () => {
      const result = filterDna('이번 달은 식비를 잘 지켜냈어요!');
      expect(result.passed).toBe(true);
    });

    it('칭찬형 문장은 통과', () => {
      const result = filterDna('이번 주 계획을 꾸준히 지켰네요, 정말 잘했어요!');
      expect(result.passed).toBe(true);
    });
  });

  describe('filterDna — 금지어 탐지', () => {
    const forbiddenWords = [
      ['송금', '송금해드릴게요'],
      ['이체', '이체를 요청하세요'],
      ['충전', '머니를 충전하세요'],
      ['예치', '금액을 예치합니다'],
      ['지갑', '지갑을 확인하세요'],
      ['머니', '밀리머니로 결제'],
      ['자산관리', '자산관리를 시작하세요'],
      ['금융관리', '금융관리 앱입니다'],
      ['통제', '소비를 통제하세요'],
      ['감시', '자녀를 감시합니다'],
      ['소비 성적', '이번 달 소비 성적은'],
      ['문제 소비자', '당신은 문제 소비자입니다'],
      ['실시간 추적', '실시간 추적 중입니다'],
    ];

    test.each(forbiddenWords)('"%s" 감지', (label, text) => {
      const result = filterDna(text);
      expect(result.passed).toBe(false);
      expect(result.violations.some((v) => v.type === 'forbidden_word')).toBe(true);
      expect(result.violations.some((v) => v.matched === label)).toBe(true);
    });

    it('eligible 감지 (영문)', () => {
      const result = filterDna('You are eligible for this plan');
      expect(result.passed).toBe(false);
      expect(result.violations.some((v) => v.matched === 'eligible')).toBe(true);
    });

    it('approve 감지 (영문)', () => {
      const result = filterDna('Request approved automatically');
      expect(result.passed).toBe(false);
      expect(result.violations.some((v) => v.matched === 'approve')).toBe(true);
    });

    it('reject 감지 (영문)', () => {
      const result = filterDna('Your request was rejected');
      expect(result.passed).toBe(false);
      expect(result.violations.some((v) => v.matched === 'reject')).toBe(true);
    });
  });

  describe('filterDna — 판단형 표현 탐지', () => {
    it('과소비 탐지', () => {
      const result = filterDna('이번 달 과소비가 심했어요');
      expect(result.passed).toBe(false);
      expect(result.violations.some((v) => v.type === 'judgment')).toBe(true);
    });

    it('문제가 있 탐지', () => {
      const result = filterDna('소비에 문제가 있습니다');
      expect(result.passed).toBe(false);
      expect(result.violations.some((v) => v.matched === '문제가 있')).toBe(true);
    });

    it('잘못됐 탐지', () => {
      const result = filterDna('이 소비는 잘못됐어요');
      expect(result.passed).toBe(false);
      expect(result.violations.some((v) => v.type === 'judgment')).toBe(true);
    });

    it('낭비 탐지', () => {
      const result = filterDna('돈을 낭비하고 있어요');
      expect(result.passed).toBe(false);
      expect(result.violations.some((v) => v.matched === '낭비')).toBe(true);
    });
  });

  describe('filterDna — 잔소리형 표현 탐지', () => {
    it('줄이세요 탐지', () => {
      const result = filterDna('외식비를 줄이세요');
      expect(result.passed).toBe(false);
      expect(result.violations.some((v) => v.type === 'nagging')).toBe(true);
    });

    it('하지 마세요 탐지', () => {
      const result = filterDna('충동 구매는 하지 마세요');
      expect(result.passed).toBe(false);
      expect(result.violations.some((v) => v.matched === '하지 마세요')).toBe(true);
    });

    it('해야만 해 탐지', () => {
      const result = filterDna('예산을 지켜야만 해요');
      expect(result.passed).toBe(false);
      expect(result.violations.some((v) => v.type === 'nagging')).toBe(true);
    });
  });

  describe('filterDna — 점수화/등급화 탐지', () => {
    it('N점 탐지', () => {
      const result = filterDna('이번 달 소비 점수는 80점입니다');
      expect(result.passed).toBe(false);
      expect(result.violations.some((v) => v.matched === 'N점')).toBe(true);
    });

    it('A-F등급 탐지', () => {
      const result = filterDna('당신의 소비 등급은 C등급입니다');
      expect(result.passed).toBe(false);
      expect(result.violations.some((v) => v.matched === 'A-F등급')).toBe(true);
    });

    it('훈계 탐지', () => {
      const result = filterDna('훈계하려는 게 아니에요');
      expect(result.passed).toBe(false);
      expect(result.violations.some((v) => v.matched === '훈계')).toBe(true);
    });
  });

  describe('filterDna — 순위화/비교 탐지', () => {
    it('상위 N% 탐지', () => {
      const result = filterDna('상위 10% 절약 가족이에요');
      expect(result.passed).toBe(false);
      expect(result.violations.some((v) => v.matched === '상위 N%')).toBe(true);
    });

    it('순위 탐지', () => {
      const result = filterDna('가족 소비 순위를 확인하세요');
      expect(result.passed).toBe(false);
      expect(result.violations.some((v) => v.matched === '순위')).toBe(true);
    });

    it('랭킹 탐지', () => {
      const result = filterDna('이번 주 랭킹 1위!');
      expect(result.passed).toBe(false);
      expect(result.violations.some((v) => v.matched === '랭킹')).toBe(true);
    });
  });

  describe('filterDna — 성향 진단형 탐지', () => {
    it('충동형 탐지', () => {
      const result = filterDna('민준이는 충동형 소비자예요');
      expect(result.passed).toBe(false);
      expect(result.violations.some((v) => v.type === 'personality_diagnosis')).toBe(true);
    });

    it('계획형이야 탐지', () => {
      const result = filterDna('너는 계획형이야');
      expect(result.passed).toBe(false);
      expect(result.violations.some((v) => v.matched === '계획형이야')).toBe(true);
    });

    it('성향 진단형 패턴 탐지', () => {
      const result = filterDna('너는 절약형 아이야');
      expect(result.passed).toBe(false);
      expect(result.violations.some((v) => v.type === 'personality_diagnosis')).toBe(true);
    });
  });

  describe('filterDna — 복수 위반 탐지', () => {
    it('여러 위반이 동시에 있으면 모두 반환', () => {
      const result = filterDna('과소비입니다. 줄이세요. 80점짜리 소비예요.');
      expect(result.passed).toBe(false);
      expect(result.violations.length).toBeGreaterThanOrEqual(3);

      const types = result.violations.map((v) => v.type);
      expect(types).toContain('judgment');
      expect(types).toContain('nagging');
      expect(types).toContain('scoring');
    });
  });

  describe('assertDnaClean', () => {
    it('정상 문장은 throw 하지 않음', () => {
      expect(() => assertDnaClean('이번 주 잘 하셨어요!')).not.toThrow();
    });

    it('위반 시 "DNA 위반 (응답 무효):" 포함 에러 throw', () => {
      expect(() => assertDnaClean('과소비가 심했어요')).toThrow(
        'DNA 위반 (응답 무효):'
      );
    });

    it('에러 메시지에 위반 항목 포함', () => {
      let errorMsg = '';
      try {
        assertDnaClean('송금해드릴게요');
      } catch (e) {
        errorMsg = (e as Error).message;
      }
      expect(errorMsg).toContain('송금');
    });

    it('복수 위반 시 모두 에러 메시지에 포함', () => {
      let errorMsg = '';
      try {
        assertDnaClean('통제하고 감시합니다');
      } catch (e) {
        errorMsg = (e as Error).message;
      }
      expect(errorMsg).toContain('통제');
      expect(errorMsg).toContain('감시');
    });
  });
});
