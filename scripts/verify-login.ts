/**
 * verify-login.ts
 * 로그인 흐름 + 마스터 계정 CS 시나리오 검증 스크립트
 *
 * 실행: npx ts-node scripts/verify-login.ts
 *
 * 5개 CS 시나리오:
 *   CS-1: 마스터 로그인 → /(adult)/home (온보딩 건너뜀)
 *   CS-2: 신규 가입 → onboarding/role-select
 *   CS-3: 기존 일반 사용자 재로그인 → /(adult)/home 또는 /(child)/home
 *   CS-4: 자녀 계정 로그인 → /(child)/home
 *   CS-5: 틀린 비밀번호 → 에러 메시지 반환
 */

import { getAuthErrorMessage } from '../src/engines/auth/authService';

// ──────────────────────────────────────────────
// 헬퍼
// ──────────────────────────────────────────────

function pass(label: string) {
  console.log(`  ✅ PASS — ${label}`);
}

function fail(label: string, detail?: string) {
  console.error(`  ❌ FAIL — ${label}${detail ? `: ${detail}` : ''}`);
  process.exitCode = 1;
}

function section(title: string) {
  console.log(`\n━━ ${title} ${'─'.repeat(50 - title.length)}`);
}

// ──────────────────────────────────────────────
// AuthGate 라우팅 로직 (app/_layout.tsx 미러)
// ──────────────────────────────────────────────

type MockUser = {
  isMaster?: boolean;
  onboardingComplete?: boolean;
  role?: 'adult' | 'child' | 'individual';
};

function simulateAuthGateRoute(user: MockUser | null): string {
  if (!user) return '/(auth)/login';

  // inAuth=true (방금 로그인한 상황)
  if (user.isMaster) return '/(adult)/home';
  if (!user.onboardingComplete) return '/(auth)/onboarding/role-select';
  if (user.role === 'child') return '/(child)/home';
  return '/(adult)/home';
}

// ──────────────────────────────────────────────
// CS-1: 마스터 로그인
// ──────────────────────────────────────────────

section('CS-1: 마스터 계정 로그인');
{
  const masterUser: MockUser = { isMaster: true, onboardingComplete: false, role: 'adult' };
  const route = simulateAuthGateRoute(masterUser);
  route === '/(adult)/home'
    ? pass('마스터 → /(adult)/home (온보딩 건너뜀)')
    : fail('마스터 라우팅', `expected /(adult)/home, got ${route}`);

  const masterUser2: MockUser = { isMaster: true, onboardingComplete: true, role: 'adult' };
  const route2 = simulateAuthGateRoute(masterUser2);
  route2 === '/(adult)/home'
    ? pass('마스터(온보딩완료) → /(adult)/home')
    : fail('마스터(온보딩완료) 라우팅', `expected /(adult)/home, got ${route2}`);
}

// ──────────────────────────────────────────────
// CS-2: 신규 가입 (onboardingComplete=false)
// ──────────────────────────────────────────────

section('CS-2: 신규 가입');
{
  const newUser: MockUser = { isMaster: false, onboardingComplete: false, role: 'individual' };
  const route = simulateAuthGateRoute(newUser);
  route === '/(auth)/onboarding/role-select'
    ? pass('신규 가입 → 온보딩 화면')
    : fail('신규 가입 라우팅', `expected /(auth)/onboarding/role-select, got ${route}`);
}

// ──────────────────────────────────────────────
// CS-3: 기존 성인 사용자 재로그인
// ──────────────────────────────────────────────

section('CS-3: 기존 성인 사용자 재로그인');
{
  const adultUser: MockUser = { isMaster: false, onboardingComplete: true, role: 'adult' };
  const route = simulateAuthGateRoute(adultUser);
  route === '/(adult)/home'
    ? pass('성인 재로그인 → /(adult)/home')
    : fail('성인 재로그인 라우팅', `expected /(adult)/home, got ${route}`);
}

// ──────────────────────────────────────────────
// CS-4: 자녀 계정 로그인
// ──────────────────────────────────────────────

section('CS-4: 자녀 계정 로그인');
{
  const childUser: MockUser = { isMaster: false, onboardingComplete: true, role: 'child' };
  const route = simulateAuthGateRoute(childUser);
  route === '/(child)/home'
    ? pass('자녀 → /(child)/home')
    : fail('자녀 라우팅', `expected /(child)/home, got ${route}`);
}

// ──────────────────────────────────────────────
// CS-5: 에러 메시지 검증
// ──────────────────────────────────────────────

section('CS-5: 에러 코드 → 한국어 메시지');
{
  const cases: [string, string][] = [
    ['auth/wrong-password',         '이메일 또는 비밀번호가 맞지 않아요'],
    ['auth/invalid-credential',     '이메일 또는 비밀번호가 맞지 않아요'],
    ['auth/user-not-found',         '이메일 또는 비밀번호가 맞지 않아요'],
    ['auth/too-many-requests',      '잠시 후 다시 시도해주세요'],
    ['auth/operation-not-allowed',  'Firebase 콘솔에서 이메일/비밀번호 로그인을 활성화해야 해요.'],
    ['auth/network-request-failed', '네트워크 연결을 확인해주세요'],
  ];

  for (const [code, expected] of cases) {
    const msg = getAuthErrorMessage(code);
    msg === expected
      ? pass(`${code}`)
      : fail(`${code}`, `expected "${expected}", got "${msg}"`);
  }
}

// ──────────────────────────────────────────────
// 비로그인 리다이렉트
// ──────────────────────────────────────────────

section('비로그인 → 로그인 화면');
{
  const route = simulateAuthGateRoute(null);
  route === '/(auth)/login'
    ? pass('user=null → /(auth)/login')
    : fail('비로그인 리다이렉트', `expected /(auth)/login, got ${route}`);
}

console.log('\n' + '━'.repeat(60));
if (process.exitCode === 1) {
  console.error('일부 시나리오 실패. 위 ❌ 항목을 확인해주세요.');
} else {
  console.log('모든 CS 시나리오 통과 ✅');
}
