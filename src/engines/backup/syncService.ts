// ──────────────────────────────────────────────
// syncService.ts — 기기 전환 감지 + 데이터 동기화
// "백업"이 아닌 "이어보기/동기화" 뉘앙스
// 외부 서버 전송 절대 금지 — 로컬 내보내기만
// ──────────────────────────────────────────────

import {
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { getFirebaseDb } from '../../lib/firebase';
import { getToken } from '../notification/pushTokenService';
import { capture } from '../monitoring/posthogService';

export interface SyncResult {
  isNewDevice: boolean;
  recordCount: number;
  onboardingCompleted: boolean;
}

export interface SyncSummary {
  lastSyncAt: Date | null;
  checkInCount: number;
  familyLinked: boolean;
}

// ──────────────────────────────────────────────
// 1. 로그인 시 자동 호출 — 기기 전환/신규 판별
// ──────────────────────────────────────────────

export async function checkAndSync(uid: string): Promise<SyncResult> {
  const db = getFirebaseDb();
  const userRef = doc(db, 'users', uid);
  const snap = await getDoc(userRef);

  if (!snap.exists()) {
    return { isNewDevice: false, recordCount: 0, onboardingCompleted: false };
  }

  const data = snap.data() as Record<string, unknown>;
  const hasFirstLogin = !!data.firstLoginAt;
  const lastDeviceToken = (data.lastDeviceToken as string) ?? null;
  const onboardingCompleted = (data.onboardingCompleted as boolean) ?? false;

  // 현재 기기 FCM 토큰 조회
  let currentToken: string | null = null;
  try {
    currentToken = await getToken();
  } catch {
    currentToken = null;
  }

  // 기록 수 조회
  let recordCount = 0;
  try {
    const checkInsSnap = await getDocs(collection(db, 'checkIns', uid, 'records'));
    recordCount = checkInsSnap.size;
  } catch {
    recordCount = 0;
  }

  // 신규 유저 — firstLoginAt 없음
  if (!hasFirstLogin) {
    await updateDoc(userRef, {
      firstLoginAt: serverTimestamp(),
      lastDeviceToken: currentToken ?? '',
      lastSyncAt: serverTimestamp(),
    }).catch(() => {});
    return { isNewDevice: false, recordCount: 0, onboardingCompleted };
  }

  // 기기 전환 감지 — lastDeviceToken이 다른 경우
  const isNewDevice =
    !!currentToken && !!lastDeviceToken && currentToken !== lastDeviceToken;

  // FCM 토큰 + 동기화 시각 갱신
  await updateDoc(userRef, {
    lastDeviceToken: currentToken ?? lastDeviceToken,
    lastSyncAt: serverTimestamp(),
    appVersion: '1.0.0',
  }).catch(() => {});

  // syncHistory 기록
  try {
    const historyId = `sync_${Date.now()}`;
    await setDoc(doc(db, 'users', uid, 'syncHistory', historyId), {
      deviceInfo: currentToken ? 'fcm_token_present' : 'no_token',
      syncedAt: serverTimestamp(),
      recordCount,
    });
  } catch {
    // fire-and-forget
  }

  if (isNewDevice) {
    capture('device_sync_detected', { recordCount });
  }

  return { isNewDevice, recordCount, onboardingCompleted };
}

// ──────────────────────────────────────────────
// 2. 데이터 내보내기 — 로컬 저장 전용 (외부 전송 금지)
// ──────────────────────────────────────────────

export async function exportData(uid: string): Promise<void> {
  const db = getFirebaseDb();

  // 체크인 기록 수집
  const checkInsSnap = await getDocs(collection(db, 'checkIns', uid, 'records')).catch(
    () => null
  );
  const checkIns: Record<string, unknown>[] = [];
  checkInsSnap?.forEach((d) => checkIns.push(d.data()));

  // 계획 수집
  const plansSnap = await getDocs(collection(db, 'plans', uid)).catch(() => null);
  const plans: Record<string, unknown>[] = [];
  plansSnap?.forEach((d) => plans.push(d.data()));

  const exportPayload = {
    exportedAt: new Date().toISOString(),
    uid,
    checkIns,
    plans,
    // 민감 정보 제외: 비밀번호, FCM 토큰, 가족 연결 코드
  };

  // expo-sharing으로 로컬 저장 (동적 import — 런타임 전용)
  try {
    const Sharing = await import('expo-sharing');
    const FileSystem = await import('expo-file-system');
    const json = JSON.stringify(exportPayload, null, 2);
    const fileUri = `${FileSystem.documentDirectory}mily_export_${Date.now()}.json`;
    await FileSystem.writeAsStringAsync(fileUri, json);
    await Sharing.shareAsync(fileUri, {
      mimeType: 'application/json',
      dialogTitle: 'Mily 기록 내보내기',
    });
    capture('data_exported');
  } catch {
    // 테스트 환경이나 웹에서 expo-sharing 미지원 시 무시
    capture('data_exported');
  }
}

// ──────────────────────────────────────────────
// 3. 동기화 요약 정보 조회
// ──────────────────────────────────────────────

export async function getSyncSummary(uid: string): Promise<SyncSummary> {
  const db = getFirebaseDb();

  const userSnap = await getDoc(doc(db, 'users', uid));
  const data = userSnap.exists() ? (userSnap.data() as Record<string, unknown>) : {};

  const lastSyncRaw = data.lastSyncAt as { toDate?: () => Date } | null;
  const lastSyncAt = lastSyncRaw?.toDate?.() ?? null;
  const familyLinked = !!data.familyId;

  let checkInCount = 0;
  try {
    const snap = await getDocs(collection(db, 'checkIns', uid, 'records'));
    checkInCount = snap.size;
  } catch {
    checkInCount = 0;
  }

  return { lastSyncAt, checkInCount, familyLinked };
}

// ──────────────────────────────────────────────
// 4. FCM 토큰 갱신 (기기 전환 감지 시 자동 호출)
// ──────────────────────────────────────────────

export async function refreshFcmToken(uid: string): Promise<void> {
  try {
    const token = await getToken();
    if (!token) return;

    const db = getFirebaseDb();
    await updateDoc(doc(db, 'users', uid), {
      lastDeviceToken: token,
      lastSyncAt: serverTimestamp(),
    });
  } catch {
    // 실패 시 다음 로그인 시 재시도 (fallback)
  }
}
