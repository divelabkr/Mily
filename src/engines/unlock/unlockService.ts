import { create } from 'zustand';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getFirebaseDb } from '../../lib/firebase';
import { trackEvent } from '../analytics/analyticsService';
import {
  FeatureId,
  AgeBandId,
  AGE_BANDS,
  ReadinessDialog,
  READINESS_DIALOGS,
  UnlockStatus,
} from './unlockTypes';

// ──────────────────────────────────────────────
// Zustand 스토어
// ──────────────────────────────────────────────

interface UnlockState {
  unlockStatus: UnlockStatus | null;
  loading: boolean;
  setUnlockStatus: (status: UnlockStatus) => void;
  setLoading: (v: boolean) => void;
  isFeatureUnlocked: (featureId: FeatureId) => boolean;
}

export const useUnlockStore = create<UnlockState>((set, get) => ({
  unlockStatus: null,
  loading: false,
  setUnlockStatus: (status) => set({ unlockStatus: status }),
  setLoading: (v) => set({ loading: v }),
  isFeatureUnlocked: (featureId) => {
    const status = get().unlockStatus;
    if (!status) return false;
    return status.unlockedFeatures.includes(featureId);
  },
}));

// ──────────────────────────────────────────────
// 나이 계산
// ──────────────────────────────────────────────

export function calcAge(birthYear: number): number {
  return new Date().getFullYear() - birthYear;
}

export function getAgeBandForAge(age: number): AgeBandId | null {
  for (const [id, band] of Object.entries(AGE_BANDS)) {
    if (age >= band.minAge && age <= band.maxAge) {
      return id as AgeBandId;
    }
  }
  return null;
}

/** 나이 기준 자동 해금 기능 목록 */
export function getFeaturesForAge(age: number): FeatureId[] {
  const bandId = getAgeBandForAge(age);
  if (!bandId) return [];
  return [...AGE_BANDS[bandId].unlockedFeatures];
}

// ──────────────────────────────────────────────
// Firestore CRUD
// ──────────────────────────────────────────────

export async function loadUnlockStatus(uid: string): Promise<UnlockStatus | null> {
  const ref = doc(getFirebaseDb(), 'unlock_status', uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const status = snap.data() as UnlockStatus;
  useUnlockStore.getState().setUnlockStatus(status);
  return status;
}

export async function saveUnlockStatus(status: UnlockStatus): Promise<void> {
  const ref = doc(getFirebaseDb(), 'unlock_status', status.uid);
  await setDoc(ref, { ...status, updatedAt: Date.now() }, { merge: true });
  useUnlockStore.getState().setUnlockStatus(status);
}

// ──────────────────────────────────────────────
// 나이 자동 해금 (앱 시작 or 생일 이후 첫 실행)
// ──────────────────────────────────────────────

export async function syncAgeBasedUnlocks(
  uid: string,
  birthYear: number
): Promise<FeatureId[]> {
  const age = calcAge(birthYear);
  const ageFeatures = getFeaturesForAge(age);

  const existing = await loadUnlockStatus(uid);
  const currentFeatures = existing?.unlockedFeatures ?? [];
  const earlyUnlocks = existing?.earlyUnlocks ?? [];

  // 현재 보유하지 않은 신규 해금 기능
  const newFeatures = ageFeatures.filter((f) => !currentFeatures.includes(f));

  if (newFeatures.length === 0) return [];

  const updated: UnlockStatus = {
    uid,
    birthYear,
    unlockedFeatures: [...new Set([...currentFeatures, ...ageFeatures])],
    earlyUnlocks,
    updatedAt: Date.now(),
  };

  await saveUnlockStatus(updated);

  for (const f of newFeatures) {
    await trackEvent('feature_unlocked', { feature: f, method: 'age_auto' });
  }

  return newFeatures;
}

// ──────────────────────────────────────────────
// 미리 써보기 대화 — 조기 해금 평가
// ──────────────────────────────────────────────

export interface ReadinessResult {
  passed: boolean;
  correctCount: number;
  total: number;
  // 실패 상세는 저장하지 않음 (CLAUDE.md §19: 실패 기록 없음, 부모에게 실패 안 보임)
}

/**
 * 사용자가 선택한 답안 배열을 받아 통과 여부 평가.
 * @param dialog  대화 세트
 * @param answers 각 문항의 선택 인덱스 (0|1|2)
 */
export function evaluateReadiness(
  dialog: ReadinessDialog,
  answers: (0 | 1 | 2)[]
): ReadinessResult {
  const correctCount = dialog.questions.reduce((sum, q, i) => {
    return sum + (answers[i] === q.correctIndex ? 1 : 0);
  }, 0);

  return {
    passed: correctCount >= dialog.passThreshold,
    correctCount,
    total: dialog.questions.length,
  };
}

/**
 * 조기 해금 처리: 통과한 경우에만 저장.
 * 실패 기록은 Firestore에 남기지 않음.
 */
export async function applyEarlyUnlock(
  uid: string,
  featureId: FeatureId,
  birthYear: number
): Promise<void> {
  const existing = await loadUnlockStatus(uid);
  const currentFeatures = existing?.unlockedFeatures ?? [];
  const earlyUnlocks = existing?.earlyUnlocks ?? [];

  if (currentFeatures.includes(featureId)) return;

  const updated: UnlockStatus = {
    uid,
    birthYear,
    unlockedFeatures: [...currentFeatures, featureId],
    earlyUnlocks: [...earlyUnlocks, featureId],
    updatedAt: Date.now(),
  };

  await saveUnlockStatus(updated);
  await trackEvent('feature_unlocked', { feature: featureId, method: 'early_dialog' });
}

/** dialogId로 대화 세트 조회 */
export function getReadinessDialog(dialogId: string): ReadinessDialog | null {
  return READINESS_DIALOGS[dialogId] ?? null;
}

// ──────────────────────────────────────────────
// 부모 알림 (해금 성공 시)
// CLAUDE.md §19: "비실시간 응원 알림" — 즉시 Push 대신 In-app 메시지로 처리
// ──────────────────────────────────────────────

export async function notifyParentEarlyUnlock(
  childName: string,
  featureId: FeatureId
): Promise<void> {
  // Stage 1: Amplitude 이벤트만 발생 (실제 Push는 FCM 서버 구현 시 연동)
  // "민준이가 새 기능을 스스로 준비했어요. 응원 카드를 보내볼까요?"
  await trackEvent('feature_unlocked_parent_notify', {
    childName,
    feature: featureId,
    method: 'early_dialog',
    message: `${childName}이(가) 새 기능을 스스로 준비했어요. 응원 카드를 보내볼까요?`,
  });
}
