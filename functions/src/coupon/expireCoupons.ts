import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore } from 'firebase-admin/firestore';

export const expireCoupons = onCall(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Login required');

  const { uid } = request.data as { uid: string };
  if (request.auth.uid !== uid) {
    throw new HttpsError('permission-denied', 'Forbidden');
  }

  const db = getFirestore();
  const snap = await db.collection('users').doc(uid).collection('coupons').get();
  const now = Date.now();

  const updates: Promise<FirebaseFirestore.WriteResult>[] = [];
  snap.forEach((d) => {
    const data = d.data();
    if (data.isVisible && !data.usedAt && data.expiresAt <= now) {
      updates.push(d.ref.update({ isVisible: false }));
    }
  });

  await Promise.all(updates);
  return { expired: updates.length };
});
