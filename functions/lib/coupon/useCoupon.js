"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useCoupon = void 0;
const https_1 = require("firebase-functions/v2/https");
const firestore_1 = require("firebase-admin/firestore");
exports.useCoupon = (0, https_1.onCall)(async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const { uid, couponId } = request.data;
    if (request.auth.uid !== uid) {
        throw new https_1.HttpsError('permission-denied', 'Forbidden');
    }
    const db = (0, firestore_1.getFirestore)('default-ver1');
    const ref = db.collection('users').doc(uid).collection('coupons').doc(couponId);
    const snap = await ref.get();
    if (!snap.exists)
        throw new https_1.HttpsError('not-found', '쿠폰을 찾을 수 없습니다.');
    await ref.update({ usedAt: Date.now(), isVisible: false });
    return { success: true };
});
//# sourceMappingURL=useCoupon.js.map