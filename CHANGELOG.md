# CHANGELOG

---

## [0.1.0] - 2026.03.14

### ✨ 새 기능
- DAE Phase 0 withGateChain G01~G06 구현 (138 tests)
- 마스터 계정 시스템 Custom Claims + masterGuard
- PostHog 에러/유저행동 모니터링 통합
- 나 탭 개발자 도구 UI 마스터 전용
- Firebase Remote Config Feature Flag 8개
- FCM 푸시 토큰 서비스 + 개발자 도구 연결
- 운영자 깜짝 보상 쿠폰 시스템 약속 이행 기반

### 🏗 인프라
- GitHub divelabkr/Mily 레포 정상화
- Slack 자동 알림 연동
- API 키 보안 처리

### 🐛 버그 수정
- 로그인 후 회원가입 무한 반복 버그 수정
- onAuthStateChanged 레이스 컨디션 해소 (getUserDoc 재시도)
