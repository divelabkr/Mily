# CHANGELOG

## [1.1.0] - 2026.03.15

### ✨ 새 기능
- 정기 지출 반자동 확인 플로우 추가
- 역할별 리포트 시스템 v2 (3개 역할 × 2개 기간)
- 세분화된 프라이버시 설정 (3가지 공유 모드 + 7일 만료)
- 일일 체크인 모드 (빠른/표준/상세)
- 약속 루프 기능 (이행 추적 + 좋은 순간 + 부모 알림)
- 구매 검토 쿨링 시스템 (3단계 구매 전 성찰 과정)

### 🏗 인프라
- changelog 워크플로우 브랜치를 master에서 main으로 업데이트
- README 문서 추가 및 업데이트

---

## [1.0.0] - 2026.03.15

### ✨ 새 기능
- 리워드 쿠폰 선물 아이콘 사라지는 UX 추가
- GitHub Actions + Claude API를 활용한 자동 CHANGELOG 생성 기능
- FCM 푸시 토큰 서비스 및 개발자 도구 테스트 기능
- Firebase Remote Config 기능 플래그 지원
- 마이 탭에 개발자 도구 UI 추가 (마스터 전용)
- PostHog 모니터링 (오류 + 분석) 추가

### 🐛 버그 수정
- changelog workflow 권한 및 node24 관련 문제 수정

### 🔧 개선사항
- bfg jar 파일 제거

---

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
