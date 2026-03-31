"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.expireCoupons = void 0;
const https_1 = require("firebase-functions/v2/https");
const firestore_1 = require("firebase-admin/firestore");
exports.expireCoupons = (0, https_1.onCall)(async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const { uid } = request.data;
    if (request.auth.uid !== uid) {
        throw new https_1.HttpsError('permission-denied', 'Forbidden');
    }
    const db = (0, firestore_1.getFirestore)('default-ver1');
    const snap = await db.collection('users').doc(uid).collection('coupons').get();
    const now = Date.now();
    const updates = [];
    snap.forEach((d) => {
        const data = d.data();
        if (data.isVisible && !data.usedAt && data.expiresAt <= now) {
            updates.push(d.ref.update({ isVisible: false }));
        }
    });
    await Promise.all(updates);
    return { expired: updates.length };
});
//# sourceMappingURL=expireCoupons.js.map