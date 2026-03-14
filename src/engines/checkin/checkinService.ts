import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { getFirebaseDb } from '../../lib/firebase';
import { CheckIn, useCheckInStore } from './checkinStore';
import { getWeekId } from '../../utils/dateUtils';

// ──────────────────────────────────────────────
// Firestore 경로: checkins/{uid}/{weekId}/{docId}
// ──────────────────────────────────────────────

export async function saveCheckIn(
  checkIn: Omit<CheckIn, 'checkInId' | 'createdAt'>
): Promise<CheckIn> {
  const weekId = checkIn.weekId || getWeekId();
  const colRef = collection(getFirebaseDb(), 'checkins', checkIn.uid, weekId);

  const docRef = await addDoc(colRef, {
    ...checkIn,
    weekId,
    createdAt: serverTimestamp(),
  });

  const saved: CheckIn = {
    ...checkIn,
    checkInId: docRef.id,
    weekId,
    createdAt: Date.now(),
  };

  useCheckInStore.getState().addCheckIn(saved);
  return saved;
}

export async function loadWeeklyCheckIns(
  uid: string,
  weekId?: string
): Promise<CheckIn[]> {
  const targetWeekId = weekId ?? getWeekId();
  const colRef = collection(getFirebaseDb(), 'checkins', uid, targetWeekId);
  const q = query(colRef, orderBy('createdAt', 'asc'));
  const snaps = await getDocs(q);

  const checkIns: CheckIn[] = snaps.docs.map((d) => ({
    ...(d.data() as Omit<CheckIn, 'checkInId'>),
    checkInId: d.id,
  }));

  useCheckInStore.getState().setWeeklyCheckIns(checkIns);
  return checkIns;
}
