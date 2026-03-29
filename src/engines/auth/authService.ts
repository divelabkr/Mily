import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { getFirebaseAuth, getFirebaseDb } from '../../lib/firebase';
import { useAuthStore, UserRole } from './authStore';
import { identify } from '../monitoring/posthogService';
import { getToken, saveToken } from '../notification/pushTokenService';

// ──────────────────────────────────────────────
// Firebase 에러 코드 → 한국어 메시지
// ──────────────────────────────────────────────

export function getAuthErrorMessage(code: string): string {
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return '이메일 또는 비밀번호가 맞지 않아요';
    case 'auth/email-already-in-use':
      return '이미 사용 중인 이메일이에요';
    case 'auth/invalid-email':
      return '이메일 형식이 맞지 않아요';
    case 'auth/weak-password':
      return '비밀번호는 6자 이상으로 만들어주세요';
    case 'auth/too-many-requests':
      return '잠시 후 다시 시도해주세요';
    case 'auth/network-request-failed':
      return '네트워크 연결을 확인해주세요';
    case 'auth/user-disabled':
      return '사용이 중단된 계정이에요';
    default:
      return '문제가 생겼어요. 다시 시도해볼까요?';
  }
}

export interface UserDoc {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  familyId?: string;
  onboardingComplete: boolean;
  planId?: string;
  createdAt: unknown;
}

// ──────────────────────────────────────────────
// Firestore 사용자 문서
// ──────────────────────────────────────────────

export async function getUserDoc(uid: string): Promise<UserDoc | null> {
  const snap = await getDoc(doc(getFirebaseDb(), 'users', uid));
  if (!snap.exists()) return null;
  return snap.data() as UserDoc;
}

export async function createUserDoc(
  uid: string,
  email: string,
  displayName: string,
  role: UserRole
): Promise<UserDoc> {
  const userDoc: UserDoc = {
    uid,
    email,
    displayName,
    role,
    onboardingComplete: false,
    createdAt: serverTimestamp(),
  };
  await setDoc(doc(getFirebaseDb(), 'users', uid), userDoc);
  return userDoc;
}

export async function updateUserDoc(
  uid: string,
  data: Partial<UserDoc>
): Promise<void> {
  await setDoc(doc(getFirebaseDb(), 'users', uid), data, { merge: true });
}

// ──────────────────────────────────────────────
// Auth 상태 감지
// ──────────────────────────────────────────────

export function initAuthListener(): () => void {
  const unsubscribe = onAuthStateChanged(
    getFirebaseAuth(),
    async (firebaseUser) => {
      const { setUser, setLoading } = useAuthStore.getState();

      if (!firebaseUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        // Custom Claims 읽기 (forceRefresh=false — 캐시 사용)
        // 마스터 부여 후 즉시 반영하려면 forceRefresh=true로 재로그인 필요
        const tokenResult = await firebaseUser.getIdTokenResult();
        const isMaster = tokenResult.claims['role'] === 'master';

        const userDoc = await getUserDoc(firebaseUser.uid);
        if (userDoc) {
          setUser({
            uid: userDoc.uid,
            email: userDoc.email,
            displayName: userDoc.displayName,
            role: userDoc.role,
            familyId: userDoc.familyId,
            onboardingComplete: userDoc.onboardingComplete,
            isMaster,
          });
          identify(userDoc.uid, { isMaster, role: userDoc.role });
          // FCM 토큰 자동 발급 + 저장 (fire-and-forget)
          getToken()
            .then((token) => { if (token) saveToken(userDoc.uid, token); })
            .catch(() => {});
        } else {
          const created = await createUserDoc(
            firebaseUser.uid,
            firebaseUser.email ?? '',
            firebaseUser.displayName ?? '',
            'individual'
          );
          setUser({
            uid: created.uid,
            email: created.email,
            displayName: created.displayName,
            role: created.role,
            onboardingComplete: false,
            isMaster,
          });
        }
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
  );

  return unsubscribe;
}

// ──────────────────────────────────────────────
// 이메일 가입
// ──────────────────────────────────────────────

export async function signUpWithEmail(
  email: string,
  password: string,
  displayName: string,
  role: UserRole
): Promise<void> {
  useAuthStore.getState().setLoading(true);
  try {
    const credential = await createUserWithEmailAndPassword(
      getFirebaseAuth(),
      email,
      password
    );
    await updateProfile(credential.user, { displayName });
    await createUserDoc(credential.user.uid, email, displayName, role);
  } finally {
    useAuthStore.getState().setLoading(false);
  }
}

// ──────────────────────────────────────────────
// 이메일 로그인
// ──────────────────────────────────────────────

export async function signInWithEmail(
  email: string,
  password: string
): Promise<void> {
  useAuthStore.getState().setLoading(true);
  try {
    await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
  } finally {
    useAuthStore.getState().setLoading(false);
  }
}

// ──────────────────────────────────────────────
// 로그아웃
// ──────────────────────────────────────────────

export async function signOut(): Promise<void> {
  await firebaseSignOut(getFirebaseAuth());
  useAuthStore.getState().setUser(null);
}

// ──────────────────────────────────────────────
// 온보딩 완료
// ──────────────────────────────────────────────

export async function completeOnboarding(uid: string): Promise<void> {
  await updateUserDoc(uid, { onboardingComplete: true });
  useAuthStore.getState().completeOnboarding();
}

// ──────────────────────────────────────────────
// 유틸
// ──────────────────────────────────────────────

export function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
