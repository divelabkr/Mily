// ──────────────────────────────────────────────
// checkinModeService.ts — 체크인 모드 관리
// quick(3초) / standard(30초) / detailed(상세)
// AsyncStorage 유지 + Remote Config 기본값
// ──────────────────────────────────────────────

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getString } from '../config/remoteConfigService';

export type CheckInMode = 'quick' | 'standard' | 'detailed';

const STORAGE_KEY = 'mily_checkin_mode';

export const CHECKIN_MODE_OPTIONS: {
  mode: CheckInMode;
  label: string;
  desc: string;
}[] = [
  { mode: 'quick',    label: '3초',  desc: '금액+카테고리만' },
  { mode: 'standard', label: '30초', desc: '지출유형 추가' },
  { mode: 'detailed', label: '상세', desc: '감정+메모 포함' },
];

// ──────────────────────────────────────────────
// Remote Config → 기본 모드
// ──────────────────────────────────────────────

export function getRemoteDefaultMode(): CheckInMode {
  const val = getString('daily_checkin_default_mode');
  if (val === 'quick' || val === 'standard' || val === 'detailed') return val;
  return 'standard';
}

// ──────────────────────────────────────────────
// AsyncStorage → 사용자 선택 모드 읽기
// ──────────────────────────────────────────────

export async function loadCheckInMode(): Promise<CheckInMode> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored === 'quick' || stored === 'standard' || stored === 'detailed') {
      return stored;
    }
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
    case 'quick':
      return { showSpendType: false, showEmotion: false, showMemo: false };
    case 'standard':
      return { showSpendType: true, showEmotion: false, showMemo: false };
    case 'detailed':
      return { showSpendType: true, showEmotion: true, showMemo: true };
  }
}
