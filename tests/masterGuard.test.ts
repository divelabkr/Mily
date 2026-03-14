// 마스터 계정 권한 테스트

import { useAuthStore } from '../src/engines/auth/authStore';
import {
  getMasterPermissions,
  isMasterUser,
  assertMaster,
} from '../src/engines/auth/masterGuard';

// renderHook 없이 Zustand 스토어 직접 조작으로 테스트

const BASE_USER = {
  uid: 'user_1',
  email: 'test@mily.app',
  displayName: '테스터',
  role: 'individual' as const,
  onboardingComplete: true,
};

beforeEach(() => {
  useAuthStore.setState({ user: null, loading: false });
});

describe('isMasterUser()', () => {
  it('user가 null이면 false', () => {
    useAuthStore.setState({ user: null });
    expect(isMasterUser()).toBe(false);
  });

  it('isMaster: false인 일반 유저는 false', () => {
    useAuthStore.setState({ user: { ...BASE_USER, isMaster: false } });
    expect(isMasterUser()).toBe(false);
  });

  it('isMaster: true인 마스터는 true', () => {
    useAuthStore.setState({ user: { ...BASE_USER, isMaster: true } });
    expect(isMasterUser()).toBe(true);
  });
});

describe('assertMaster()', () => {
  it('일반 유저 호출 시 에러 throw', () => {
    useAuthStore.setState({ user: { ...BASE_USER, isMaster: false } });
    expect(() => assertMaster()).toThrow('[MasterGuard] 마스터 계정만 접근 가능합니다.');
  });

  it('마스터 호출 시 에러 없음', () => {
    useAuthStore.setState({ user: { ...BASE_USER, isMaster: true } });
    expect(() => assertMaster()).not.toThrow();
  });
});

describe('getMasterPermissions()', () => {
  it('isMaster=false: 모든 권한 false', () => {
    const perms = getMasterPermissions(false);
    expect(perms.accessAllScreens).toBe(false);
    expect(perms.unlockAllAgeBands).toBe(false);
    expect(perms.grantAchievement).toBe(false);
    expect(perms.grantAmbassador).toBe(false);
    expect(perms.managePilotUsers).toBe(false);
    expect(perms.overrideSubscription).toBe(false);
  });

  it('isMaster=true: 모든 권한 true', () => {
    const perms = getMasterPermissions(true);
    expect(perms.accessAllScreens).toBe(true);
    expect(perms.unlockAllAgeBands).toBe(true);
    expect(perms.grantAchievement).toBe(true);
    expect(perms.grantAmbassador).toBe(true);
    expect(perms.managePilotUsers).toBe(true);
    expect(perms.overrideSubscription).toBe(true);
  });

  it('isMasterUser() — store 기반 일관성', () => {
    useAuthStore.setState({ user: { ...BASE_USER, isMaster: true } });
    const perms = getMasterPermissions(isMasterUser());
    expect(perms.accessAllScreens).toBe(true);
  });
});
