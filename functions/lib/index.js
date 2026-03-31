"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.expireCoupons = exports.useCoupon = exports.bufferRequestCard = exports.generateWeeklyReview = void 0;
const app_1 = require("firebase-admin/app");
// firebase-admin SDK 초기화 — 모든 함수보다 먼저 실행되어야 함
// Cloud Functions v2는 자동 초기화를 보장하지 않으므로 명시적 호출 필요
(0, app_1.initializeApp)();
var weeklyReview_1 = require("./ai/weeklyReview");
Object.defineProperty(exports, "generateWeeklyReview", { enumerable: true, get: function () { return weeklyReview_1.generateWeeklyReview; } });
var requestBuffer_1 = require("./ai/requestBuffer");
Object.defineProperty(exports, "bufferRequestCard", { enumerable: true, get: function () { return requestBuffer_1.bufferRequestCard; } });
var useCoupon_1 = require("./coupon/useCoupon");
Object.defineProperty(exports, "useCoupon", { enumerable: true, get: function () { return useCoupon_1.useCoupon; } });
var expireCoupons_1 = require("./coupon/expireCoupons");
Object.defineProperty(exports, "expireCoupons", { enumerable: true, get: function () { return expireCoupons_1.expireCoupons; } });
//# sourceMappingURL=index.js.map