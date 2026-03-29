# Mily 출시 전 체크리스트

## 코드 품질

- [x] `npm test` → 811 tests ALL GREEN
- [x] TypeScript 에러 0개
- [x] DNA 금지어 filterDna() 통과 확인
- [x] 모든 서비스 withGateChain 래핑 확인

## 법률 / 규정

- [ ] 개인정보처리방침 URL 연결 (https://mily-lab-dev.web.app/privacy)
- [ ] 이용약관 URL 연결 (https://mily-lab-dev.web.app/terms)
- [x] "금융 서비스가 아닙니다" 고지 화면 표시
- [x] 14세 미만 법정대리인 동의 UI
- [x] COPPA / 아동 개인정보 보호 확인
- [x] 탈퇴 3단계 이내 + 30일 내 파기

## 인증 / 로그인

- [ ] Firebase Auth → 이메일/비밀번호 로그인 방법 → 사용 설정 (콘솔 수동)
- [x] MASTER_UIDS 실제 UID 설정 (EXPO_PUBLIC_MASTER_UID 환경변수)
- [x] 마스터 계정 온보딩 바이패스 라우팅
- [x] 비밀번호 재설정 이메일 발송 기능
- [ ] 비밀번호 재설정 이메일 수신 확인 (실기기)
- [ ] 이메일 로그인 테스트
- [x] 로그아웃 → 로그인 화면 이동
- [ ] 로그아웃 → 재로그인 데이터 유지

## 결제

- [ ] RevenueCat 샌드박스 구매 테스트 (iOS)
- [ ] RevenueCat 샌드박스 구매 테스트 (Android)
- [ ] Free → Plus 업그레이드
- [ ] Plus → Family 업그레이드
- [ ] 구독 취소 후 기능 제한 확인
- [x] 탈퇴 시 유료 구독 해지 안내 경고

## 알림

- [ ] FCM 실제 푸시 발송 테스트 (iOS)
- [ ] FCM 실제 푸시 발송 테스트 (Android)
- [x] 주간 회고 리마인더 (일 18:00)
- [x] 매일 저녁 기록 알림 (설정 화면 ON/OFF)
- [ ] 요청 카드 수신 알림
- [x] 조용한 시간 (22:00~08:00) 미발송

## 핵심 기능

- [ ] 온보딩 완주 (부모 플로우)
- [ ] 온보딩 완주 (자녀 플로우)
- [ ] 체크인 5초 모드 (금액만 입력)
- [ ] 체크인 상세 모드 (지출유형 + 감정태그)
- [ ] 주간 회고 완료
- [ ] 요청카드 발송 + AI 완충 + 부모 수신
- [ ] 요청카드 3버튼 응답 (수락/조건/반려)
- [ ] 칭찬카드 발송 + 수신
- [ ] 가족 약속 기록함 약속 생성
- [ ] 꿈 설계소 롤모델 + 꿈 계산기
- [ ] 업적 해금 + 팝업
- [ ] 초대 코드 생성/사용 테스트

## CS / 피드백

- [x] 설정 화면 '의견 보내기' (hello@mily.app)
- [x] 앱 버전 표시 (설정 화면)
- [ ] 오프라인 상태 동작 확인
- [ ] 회원 탈퇴 플로우 테스트 (실기기)

## 분석 / 모니터링

- [x] PostHog 핵심 이벤트 수집 설정
- [x] PostHog identify 속성 (role, familyId, onboarding)
- [x] Amplitude 핵심 이벤트 15개 등록
- [ ] PostHog 이벤트 실제 수신 확인
- [ ] Amplitude 이벤트 실제 수신 확인

## 보안

- [x] 앱 번들 민감 키 없음 (ANTHROPIC_API_KEY = process.env만)
- [x] Firebase Functions Secret Manager 설정
- [x] Firestore Rules 완성
- [ ] Firestore Rules 실제 배포 (`firebase deploy --only firestore:rules`)

## 안정성

- [ ] iOS 실기기 크래시 없음 (iPhone 12+)
- [ ] Android 실기기 크래시 없음 (API 24+)
- [ ] 오프라인 상태 에러 카드 표시
- [ ] 네트워크 복구 후 자동 동기화
- [x] AI 10초 타임아웃 → 규칙 템플릿 폴백
- [ ] 메모리 누수 없음 (15분 연속 사용)

## 스토어 준비

- [ ] 앱스토어 스크린샷 6장 (6.7" + 5.5")
- [x] 앱스토어 설명문 (DNA 금지어 없음)
- [x] 앱 아이콘 (assets/images/icon.png)
- [ ] 연령 등급 설정 (4+)
- [ ] 카테고리: Education
- [ ] TestFlight 초대 링크 생성
- [ ] Google Play 내부 테스트 트랙 설정

## EAS 빌드

- [ ] `eas build --platform ios --profile preview` 성공
- [ ] `eas build --platform android --profile preview` 성공
- [ ] TestFlight 업로드 성공
- [ ] TestFlight 내부 테스트 설치 확인
- [ ] Google Play 내부 테스트 설치 확인

## Firebase 배포 (수동)

- [ ] Firebase Auth 이메일/비밀번호 활성화 (콘솔)
- [ ] `firebase deploy --only firestore:rules`
- [ ] `firebase deploy --only hosting` (법무 문서)
- [ ] ANTHROPIC_API_KEY → `firebase functions:secrets:set ANTHROPIC_API_KEY`
- [ ] `firebase deploy --only functions`
- [ ] Remote Config 기본값 설정
- [ ] Firebase Analytics 이벤트 수신 확인
