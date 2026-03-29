// 마스터 계정 권한 유틸
// 일반 유저에게 마스터 기능 노출 금지
// Custom Claim role: 'master' — Firebase Admin으로만 부여

import { useAuthStore } from './authStore';

// ──────────────────────────────────────────────
// 마스터 UID 목록 (환경 변수 또는 하드코드)
// ──────────────────────────────────────────────

const ENV_MASTER_UID = process.env.EXPO_PUBLIC_MASTER_UID ?? '';
export const MASTER_UIDS: string[] = ENV_MASTER_UID ? [ENV_MASTER_UID] : [];

// ──────────────────────────────────────────────
// 순수 uid 기반 판별 (테스트/서비스 레이어용)
// ──────────────────────────────────────────────

export function isMasterAccount(uid: string): boolean {
  return MASTER_UIDS.includes(uid);
}

// ──────────────────────────────────────────────
// 마스터 권한 목록
// ──────────────────────────────────────────────

export interface MasterPermissions {
  accessAllScreens: boolean;       // 성인+자녀 전체 화면 접근
  unlockAllAgeBands: boolean;      // 모든 연령 밴드 기능 해제
  grantAchievement: boolean;       // 업적 수동 부여
  grantAmbassador: boolean;        // 앰배서더 수동 부여
  managePilotUsers: boolean;       // 파일럿 유저 관리
  overrideSubscription: boolean;   // 구독 상태 override (테스트)
}

const MASTER_PERMISSIONS: MasterPermissions = {
  accessAllScreens: true,
  unlockAllAgeBands: true,
  grantAchievement: true,
  grantAmbassador: true,
  managePilotUsers: true,
  overrideSubscription: true,
};

const NO_PERMISSIONS: MasterPermissions = {
  accessAllScreens: false,
  unlockAllAgeBands: false,
  grantAchievement: false,
  grantAmbassador: false,
  managePilotUsers: false,
  overrideSubscription: false,
};

// ──────────────────────────────────────────────
// 순수 함수 (테스트 / 서비스 레이어용)
// ──────────────────────────────────────────────

export function getMasterPermissions(isMaster: boolean): MasterPermissions {
  return isMaster ? MASTER_PERMISSIONS : NO_PERMISSIONS;
}

// ──────────────────────────────────────────────
// React Hook (컴포넌트에서 사용)
// ──────────────────────────────────────────────

export function useMasterPermissions(): MasterPermissions {
  const user = useAuthStore((s) => s.user);
  return getMasterPermissions(user?.isMaster ?? false);
}

// ──────────────────────────────────────────────
// 비훅 유틸 (서비스 레이어에서 사용)
// ──────────────────────────────────────────────

export function isMasterUser(): boolean {
  return useAuthStore.getState().user?.isMaster === true;
}

export function assertMaster(uid?: string): void {
  const isMaster = uid != null ? isMasterAccount(uid) : isMasterUser();
  if (!isMaster) {
    throw new Error('[MasterGuard] 마스터 계정만 접근 가능합니다.');
  }
}
