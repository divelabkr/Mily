# CLAUDE.md — Mily(밀리) 프로젝트 지시문

> 최종 정리: 2026-03-13 | v1~v8 + 에이전트 + 지출유형 + 킬러기능3종 + 앰배서더 + 특허보호 반영
> Sprint 1~4 완료 (68 tests). AI 실호출 성공 (Haiku). 현재: 실기기 테스트 + 출시 준비 + P1 기능 구현.

---

## 1. 프로젝트 개요

Mily(밀리)는 가족과 개인이 돈에 대해 '덜 싸우고, 더 계획하고, 함께 돌아보는' 습관을 만드는 **주 1회 5분 소비 회고 앱**.

- ❌ 금융 실행 앱 / 감시 앱 / 자산관리 앱 아님
- ✅ Behavior-First Coaching System

> 슬로건: "미루지 않는 경제 대화, Mily"

---

## 2. 기술 스택

| 영역 | 선택 |
|------|------|
| 프론트엔드 | React Native (Expo SDK 55) + Expo Router + TypeScript |
| 상태관리 | Zustand |
| 백엔드 | Firebase (Auth + Firestore + Cloud Functions) |
| AI | Anthropic Claude **Haiku 4.5** (claude-haiku-4-5-20251001) — 비용 67% 절감 |
| 결제 | RevenueCat |
| 푸시 | FCM |
| 분석 | Amplitude |
| i18n | i18next |
| 테스트 | Jest + React Native Testing Library |

---

## 3. DNA 원칙

### 절대 구현 금지 (17개)

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
15. 아동 성향 분류("충동형" 등) AI 리포트
16. 업적을 이용한 사용자 간 순위/비교
17. 캐릭터 문장의 성향 진단형 표현 ("너는 계획형이야" 금지. 기간 기반 서술만 허용)

### 반드시 지킬 것 (12개)

1. **역전된 프라이버시**: 부모에게 보여줄 정보를 자녀가 선택. 기본 전부 off. ⚠️ 특허 출원 대상
2. **시간 잠금**: Free=이번 주만. Plus/Family=4주+ 히스토리.
3. **AI 톤**: 제안형만("~해볼까요?"). 판단/명령 금지. 자녀에겐 칭찬만. AI 프롬프트에 "절대 금지(위반 시 응답 무효)" 패턴 필수 (Haiku용).
4. **요청 카드 원문**: 부모에게 비공개. AI 완충만 전송. ⚠️ 특허 출원 대상
5. **탈퇴**: 3단계 이내. 30일 내 파기.
6. **주 1회 루프**: 매일 쓰는 앱이 아니라 주 1회 5분 앱.
7. **계획은 좌표계**: 계획 없이도 기록/회고 가능. 강제 아닌 기준선.
8. **한 화면 한 목적**: CTA 1개만 강조.
9. **가족 대화는 카드**: 부모 응답은 3버튼(응원/보류/조정). 자유 텍스트 금지.
10. **"금융 서비스 아님"** 약관+앱+스토어에 고지.
11. **업적은 수집이지 점수 아님**: 업적 획득률(%)은 업적의 희귀함 표시이지 사용자 평가 아님.
12. **성장 서사는 기간 기반**: "이번 달은~" "이번 계절엔~" 형태. "너는 ~형 아이야" 금지.

### 금지/권장 표현

- **금지**: 송금, 이체, 충전, 예치, 지갑, 머니, 자산관리, 금융관리, 통제, 감시, 소비 성적, 문제 소비자, 실시간 추적, AI가 교정/판단한다, 조기 해금 시험, 최우수 가족, 상위 N%
- **권장**: 계획, 회고, 요청 카드, 가족 요약, 합의, 보상 제안, 기록, 돌아보기, 조정, 도와준다, 요약한다, 미리 써보기 대화, 꾸준한 가족, N%가 발견했어요

---

## 4. 비즈니스 구조

### 요금제

```typescript
export const PLANS = {
  free:   { id: 'free',   price: 0,    historyWeeks: 1,    requestCardsPerWeek: 2, familyMembers: 0 },
  plus:   { id: 'plus',   price: 4900, historyWeeks: null, requestCardsPerWeek: null, familyMembers: 0 },
  family: { id: 'family', price: 8900, historyWeeks: null, requestCardsPerWeek: null, familyMembers: 3 },
} as const;
// Couple(6,900원) P1.5. 출시 후 3개월.
```

### B2B 파일럿

| 단계 | 가격 | 규모 |
|------|------|------|
| 0 레퍼런스 | 무상 | 15~20명 |
| 1 Starter | 199만 | 20~30명 |
| 2 Standard | 349만 | 30~80명 |
| 3 Premium | 499만 | 50~150명 |

---

## 5. 앱 정보구조

```
Mily App
├─ 성인 앱 — 4탭
│  ├─ Onboarding (3단계): 역할→예산+슬라이더→홈
│  ├─ [Tab 1] 홈: 선택소비 요약(고정비 제외) + AI 한줄 + CTA + "거의 다 왔어요" 업적 카드(주1회)
│  ├─ [Tab 2] 계획: 월 총액 + 슬라이더 + 이번 주 약속
│  ├─ [Tab 3] 가족: 주간 요약 + 요청카드 + 칭찬보내기 + 이번 주 가족 업적 + 앰배서더 초대장
│  ├─ [Tab 4] 나: 프로필/구독/업적도감/뱃지도감/경제감각카드/탈퇴
│  ├─ [Modal] 체크인: 카테고리+금액+지출유형+감정태그+"지난번처럼"
│  ├─ [Modal] 주간회고: AI 3줄 + 약속 자가체크 + 작은 승리 + 업적 해금 팝업
│  └─ [Modal] 페이월
│
├─ 자녀 앱 — 4탭
│  ├─ [Tab 1] 홈: 남은 예산 + AI 격려 + 칭찬카드 알림 + 업적 해금 팝업
│  ├─ [Tab 2] 계획: 주간 계획 + 잠긴 기능("미리 써볼래요?" CTA)
│  ├─ [Tab 3] 요청: 5종 요청카드 + AI 완충
│  └─ [Tab 4] 나: 업적도감 + 뱃지도감 + 경제감각카드 + 프라이버시 토글 + 업적 숨김 설정
│
└─ 16 엔진 (Auth/Consent/Family/Plan/CheckIn/Review/RequestCard/PraiseCard/AI/Notification/Billing/Analytics/Achievement/Badge/Unlock/Ambassador)
```

---

## 6. 핵심 데이터 모델

### SpendType + 카테고리

```typescript
export type SpendType = 'fixed' | 'living' | 'choice';
// fixed=🔒고정, living=🛒생활, choice=✨선택
// 자녀 앱: 2종 ("정해진 거" / "내가 선택한 거")
```

### CheckIn

```typescript
export interface CheckIn {
  checkInId: string; uid: string; planId?: string;
  weekId: string; // "YYYY-Www"
  categoryId: string; amount: number; spendType: SpendType;
  emotionTag?: 'impulse' | 'stress' | 'social' | 'reward' | null;
  memo?: string; boundary?: 'within' | 'similar' | 'outside';
  createdAt: number;
}
```

### Plan

```typescript
export interface Plan {
  planId: string; uid: string; month: string;
  totalBudget: number;
  categories: Array<{ categoryId: string; percent: number }>;
  weeklyPromise?: string | null;
  createdAt: number;
}
```

### 요청 카드 (5종) + 칭찬 카드 (3종)

```typescript
export type RequestCardType = 'extra_budget' | 'plan_change' | 'reward' | 'urgent' | 'purchase_check';
export interface PraiseCard {
  cardId: string; fromUid: string; toUid: string; familyId: string;
  type: 'well_saved' | 'good_effort' | 'thank_you';
  createdAt: number;
}
```

### 업적

```typescript
export interface Achievement {
  id: string;
  category: 'record' | 'plan' | 'review' | 'family' | 'time' | 'quirky' | 'badge' | 'milestone' | 'season' | 'hidden';
  title: string; description: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'hidden';
  isHidden: boolean; hint?: string | null; seasonId?: string | null;
  condition: (ctx: AchievementContext) => boolean;
}
export interface UserAchievement { achievementId: string; unlockedAt: number; shared: boolean; }
export interface AchievementStats { achievementId: string; unlockRate: number; totalUnlocked: number; updatedAt: number; }
// unlockRate: "3.2%의 밀리 사용자가 발견했어요" — 유저 1,000명 이후 자동 활성. 매주 일요일 배치 갱신.
```

### 경제 개념 뱃지

```typescript
export const ECONOMIC_BADGES = [
  { id: 'budget', label: '예산' }, { id: 'plan', label: '계획' },
  { id: 'review', label: '회고' }, { id: 'fixed_cost', label: '고정비' },
  { id: 'negotiate', label: '협상' }, { id: 'emergency', label: '비상금' },
  { id: 'promise', label: '약속' }, { id: 'consensus', label: '합의' },
  { id: 'independence', label: '독립' },
] as const; // 9종. 수집이지 점수 아님.
```

### 연령 해금

```typescript
export const AGE_BANDS = {
  child_young: { minAge: 7, maxAge: 9, unlocked: ['checkin_basic', 'praise_receive', 'weekly_promise_simple'] },
  child_mid:   { minAge: 10, maxAge: 12, unlocked: ['...+request_card', 'plan_simple', 'emotion_tag'] },
  teen:        { minAge: 13, maxAge: 15, unlocked: ['all'] },
  young_adult: { minAge: 16, maxAge: 18, unlocked: ['all', 'income_category', 'independence_card'] },
} as const;
// 조기 해금: "미리 써보기 대화" (3택 3문항, 2/3 정답, 비시험적)
```

### 앰배서더

```typescript
export interface AmbassadorCriteria {
  minConsecutiveWeeks: 24; minReviewCount: 20;
  familyLinked: true; minConsensusRate: 0.7; minFamilyMembers: 2;
}
// 매월 1일 배치. 조건 충족 가족에게 초대장 카드 자동 발송.
// 기수(cohort) 시스템. 1기 뱃지는 영구 보존, 재획득 불가.
```

---

## 7. Plan Boundary

```typescript
function calculateBoundary(categoryAmount: number, weeklyLimit: number, spendType?: SpendType): PlanBoundary {
  if (spendType === 'fixed') return 'within';
  if (weeklyLimit === 0) return 'outside';
  const ratio = categoryAmount / weeklyLimit;
  if (spendType === 'living') { return ratio <= 1.0 ? 'within' : ratio <= 1.5 ? 'similar' : 'outside'; }
  return ratio <= 0.8 ? 'within' : ratio <= 1.2 ? 'similar' : 'outside';
}
```

---

## 8. AI 설계

- 모델: **Haiku 4.5** (비용 ~5원/건). 프롬프트에 "절대 금지 (위반 시 응답 무효)" 패턴 필수.
- 회고: choice 우선 코칭. fixed 언급 금지. 기간 기반 서술만.
- 완충: 의도 유지. 금액→"추가 예산". 1~2문장.
- Fallback: 10초 타임아웃→규칙 템플릿. 월 50,000건 상한.
- 성장 포트폴리오 서사: AI가 업적+뱃지 기반으로 기간 서술 생성. "이번 달은~" 형태만.

---

## 9. 가족 기능

- 요청 카드 5종 + AI 완충 + 3버튼 응답 ⚠️ 특허 대상
- 역전된 프라이버시 (기본 전부 off) ⚠️ 특허 대상
- 칭찬 카드 (부모→자녀, 3버튼, 추천 문구 4종)
- 이번 주 약속 (weeklyPromise + 자가체크)
- 업적 숨김 옵션 (역전된 프라이버시와 동일 원칙)
- 가족 탭 "이번 주 달성 업적" (순위 없음, 각자 뭘 했는지만)

---

## 10~14. (기존과 동일 — 알림/디자인/Firestore/이벤트/프로젝트 구조)

> Firestore 추가 컬렉션: achievements/{uid}/{id}, achievement_stats/{id}, economic_badges/{uid}/{id}, unlock_history/{uid}/{id}, ambassador_invitations/{familyId}
> Amplitude 추가 이벤트: achievement_unlocked(id, rarity, unlockRate), badge_earned(id), feature_unlocked(feature, method), ambassador_invited, ambassador_accepted
> 프로젝트 구조 추가 엔진: achievement/, badge/, unlock/, ambassador/

---

## 15. Sprint 현황

### 완료: Sprint 1~4 (68 tests, AI Haiku 실호출 성공)

### P1 구현 대기 (다음 스프린트)

| 기능 | 공수 | 에이전트 |
|------|------|----------|
| 업적 시스템 (80개 + 도감 + 팝업 + 획득률%) | 3일 | 전체 |
| 경제 개념 뱃지 (9종 + 미리 써보기 대화) | 3일 | 전체 |
| 나이 기반 해금 (연령 config + 잠긴 UI) | 2일 | 전체 |
| 칭찬 카드 | 1일 | 백엔드→프론트 |
| 이번 주 약속 | 0.5일 | 백엔드→프론트 |
| 요청카드 urgent/purchase_check | 0.5일 | 백엔드 |
| 홈 선택소비 요약 | 0.5일 | 프론트 |

### P2 (출시 후)

| 기능 | 시기 |
|------|------|
| 성장 포트폴리오 (연간 PDF) | 6개월 |
| 경제 감각 카드 (공유 이미지) | 3개월 |
| 밀리 패밀리 앰배서더 (코드 구조만 지금, UI는 MAU 1,000+) | 6개월 |
| Couple 플랜 (6,900원) | 3개월 |
| 시즌 업적 (분기마다 3~5개) | 3개월~ |
| 유저 제안 업적 | 12개월 |

---

## 16. 출시 게이트 (기존 6개 동일)

---

## 17. 에이전트 역할 분담 (기존 5인 체제 동일)

---

## 18. 코드 컨벤션 (기존 동일)

---

## 19. 연령 기반 해금 + 미리 써보기 대화 ⚠️ 특허 후보

연령 밴드(7~9/10~12/13~15/16~18)에 따라 기능 자동 해금. 조기 해금은 "미리 써보기 대화" (비시험적 3택 3문항, 2/3 맞추면 해금, 실패 기록 없음, 부모에게 실패 안 보임). 잠긴 기능은 숨기지 않고 미리보기 카드로 호기심 유발. 해금 시 부모에게 비실시간 응원 알림("민준이가 새 기능을 스스로 준비했어요. 응원 카드를 보내볼까요?").

---

## 20. 경제 개념 뱃지 + 감각 카드 + 성장 포트폴리오

뱃지 9종: 이해도 대화 통과 시 "이해한 개념의 흔적"으로 수집. 점수 아님.
감각 카드: 월간 스냅샷 이미지. 공유 우선순위 = 가족 내부 > PDF > 보호자 > SNS(옵션). 캐릭터 문장은 기간 기반 서술만("이번 계절엔~"). "나만 보기" 옵션 제공.
포트폴리오: 연간 서사 (AI 생성). 3레벨 출력(1줄/카드/PDF). "가족 성장 기록"이지 "대입 자소서" 아님.

---

## 21. 업적 시스템 (154개+)

### 구조
- 희귀도 5단계: ⚪일상 / 🟢발견 / 🔵도전 / 🟣전설 / 🟡히든
- **획득률 표시**: "3.2%의 밀리 사용자가 발견했어요" (유저 1,000명 이후 활성, 주 배치)
- 히든 29개: "???"로 표시. 획득률도 ???.
- 시즌 업적: 분기마다 3~5개 추가. 종료 후 레거시(재획득 불가 → OG 가치).
- "거의 다 왔어요" 카드: 홈 하단 주 1회. 가장 가까운 업적 1개만.
- 업적 숨김: 자녀가 개별 업적 비공개 설정 가능.

### 9개 카테고리
A.기록(28) B.계획(22) C.회고(20) D.가족(28) E.시간(24) F.엉뚱(20) G.뱃지연동(12) H.마일스톤(10) I.시즌(5+)

### 해금 팝업
```
체크인/회고 완료 후 하단 슬라이드:
🏆 "마감 전사" — 일요일 23:59에 회고!
🟢 34.1%의 사용자가 발견
[공유하기] [나만 보기]  → 3초 자동 사라짐
```

---

## 22. 밀리 패밀리 앰배서더

"잘한 사람"이 아니라 "꾸준한 가족". 조건: 24주 연속 + 회고 20회 + 가족 연결 + 합의율 70%+. 매월 배치 체크 → 초대장 카드 자동 발송. 기수 시스템(1기 뱃지 = 영원히 재획득 불가). 혜택: 🟣전설 뱃지 + 금색 프로필 프레임 + 밀리 토크 참여 자격 + 패밀리 전용 감각 카드. 해지해도 뱃지/기수 영구 보존.

---

## 23. 특허 보호 항목

| 순위 | 발명 | 가능성 | 상태 |
|------|------|--------|------|
| 1 | 역전된 프라이버시 (자녀 주도 공개 범위) | ⭐⭐⭐⭐⭐ | 선행기술 미발견 |
| 2 | 카드 기반 비대칭 가족 대화 (AI 완충+3버튼) | ⭐⭐⭐⭐ | 선행기술 미발견 |
| 3 | 연령+이해도 기능 점진 해금 | ⭐⭐⭐⭐ | 선행기술 미발견 |
| 4 | AI 톤 가드레일+지출유형 코칭 분기 | ⭐⭐⭐ | 결합 출원 |

> ⚠️ 출원 전 기술 상세 외부 공개 금지 (앱스토어/블로그/SNS).

---

## 24. 통합 흐름

```
해금 → 행동 → 업적(+획득률%) → 뱃지 → 월간 감각 카드 → 연간 포트폴리오
→ 앰배서더 초대 (24주+) → 밀리 토크 → 미디어 연결
```

구현 순서 (GPT 권장 반영): ①업적(보상 먼저) → ②뱃지 → ③해금(잠금은 나중에) → ④포트폴리오 → ⑤앰배서더
