// ──────────────────────────────────────────────
// checkinModeService.ts — 체크인 모드 관리
// standard(기본) / detailed(자세히)
// AsyncStorage 유지 + Remote Config 기본값
// ──────────────────────────────────────────────

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getString } from '../config/remoteConfigService';

export type CheckInMode = 'standard' | 'detailed';

const STORAGE_KEY = 'mily_checkin_mode';

export const CHECKIN_MODE_OPTIONS: {
  mode: CheckInMode;
  label: string;
  desc: string;
}[] = [
  { mode: 'standard', label: '기본',  desc: '금액·카테고리·지출유형' },
  { mode: 'detailed', label: '자세히', desc: '감정태그·메모 추가' },
];

// ──────────────────────────────────────────────
// Remote Config → 기본 모드
// ──────────────────────────────────────────────

export function getRemoteDefaultMode(): CheckInMode {
  const val = getString('daily_checkin_default_mode');
  if (val === 'standard' || val === 'detailed') return val;
  return 'standard';
}

// ──────────────────────────────────────────────
// AsyncStorage → 사용자 선택 모드 읽기
// ──────────────────────────────────────────────

export async function loadCheckInMode(): Promise<CheckInMode> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored === 'standard' || stored === 'detailed') return stored;
    // 구버전 'quick' 값이 저장된 경우 'standard'로 마이그레이션
  } catch {
    // 스토리지 실패 → Remote Config 기본값
  }
  return getRemoteDefaultMode();
}

// ──────────────────────────────────────────────
// AsyncStorage → 사용자 선택 모드 저장
// ──────────────────────────────────────────────

export async function saveCheckInMode(mode: CheckInMode): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, mode);
  } catch {
    // 저장 실패 무시
  }
}

// ──────────────────────────────────────────────
// 모드별 표시 필드 제어
// ──────────────────────────────────────────────

export interface CheckInModeFields {
  showSpendType: boolean;
  showEmotion: boolean;
  showMemo: boolean;
}

export function getFieldsForMode(mode: CheckInMode): CheckInModeFields {
  switch (mode) {
    case 'standard':
      return { showSpendType: true, showEmotion: false, showMemo: false };
    case 'detailed':
      return { showSpendType: true, showEmotion: true, showMemo: true };
  }
}
