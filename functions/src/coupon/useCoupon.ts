import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore } from 'firebase-admin/firestore';

export const useCoupon = onCall(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Login required');

  const { uid, couponId } = request.data as { uid: string; couponId: string };
  if (request.auth.uid !== uid) {
    throw new HttpsError('permission-denied', 'Forbidden');
  }

  const db = getFirestore();
  const ref = db.collection('users').doc(uid).collection('coupons').doc(couponId);
  const snap = await ref.get();
  if (!snap.exists) throw new HttpsError('not-found', '쿠폰을 찾을 수 없습니다.');

  await ref.update({ usedAt: Date.now(), isVisible: false });
  return { success: true };
});
