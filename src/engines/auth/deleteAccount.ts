import {
  doc,
  updateDoc,
  arrayRemove,
  serverTimestamp,
  getDoc,
} from 'firebase/firestore';
import { deleteUser } from 'firebase/auth';
import { getFirebaseDb, getFirebaseAuth } from '../../lib/firebase';
import { useAuthStore } from './authStore';

// ──────────────────────────────────────────────
// 탈퇴 (Soft Delete)
// 30일 후 Cloud Function이 Hard Delete 처리 (TODO 마커)
// ──────────────────────────────────────────────

export async function softDeleteAccount(uid: string): Promise<void> {
  // 1. users/{uid} soft delete
  await updateDoc(doc(getFirebaseDb(), 'users', uid), {
    deletedAt: serverTimestamp(),
    email: '[deleted]',
    displayName: '[deleted]',
  });

  // 2. 가족에서 제거
  const userSnap = await getDoc(doc(getFirebaseDb(), 'users', uid));
  if (userSnap.exists()) {
    const userData = userSnap.data();
    if (userData.familyId) {
      await removeMemberFromFamily(uid, userData.familyId);
    }
  }

  // 3. Firebase Auth 계정 삭제
  const currentUser = getFirebaseAuth().currentUser;
  if (currentUser) {
    await deleteUser(currentUser);
  }

  useAuthStore.getState().setUser(null);
  // TODO: Cloud Function scheduleHardDelete(uid, 30 days)
}

// ──────────────────────────────────────────────
// 가족 연결 해제
// ──────────────────────────────────────────────

export async function removeMemberFromFamily(
  uid: string,
  familyId: string
): Promise<void> {
  const familyRef = doc(getFirebaseDb(), 'families', familyId);
  const snap = await getDoc(familyRef);
  if (!snap.exists()) return;

  const family = snap.data();
  const updatedMembers = (family.members as { uid: string }[]).filter(
    (m) => m.uid !== uid
  );

  await updateDoc(familyRef, {
    memberUids: arrayRemove(uid),
    members: updatedMembers,
  });

  await updateDoc(doc(getFirebaseDb(), 'users', uid), {
    familyId: null,
  });
}
