# Mily 출시 전 체크리스트

## 코드 품질

- [ ] `npm test` → 763 tests ALL GREEN
- [ ] TypeScript 에러 0개
- [ ] DNA 금지어 filterDna() 통과 확인
- [ ] 모든 서비스 withGateChain 래핑 확인

## 법률 / 규정

- [ ] 개인정보처리방침 URL 연결 (https://divelab.kr/mily/privacy)
- [ ] 이용약관 URL 연결 (https://divelab.kr/mily/terms)
- [ ] "금융 서비스가 아닙니다" 고지 화면 표시
- [ ] 14세 미만 법정대리인 동의 UI
- [ ] COPPA / 아동 개인정보 보호 확인
- [ ] 탈퇴 3단계 이내 + 30일 내 파기

## 인증 / 로그인

- [ ] 카카오 로그인 실기기 테스트 (iOS)
- [ ] 카카오 로그인 실기기 테스트 (Android)
- [ ] Apple 로그인 실기기 테스트 (iOS)
- [ ] 이메일 로그인 테스트
- [ ] 로그아웃 → 재로그인 데이터 유지

## 결제

- [ ] RevenueCat 샌드박스 구매 테스트 (iOS)
- [ ] RevenueCat 샌드박스 구매 테스트 (Android)
- [ ] Free → Plus 업그레이드
- [ ] Plus → Family 업그레이드
- [ ] 구독 취소 후 기능 제한 확인

## 알림

- [ ] FCM 푸시 실기기 수신 (iOS)
- [ ] FCM 푸시 실기기 수신 (Android)
- [ ] 주간 회고 리마인더 (일 18:00)
- [ ] 요청 카드 수신 알림
- [ ] 조용한 시간 (22:00~08:00) 미발송

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

## 안정성

- [ ] iOS 실기기 크래시 없음 (iPhone 12+)
- [ ] Android 실기기 크래시 없음 (API 24+)
- [ ] 오프라인 상태 에러 카드 표시
- [ ] 네트워크 복구 후 자동 동기화
- [ ] AI 10초 타임아웃 → 규칙 템플릿 폴백
- [ ] 메모리 누수 없음 (15분 연속 사용)

## 스토어 준비

- [ ] 앱스토어 스크린샷 6장 (6.7" + 5.5")
- [ ] 앱스토어 설명문 (DNA 금지어 없음)
- [ ] 앱 아이콘 최종 디자인 적용
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

## Firebase

- [ ] Firestore 보안 규칙 검토
- [ ] Cloud Functions 배포 완료
- [ ] Remote Config 기본값 설정
- [ ] Firebase Analytics 이벤트 수신 확인
- [ ] PostHog 이벤트 수신 확인
