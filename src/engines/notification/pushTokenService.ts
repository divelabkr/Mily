import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { doc, setDoc, updateDoc, getDoc, deleteField } from 'firebase/firestore';
import { getFirebaseDb } from '../../lib/firebase';

// ──────────────────────────────────────────────
// 알림 권한 요청
// ──────────────────────────────────────────────

export async function requestPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

// ──────────────────────────────────────────────
// FCM 토큰 발급
// ──────────────────────────────────────────────

export async function getToken(): Promise<string | null> {
  try {
    if (Platform.OS === 'web') return null;

    const granted = await requestPermission();
    if (!granted) return null;

    const tokenData = await Notifications.getDevicePushTokenAsync();
    return typeof tokenData.data === 'string' ? tokenData.data : null;
  } catch {
    return null;
  }
}

// ──────────────────────────────────────────────
// Firestore에 토큰 저장
// ──────────────────────────────────────────────

export async function saveToken(uid: string, token: string): Promise<void> {
  const userRef = doc(getFirebaseDb(), 'users', uid);
  const snap = await getDoc(userRef);
  const existing = snap.exists() ? (snap.data() as Record<string, unknown>).fcmToken : null;

  // 기존 토큰과 같으면 스킵
  if (existing === token) return;

  await setDoc(userRef, { fcmToken: token }, { merge: true });
}

// ──────────────────────────────────────────────
// 로그아웃 시 토큰 삭제
// ──────────────────────────────────────────────

export async function deleteToken(uid: string): Promise<void> {
  const userRef = doc(getFirebaseDb(), 'users', uid);
  await updateDoc(userRef, { fcmToken: deleteField() });
}
