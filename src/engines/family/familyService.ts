import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  arrayUnion,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { getFirebaseDb } from '../../lib/firebase';
import { Family, FamilyMember, useFamilyStore } from './familyStore';
import { generateInviteCode } from '../auth/authService';
import { updateUserDoc } from '../auth/authService';

const INVITE_TTL_MS = 48 * 60 * 60 * 1000; // 48시간

// ──────────────────────────────────────────────
// 가족 생성 (부모)
// ──────────────────────────────────────────────

export async function createFamily(
  ownerUid: string,
  ownerName: string
): Promise<Family> {
  const familyId = `family_${ownerUid}`;
  const inviteCode = generateInviteCode();

  const family: Family = {
    familyId,
    ownerUid,
    memberUids: [ownerUid],
    members: [{ uid: ownerUid, displayName: ownerName, role: 'parent' }],
    inviteCode,
    inviteExpiresAt: Date.now() + INVITE_TTL_MS,
  };

  await setDoc(doc(getFirebaseDb(), 'families', familyId), family);
  await updateUserDoc(ownerUid, { familyId });

  useFamilyStore.getState().setFamily(family);
  return family;
}

// ──────────────────────────────────────────────
// 초대 코드로 가족 참여 (자녀)
// ──────────────────────────────────────────────

export async function joinFamilyByCode(
  childUid: string,
  childName: string,
  code: string
): Promise<Family | null> {
  const familiesRef = collection(getFirebaseDb(), 'families');
  const q = query(familiesRef, where('inviteCode', '==', code.toUpperCase()));
  const snaps = await getDocs(q);

  if (snaps.empty) return null;

  const familyDoc = snaps.docs[0];
  const family = familyDoc.data() as Family;

  // 만료 확인
  if (Date.now() > family.inviteExpiresAt) return null;
  // 이미 가입된 경우
  if (family.memberUids.includes(childUid)) return family;

  const newMember: FamilyMember = {
    uid: childUid,
    displayName: childName,
    role: 'child',
  };

  await updateDoc(doc(getFirebaseDb(), 'families', family.familyId), {
    memberUids: arrayUnion(childUid),
    members: arrayUnion(newMember),
  });

  await updateUserDoc(childUid, { familyId: family.familyId });

  const updated: Family = {
    ...family,
    memberUids: [...family.memberUids, childUid],
    members: [...family.members, newMember],
  };

  useFamilyStore.getState().setFamily(updated);
  return updated;
}

// ──────────────────────────────────────────────
// 가족 정보 로드
// ──────────────────────────────────────────────

export async function loadFamily(familyId: string): Promise<Family | null> {
  const snap = await getDoc(doc(getFirebaseDb(), 'families', familyId));
  if (!snap.exists()) return null;
  const family = snap.data() as Family;
  useFamilyStore.getState().setFamily(family);
  return family;
}

// ──────────────────────────────────────────────
// 초대 코드 갱신
// ──────────────────────────────────────────────

export async function refreshInviteCode(familyId: string): Promise<string> {
  const newCode = generateInviteCode();
  await updateDoc(doc(getFirebaseDb(), 'families', familyId), {
    inviteCode: newCode,
    inviteExpiresAt: Date.now() + INVITE_TTL_MS,
  });
  return newCode;
}
