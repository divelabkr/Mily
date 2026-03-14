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
