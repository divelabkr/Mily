# CLAUDE.md — Mily(밀리) 프로젝트 지시문

> 최종 정리: 2026-03-12 | v1~v8 통합 + 에이전트 + 지출유형 + 킬러기능 반영
> Sprint 1~4 완료 (45 tests pass). 현재 단계: 실기기 테스트 + 출시 준비.

---

## 1. 프로젝트 개요

Mily(밀리)는 가족과 개인이 돈에 대해 '덜 싸우고, 더 계획하고, 함께 돌아보는' 습관을 만드는 **주 1회 5분 소비 회고 앱**.

- ❌ 금융 실행 앱 아님
- ❌ 감시 앱 아님
- ❌ 자산관리 앱 아님
- ✅ Behavior-First Coaching System

> 슬로건: "돈 얘기, 이제 싸움 말고 카드로."

---

## 2. 기술 스택

| 영역 | 선택 |
|------|------|
| 프론트엔드 | React Native (Expo SDK 55) + Expo Router + TypeScript |
| 상태관리 | Zustand |
| 백엔드 | Firebase (Auth + Firestore + Cloud Functions) |
| AI | Anthropic Claude Sonnet (claude-sonnet-4-20250514) |
| 결제 | RevenueCat |
| 푸시 | FCM |
| 분석 | Amplitude |
| i18n | i18next |
| 테스트 | Jest + React Native Testing Library |

---

## 3. DNA 원칙

### 절대 구현 금지

1. 돈 보관/예치/충전/내부머니/포인트 환급
2. 자동 송금/자동 이체/자동 정산
3. 자동 승인/자동 거절
4. 결제 차단 기능
5. 부모의 자녀 실시간 지출 감시
6. 부모에게 자녀의 상세 상호명/정확한 금액 기본 노출
7. 자체 금융 데이터 스크래핑
8. AI 점수화/등급화/낙인화/훈계형 발화
9. 소비 성적, 문제 소비자 표현
10. 광고 SDK 탑재
11. 친구 지갑/회비 보관/분배/벌금
12. 공개 소비 랭킹
13. 채팅방/메신저형 가족 대화 (카드 기반만)
14. 형제자매 경쟁/리더보드
15. 아동 성향 분류(충동형 등) AI 리포트

### 반드시 지킬 것

1. **역전된 프라이버시**: 부모에게 보여줄 정보를 자녀가 선택. 기본 전부 off.
2. **시간 잠금**: Free=이번 주만. Plus/Family=4주+ 히스토리.
3. **AI 톤**: 제안형만("~해볼까요?"). 판단/명령 금지. 자녀에겐 칭찬만.
4. **요청 카드 원문**: 부모에게 비공개. AI 완충만 전송.
5. **탈퇴**: 3단계 이내. 30일 내 파기.
6. **주 1회 루프**: 매일 쓰는 앱이 아니라 주 1회 5분 앱.
7. **계획은 좌표계**: 계획 없이도 기록/회고 가능. 강제 아닌 기준선.
8. **한 화면 한 목적**: CTA 1개만 강조.
9. **가족 대화는 카드**: 부모 응답은 3버튼(응원/보류/조정). 자유 텍스트 금지.
10. **"금융 서비스 아님"** 약관+앱+스토어에 고지.

### 금지/권장 표현

- **금지**: 송금, 이체, 충전, 예치, 지갑, 머니, 자산관리, 금융관리, 통제, 감시, 소비 성적, 문제 소비자, 실시간 추적, AI가 교정/판단한다
- **권장**: 계획, 회고, 요청 카드, 가족 요약, 합의, 보상 제안, 기록, 돌아보기, 조정, 도와준다, 요약한다

---

## 4. 비즈니스 구조

### 3축 매출

| 축 | 타겟 | 상품 | 가격 |
|---|------|------|------|
| B2C 개인 | 초년생/성인 | Plus | 4,900원/월 |
| B2C 가족 | 부모+초등 자녀(7~13세) | Family | 8,900원/월 |
| B2B 기관 | 학교/기관/기업 HR | 파일럿 | 무상~499만 원 |

### 요금제

```typescript
// src/engines/billing/plans.ts
export const PLANS = {
  free:   { id: 'free',   price: 0,    historyWeeks: 1,    maxCategories: 6,    requestCardsPerWeek: 2,    familyMembers: 0 },
  plus:   { id: 'plus',   price: 4900, historyWeeks: null, maxCategories: null, requestCardsPerWeek: null, familyMembers: 0 },
  family: { id: 'family', price: 8900, historyWeeks: null, maxCategories: null, requestCardsPerWeek: null, familyMembers: 3 },
} as const;
// Family Plus(12,900원) 제거. Couple(6,900원)은 P1.5(출시 후 3개월).
```

### B2B 파일럿

| 단계 | 패키지 | 가격 | 규모 | 기간 |
|------|--------|------|------|------|
| 0 | 레퍼런스 | 무상 | 15~20명 | 6주 |
| 1 | Starter | 199만 | 20~30명 | 8주 |
| 2 | Standard | 349만 | 30~80명 | 8주 |
| 3 | Premium | 499만 | 50~150명 | 10주 |

---

## 5. 앱 정보구조

```
Mily App
├─ [공통] Splash → 역할 분기
│
├─ 성인 앱 — 4탭
│  ├─ Onboarding (3단계): 역할→예산+슬라이더→홈
│  ├─ [Tab 1] 홈: 선택소비 요약 + AI 한줄 + CTA(평일→기록/주말→회고)
│  ├─ [Tab 2] 계획: 월 총액(직접입력) + 카테고리 슬라이더(100%)
│  ├─ [Tab 3] 가족: 주간 요약 + 요청카드 + 칭찬보내기 (부모모드만)
│  ├─ [Tab 4] 나: 프로필/구독/가족관리/알림/탈퇴
│  ├─ [Modal] 체크인: 카테고리+금액+지출유형+감정태그+"지난번처럼"
│  ├─ [Modal] 주간회고: AI 3줄 + 약속 자가체크 + 작은 승리 + 조정
│  └─ [Modal] 페이월: Plus vs Family 2플랜 비교
│
├─ 자녀 앱 — 4탭
│  ├─ Onboarding (3단계): 초대코드+동의→계획확인→홈
│  ├─ [Tab 1] 홈: 남은 예산 + AI 격려 + 칭찬카드 알림
│  ├─ [Tab 2] 계획: 주간 계획 + 사용률
│  ├─ [Tab 3] 요청: 5종 요청카드 + AI 완충 미리보기
│  └─ [Tab 4] 나: 배지 + "부모님에게 보여줄 것" 프라이버시 토글
│
└─ 12 엔진 (Auth/Consent/Family/Plan/CheckIn/Review/RequestCard/AI/Notification/Billing/Analytics/Admin)
```

> 5탭 금지. "함께" 탭 금지. "회고" 독립 탭 금지.

---

## 6. 핵심 데이터 모델

### 카테고리 (6개 + spendType)

```typescript
// src/engines/plan/defaultCategories.ts
export type SpendType = 'fixed' | 'living' | 'choice';

export const DEFAULT_CATEGORIES = [
  { id: 'food',      label: '식음료', emoji: '🍚', defaultSpendType: 'living' as SpendType },
  { id: 'transport', label: '이동',   emoji: '🚌', defaultSpendType: 'living' as SpendType },
  { id: 'hobby',     label: '취미',   emoji: '🎮', defaultSpendType: 'choice' as SpendType },
  { id: 'social',    label: '모임',   emoji: '👫', defaultSpendType: 'choice' as SpendType },
  { id: 'savings',   label: '남기기', emoji: '💰', defaultSpendType: 'fixed' as SpendType },
  { id: 'etc',       label: '기타',   emoji: '📦', defaultSpendType: 'choice' as SpendType },
] as const;
```

### 지출 유형 (SpendType)

| 코드 | 한국어 | 설명 | AI 코칭 | Plan Boundary |
|------|--------|------|---------|---------------|
| `fixed` | 🔒 고정 | 매달 같은 금액 (월세, 통신비) | 언급 안 함 | 항상 within |
| `living` | 🛒 생활 | 변동 생활비 (식비, 생활용품) | 큰 변동만 언급 | 150%까지 similar |
| `choice` | ✨ 선택 | 안 써도 되는 소비 (취미, 모임) | **코칭 핵심 대상** | 80%/120% 기준 |

자녀 앱: 2종 단순화 → "정해진 거예요"(fixed) / "내가 선택한 거예요"(choice)

### CheckIn 엔터티

```typescript
export interface CheckIn {
  checkInId: string;
  uid: string;
  weekId: string;           // "2026-W11" 형식
  categoryId: CategoryId;
  amount: number;
  spendType?: SpendType | null;
  planId?: string;          // optional — 향후 Plan 연결용
  boundary?: 'within' | 'similar' | 'outside'; // optional — 저장 시 캐시
  memo?: string;
  emotionTag?: EmotionTag | null;
  createdAt: number;        // JS timestamp (ms). Timestamp 전환은 P2.
}
```

### Plan 엔터티

```typescript
// src/engines/plan/planStore.ts
export interface CategoryAllocation {
  categoryId: CategoryId;
  percent: number; // 0~100, 합계 100. 슬라이더 UX 기반.
}

export interface Plan {
  planId: string;
  uid: string;
  month: string;            // "YYYY-MM"
  totalBudget: number;
  categories: CategoryAllocation[];
  weeklyPromise?: string | null;
  createdAt: number;        // JS timestamp (ms). Timestamp 전환은 P2.
  updatedAt: number;
}
```

### 요청 카드 (5종)

```typescript
export type RequestCardType =
  | 'extra_budget'    // 추가 예산
  | 'plan_change'     // 계획 조정
  | 'reward'          // 보상 제안
  | 'urgent'          // 긴급 요청 (즉시 푸시, 이유 필수)
  | 'purchase_check'; // 구매 고민
```

### 칭찬 카드 (부모→자녀)

```typescript
export interface PraiseCard {
  cardId: string;
  fromUid: string;   // 부모
  toUid: string;     // 자녀
  familyId: string;
  type: 'well_saved' | 'good_effort' | 'thank_you';
  createdAt: number; // JS timestamp (ms). Timestamp 전환은 P2.
}
// Firestore: praise_cards/{familyId}/{cardId}
// 3버튼 선택형. 자유 텍스트 금지.
```

---

## 7. Plan Boundary

```typescript
function calculateBoundary(
  categoryAmount: number,
  weeklyLimit: number,
  spendType?: SpendType
): PlanBoundary {
  if (spendType === 'fixed') return 'within';
  if (weeklyLimit === 0) return 'outside';
  const ratio = categoryAmount / weeklyLimit;

  if (spendType === 'living') {
    if (ratio <= 1.0) return 'within';
    if (ratio <= 1.5) return 'similar';
    return 'outside';
  }
  // choice (default)
  if (ratio <= 0.8) return 'within';
  if (ratio <= 1.2) return 'similar';
  return 'outside';
}
```

| 경계 | UX |
|------|----|
| within | 무표시 |
| similar | 하단 1줄: "이번 주 {카테고리} 거의 다 썼어요." |
| outside | 바텀시트: 예외로 남기기 / 다른 카테고리에서 조정 / 다음 주 회고에 반영 |

> outside에서 절대 차단/경고/빨간색 금지.

---

## 8. AI 설계

### 노출 규칙
- 주간 최대 3회 (계획 1 + 기록 1 + 회고 1). AI가 먼저 말 거는 구조 금지.

### 회고 3줄 시스템 프롬프트

```
너는 Mily 앱의 주간 소비 회고 코치다.
이번 주 계획과 실제 사용 데이터를 받아서 정확히 3줄로 요약한다.

규칙:
1. 첫 줄: 이번 주 잘한 점 1가지. 구체적 카테고리명.
2. 둘째 줄: 계획보다 많이 쓴 곳 1가지. "조금/꽤" 수준만.
3. 셋째 줄: 다음 주 조정 제안 1가지. "~해볼까요?" 형식.

spendType 규칙:
- fixed(고정): 변동 없으면 언급 금지.
- living(생활): 큰 변동 시에만 언급.
- choice(선택): 코칭 핵심 대상. 3줄 모두 choice 우선.

emotionTag가 있으면 셋째 줄에 감정 패턴 부드럽게 반영.

금지: 판단형, 명령형, 점수화, 비교, 금융상품 추천, 10,000원 이상 금액, 고정비 비율 언급.
톤: 한국어 존댓말. "~해요, ~할까요"
출력: JSON {"good":"","leak":"","suggestion":""}
```

### 요청 카드 완충 시스템 프롬프트

```
너는 Mily 앱의 가족 대화 완충기다.
자녀 → 부모 요청을 부드럽게 다듬는다.

규칙: 의도 유지, 금액→"추가 예산" 대체, 1~2문장, "~고려해주실 수 있을까요?" 형식.
금지: 요청 축소, 부모 편들기, 훈계, 구체적 금액.
입력: {"originalText":"","requestType":"extra_budget|plan_change|reward|urgent|purchase_check"}
출력: {"bufferedText":""}
```

### Fallback
- 타임아웃: 10초 → 규칙 기반 템플릿
- 완충 실패: 원문 전송 + "(AI 다듬기를 건너뛰었어요)"
- 월 상한: 50,000건 (AI_MONTHLY_LIMIT). 초과→규칙 기반 전환.

---

## 9. 가족 기능

### 요청 카드 응답 (3버튼)
```
[ 👍 응원할게 ] [ ⏸️ 잠깐 보류 ] [ 🔄 같이 조정해보자 ]
```
자유 텍스트 없음. 재요청 쿨다운 7일.

### 역전된 프라이버시
자녀 "나" 탭에서 카테고리별 on/off. **기본 전부 off.** Firestore: `families/{familyId}/privacySettings/{childUid}`

### 칭찬 카드 (부모→자녀)
부모 가족 탭 → "칭찬 보내기" → 3버튼(잘 아꼈어/노력이 보여/고마워). 자녀 홈에 도착 알림.

### 이번 주 한 가지 약속
Plan에 `weeklyPromise` 필드. 회고 시 "지켰어요/못 지켰어요" 2버튼. 지키면→작은 승리. 못 지키면→"다음 주에 다시!" (비난 없음).

---

## 10. 알림 규칙

- 최대 주 3회. 22:00~08:00 금지.
- 일요일 18시: 회고 리마인드
- 요청/칭찬 카드 수신: 즉시 (시간대 내)
- urgent 요청: 즉시 (priority high)

---

## 11. 디자인 토큰

```typescript
export const theme = {
  colors: {
    primary: '#4A6FA5',      // 차분한 블루
    secondary: '#7EB5A6',    // 민트 그린
    accent: '#F4A261',       // 따뜻한 오렌지 (CTA)
    background: '#FAFAF8',
    surface: '#FFFFFF',
    textPrimary: '#2D3436',
    textSecondary: '#636E72',
    success: '#6ABF69',
    warning: '#F4A261',
    border: '#E8E8E8',
  },
  spacing: [0, 4, 8, 12, 16, 24, 32, 48],
  borderRadius: { card: 16, button: 12, input: 8 },
  // 시스템 폰트. 최소 터치 44×44pt. 색상 대비 WCAG AA 4.5:1.
};
```

---

## 12. Firestore 보안 규칙

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
    match /plans/{uid}/{month} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
    match /checkins/{uid}/{planId}/{week} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
    match /reviews/{uid}/{planId}/{week} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
    match /families/{familyId} {
      allow read: if request.auth != null &&
        request.auth.uid in resource.data.memberUids;
      allow write: if request.auth != null &&
        request.auth.uid == resource.data.ownerUid;
    }
    match /families/{familyId}/privacySettings/{childUid} {
      allow read: if request.auth != null &&
        request.auth.uid in get(/databases/$(database)/documents/families/$(familyId)).data.memberUids;
      allow write: if request.auth != null && request.auth.uid == childUid;
    }
    match /request_cards/{familyId}/{cardId} {
      allow read: if request.auth != null && (
        request.auth.uid == resource.data.fromUid ||
        request.auth.uid == resource.data.toUid);
      allow create: if request.auth != null &&
        request.auth.uid == request.resource.data.fromUid;
      allow update: if request.auth != null &&
        request.auth.uid == resource.data.toUid;
    }
    match /praise_cards/{familyId}/{cardId} {
      allow read: if request.auth != null && (
        request.auth.uid == resource.data.fromUid ||
        request.auth.uid == resource.data.toUid);
      allow create: if request.auth != null &&
        request.auth.uid == request.resource.data.fromUid;
    }
    match /consents/{consentId} {
      allow read: if request.auth != null && (
        request.auth.uid == resource.data.guardianUid ||
        request.auth.uid == resource.data.childUid);
      allow create: if request.auth != null &&
        request.auth.uid == request.resource.data.guardianUid;
    }
    match /pilots/{pilotId} {
      allow read: if false; // Console 전용
    }
  }
}
```

---

## 13. Amplitude 이벤트

| 이벤트 | 속성 |
|--------|------|
| onboarding_started | role |
| onboarding_completed | role, skipped_plan |
| plan_created | month, categoryCount |
| checkin_completed | week, amount, boundary, emotionTag, spendType |
| review_completed | week, aiUsed, promiseKept |
| request_card_sent | type (5종) |
| praise_card_sent | type (3종) |
| family_linked | memberCount |
| paywall_viewed | trigger |
| subscription_started | plan, price |
| subscription_cancelled | plan |
| referral_sent | — |
| referral_accepted | — |

모든 이벤트에 `user_segment: 'individual' | 'parent' | 'child' | 'pilot_participant'` 추가.

---

## 14. 프로젝트 구조

```
mily/
├── app/                          # Expo Router
│   ├── (auth)/
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   ├── terms.tsx
│   │   └── onboarding/
│   │       ├── role-select.tsx
│   │       └── first-plan.tsx
│   ├── (adult)/
│   │   ├── _layout.tsx           # 4탭
│   │   ├── home.tsx
│   │   ├── plan.tsx
│   │   ├── family.tsx
│   │   ├── my.tsx
│   │   ├── review.tsx            # 모달
│   │   ├── paywall.tsx           # 모달
│   │   └── checkin.tsx           # 모달
│   ├── (child)/
│   │   ├── _layout.tsx           # 4탭
│   │   ├── home.tsx
│   │   ├── plan.tsx
│   │   ├── request.tsx
│   │   └── me.tsx
│   └── _layout.tsx
│
├── src/
│   ├── types/                    # 모든 인터페이스/타입 (아키텍트 소유)
│   ├── engines/
│   │   ├── auth/                 # authService, authStore, deleteAccount
│   │   ├── family/               # familyService, familyStore, inviteCode, privacySettings, referral
│   │   ├── consent/              # consentService, ageGate, guardianVerify
│   │   ├── plan/                 # planService, planStore, defaultCategories, homeCtaLogic
│   │   ├── checkin/              # checkinService, checkinStore, planBoundary, recentSuggestion
│   │   ├── review/               # reviewService, reviewStore, smallWin, familyGrowthReport
│   │   ├── requestCard/          # requestCardService, requestCardStore, consensus
│   │   ├── praiseCard/           # praiseCardService, praiseCardStore
│   │   ├── ai/                   # aiToneService, prompts/, fallback
│   │   ├── notification/         # notificationService
│   │   ├── billing/              # billingService, billingStore, plans, timeLock, paywallTriggers, pilotOverride
│   │   └── analytics/            # analyticsService
│   ├── ui/                       # theme, components/, layouts/
│   ├── i18n/                     # ko.json, i18n.ts
│   ├── hooks/                    # useAuth, usePlan, useFamily, useSubscription
│   └── utils/                    # dateUtils, formatCurrency, validators
│
├── functions/                    # Firebase Cloud Functions
│   └── src/
│       ├── ai/                   # weeklyReview, requestBuffer
│       ├── notifications/        # scheduleReminders
│       ├── family/               # inviteExpiry
│       ├── billing/              # webhooks
│       └── jobs/                 # purgeDeletedUsers
│
├── __tests__/                    # 테스트 (QA 소유)
├── scripts/                      # sprint-check.sh, dna-check.sh, pilot-report.py
├── docs/legal/                   # terms.md, privacy.md, privacy-children.md
├── firestore.rules
├── app.json
└── CLAUDE.md
```

---

## 15. Sprint 현황

### Sprint 1~4: ✅ 완료 (45 tests pass)

| Sprint | 핵심 | 상태 |
|--------|------|------|
| S1 뼈대 | Expo+Firebase+Auth+온보딩+Plan+홈 | ✅ 완료 |
| S2 핵심루프 | CheckIn+AI회고+요청카드+가족연결+프라이버시 | ✅ 완료 |
| S3 수익화 | RevenueCat+시간잠금+페이월+리포트+알림+분석 | ✅ 완료 |
| S4 출시준비 | QA+접근성+메타데이터+약관+AI검수+테스트 | ✅ 완료 |

### 남은 작업 (코드 밖)

- [ ] Firebase 실 프로젝트 생성 + 환경변수
- [ ] Anthropic API 키 발급
- [ ] RevenueCat 프로젝트 + 상품 등록 (Plus/Family)
- [ ] 실기기 테스트 (iOS/Android)
- [ ] AI 톤 검수 50건 (실제 API 호출)
- [ ] 앱스토어 심사 제출

### 추가 구현 대기 (P0~P1)

| 기능 | 시기 | 공수 |
|------|------|------|
| 칭찬 카드 (부모→자녀) | 다음 스프린트 | 1일 |
| 이번 주 한 가지 약속 | 다음 스프린트 | 0.5일 |
| 긴급 요청 + 구매 고민 (요청카드 5종) | 다음 스프린트 | 0.5일 |
| 요청 다듬기 코치 (AI guided) | P1 | 1일 |
| 용돈 계약서 | P1 | 1.5일 |
| 가족 돈 헌법 | P1 | 1.5일 |
| Couple 플랜 (6,900원) | 출시 후 3개월 | Sprint 2개 |

---

## 16. 출시 게이트

| 게이트 | 조건 | 실패 시 |
|--------|------|---------|
| Product | 루프 5분, 크리티컬 0건 | 출시 금지 |
| Privacy | 14세 동의, 역전 프라이버시 | 출시 금지 |
| Legal | 약관+아동약관+"금융 아님" | 출시 금지 |
| Billing | 결제/복원/해지 테스트 | 출시 금지 |
| AI Tone | 50건 중 금지 표현 0건 | AI 비활성화 후 출시 |
| Accessibility | 44pt 터치, 4.5:1 대비 | 수정 후 출시 |

---

## 17. 에이전트 역할 분담

| 에이전트 | 모델 | 담당 | 파일 |
|----------|------|------|------|
| 아키텍트 | Opus | 구조/타입/인터페이스 | `src/types/`, `firestore.rules`, `CLAUDE.md` |
| 프론트엔드 | Sonnet | 화면/UI/i18n/접근성 | `app/`, `src/ui/`, `src/i18n/`, `src/hooks/` |
| 백엔드 | Sonnet | 서비스/Firestore/Functions | `src/engines/**/*Service.ts`, `functions/` |
| AI | Opus | 프롬프트/톤/fallback | `src/engines/ai/` |
| QA | Sonnet | 테스트/DNA탐지/게이트 | `__tests__/`, `scripts/` |

**소통**: 타입 정의로 소통. 파일 소유권 준수. 커밋 태그 `[Agent명]`.
**순서**: Architect → Backend → Frontend → AI → QA.
**DNA 위반 시**: 어떤 에이전트든 즉시 STOP.

```bash
# 사용법
"아키텍트 모드. {지시}"
"백엔드 모드. {지시}"
"프론트엔드 모드. {지시}"
"AI 모드. {지시}"
"QA 모드. {지시}"
```

---

## 18. 코드 컨벤션

- 파일: kebab-case / 컴포넌트: PascalCase / 함수: camelCase / 상수: UPPER_SNAKE
- Firestore 경로: snake_case
- 커밋: `[Agent명] 설명`
- i18n: 모든 UI 텍스트 ko.json 키-값. 하드코딩 한국어 0건.
