import { doc, getDoc } from 'firebase/firestore';
import { getFirebaseDb } from '../../lib/firebase';
import { useBillingStore } from './billingStore';

// ──────────────────────────────────────────────
// 파일럿 참가자 확인 및 Plus 기능 무료 해제
// pilots/{pilotId} 는 Firestore Console에서만 관리
// ──────────────────────────────────────────────

export async function applyPilotOverride(
  uid: string,
  pilotId: string
): Promise<boolean> {
  try {
    const snap = await getDoc(doc(getFirebaseDb(), 'pilots', pilotId));
    if (!snap.exists()) return false;

    const data = snap.data();
    // pilots 문서에 memberUids 배열이 있거나 open 플래그인 경우
    const isEligible =
      data.open === true ||
      (Array.isArray(data.memberUids) && data.memberUids.includes(uid));

    if (isEligible) {
      const current = useBillingStore.getState().subscription;
      useBillingStore.getState().setSubscription({ ...current, pilotId });
    }

    return isEligible;
  } catch {
    return false;
  }
}

export function clearPilotOverride(): void {
  const current = useBillingStore.getState().subscription;
  useBillingStore.getState().setSubscription({ ...current, pilotId: null });
}
