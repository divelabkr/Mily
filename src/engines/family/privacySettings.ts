import { doc, setDoc, getDoc } from 'firebase/firestore';
import { getFirebaseDb } from '../../lib/firebase';
import { CategoryId } from '../plan/defaultCategories';

export interface PrivacySettings {
  childUid: string;
  familyId: string;
  sharedCategories: CategoryId[];
  shareReview: boolean;
}

// 기본값: 전부 off. 자녀가 켜야 부모에게 보임.
export function defaultPrivacySettings(
  childUid: string,
  familyId: string
): PrivacySettings {
  return {
    childUid,
    familyId,
    sharedCategories: [],
    shareReview: false,
  };
}

export async function savePrivacySettings(
  settings: PrivacySettings
): Promise<void> {
  const ref = doc(
    getFirebaseDb(),
    'families',
    settings.familyId,
    'privacySettings',
    settings.childUid
  );
  await setDoc(ref, settings, { merge: true });
}

export async function loadPrivacySettings(
  familyId: string,
  childUid: string
): Promise<PrivacySettings> {
  const ref = doc(
    getFirebaseDb(),
    'families',
    familyId,
    'privacySettings',
    childUid
  );
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    return defaultPrivacySettings(childUid, familyId);
  }
  return snap.data() as PrivacySettings;
}
