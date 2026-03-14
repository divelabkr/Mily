// ──────────────────────────────────────────────
// 연령 기반 해금 시스템 타입
// CLAUDE.md §19 기반
// ──────────────────────────────────────────────

export type FeatureId =
  | 'checkin_basic'           // 기본 체크인 (모든 연령)
  | 'praise_receive'          // 칭찬 카드 받기
  | 'weekly_promise_simple'   // 이번 주 약속 (간단)
  | 'request_card'            // 요청 카드 보내기
  | 'plan_simple'             // 월 계획 보기/설정
  | 'emotion_tag'             // 감정 태그
  | 'income_category'         // 용돈/수입 카테고리
  | 'independence_card';      // 독립 선언 카드 (16~18세)

export type AgeBandId =
  | 'child_young'   // 7~9세
  | 'child_mid'     // 10~12세
  | 'teen'          // 13~15세
  | 'young_adult';  // 16~18세

export interface AgeBand {
  id: AgeBandId;
  label: string;
  minAge: number;
  maxAge: number;
  unlockedFeatures: FeatureId[];
  // 다음 밴드의 기능 조기 해금에 사용하는 대화 세트 ID
  earlyUnlockDialogId: string | null;
}

// ──────────────────────────────────────────────
// AGE_BANDS config
// ──────────────────────────────────────────────

export const AGE_BANDS: Record<AgeBandId, AgeBand> = {
  child_young: {
    id: 'child_young',
    label: '초등 저학년 (7~9세)',
    minAge: 7,
    maxAge: 9,
    unlockedFeatures: ['checkin_basic', 'praise_receive', 'weekly_promise_simple'],
    earlyUnlockDialogId: 'plan_readiness', // plan_simple 조기 해금 대화
  },
  child_mid: {
    id: 'child_mid',
    label: '초등 고학년 (10~12세)',
    minAge: 10,
    maxAge: 12,
    unlockedFeatures: [
      'checkin_basic', 'praise_receive', 'weekly_promise_simple',
      'request_card', 'plan_simple', 'emotion_tag',
    ],
    earlyUnlockDialogId: null,
  },
  teen: {
    id: 'teen',
    label: '중학생 (13~15세)',
    minAge: 13,
    maxAge: 15,
    unlockedFeatures: [
      'checkin_basic', 'praise_receive', 'weekly_promise_simple',
      'request_card', 'plan_simple', 'emotion_tag',
      'income_category',
    ],
    earlyUnlockDialogId: null,
  },
  young_adult: {
    id: 'young_adult',
    label: '고등학생 (16~18세)',
    minAge: 16,
    maxAge: 18,
    unlockedFeatures: [
      'checkin_basic', 'praise_receive', 'weekly_promise_simple',
      'request_card', 'plan_simple', 'emotion_tag',
      'income_category', 'independence_card',
    ],
    earlyUnlockDialogId: null,
  },
};

// ──────────────────────────────────────────────
// 미리 써보기 대화 (ReadinessQuestion)
// 3택 3문항, 2/3 맞추면 조기 해금
// ──────────────────────────────────────────────

export interface ReadinessQuestion {
  id: string;
  text: string;
  options: [string, string, string]; // 항상 3개
  correctIndex: 0 | 1 | 2;
}

export interface ReadinessDialog {
  dialogId: string;
  targetFeature: FeatureId; // 해금될 기능
  questions: [ReadinessQuestion, ReadinessQuestion, ReadinessQuestion]; // 항상 3문항
  passThreshold: number;   // 통과 기준 (2 = 2/3 이상)
}

// plan_simple 조기 해금용 3문항
export const READINESS_DIALOGS: Record<string, ReadinessDialog> = {
  plan_readiness: {
    dialogId: 'plan_readiness',
    targetFeature: 'plan_simple',
    passThreshold: 2,
    questions: [
      {
        id: 'q1',
        text: '계획이란 무엇일까요?',
        options: [
          '돈을 어디에 쓸지 미리 생각해 두는 것',
          '돈을 많이 모으는 방법',
          '용돈을 친구에게 빌려주는 것',
        ],
        correctIndex: 0,
      },
      {
        id: 'q2',
        text: '이번 달 용돈이 5만원이에요. 계획을 세운다면 어떻게 할까요?',
        options: [
          '그냥 쓰고 싶은 대로 써요',
          '전부 저금해요',
          '미리 어디에 얼마를 쓸지 나눠봐요',
        ],
        correctIndex: 2,
      },
      {
        id: 'q3',
        text: '계획대로 안 됐을 때는 어떻게 하면 좋을까요?',
        options: [
          '왜 다르게 됐는지 생각해보고 다음에 조정해요',
          '그냥 포기해요',
          '계획을 아예 안 세워요',
        ],
        correctIndex: 0,
      },
    ],
  },
};

// ──────────────────────────────────────────────
// 해금 상태 (Firestore: unlock_status/{uid})
// ──────────────────────────────────────────────

export interface UnlockStatus {
  uid: string;
  birthYear: number;
  unlockedFeatures: FeatureId[];
  earlyUnlocks: FeatureId[];  // 조기 해금된 기능 목록
  // 실패 기록은 저장하지 않음 (CLAUDE.md §19: 실패 기록 없음)
  updatedAt: number;
}
