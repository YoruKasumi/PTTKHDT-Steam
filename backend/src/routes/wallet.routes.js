'use strict';
const express = require('express');
const { authenticate, authorize } = require('../middlewares/auth');
const asyncHandler = require('../utils/asyncHandler');
const requestContext = require('../utils/requestContext');
const { ok } = require('../utils/response');
const { walletService } = require('../services');

const router = express.Router();

// ─── RESTful Endpoints (dùng cho frontend api/wallet.js) ─────────────────────

/** GET /api/wallet — Xem số dư ví */
router.get(
  '/',
  authenticate,
  authorize('Customer'),
  asyncHandler(async (req, res) => ok(res, await walletService.yeuCauXemSoDu(requestContext(req)))),
);

/** POST /api/wallet/deposit — Nạp tiền vào ví */
router.post(
  '/deposit',
  authenticate,
  authorize('Customer'),
  asyncHandler(async (req, res) => ok(res, await walletService.guiYeuCauNapTien(requestContext(req)), 200, 'Nạp tiền thành công')),
);

/** POST /api/wallet/withdraw — Rút tiền từ ví */
router.post(
  '/withdraw',
  authenticate,
  authorize('Customer'),
  asyncHandler(async (req, res) => ok(res, await walletService.guiYeuCauRutTien(requestContext(req)), 200, 'Rút tiền thành công')),
);

/** GET /api/wallet/transactions — Xem lịch sử biến động số dư ví */
router.get(
  '/transactions',
  authenticate,
  authorize('Customer'),
  asyncHandler(async (req, res) => ok(res, await walletService.yeuCauXemLichSuGiaoDich(requestContext(req)))),
);

// ─── Legacy Endpoints (giữ nguyên tương thích sơ đồ sequence) ────────────────

/** UC12. Xem số dư ví (#2)  | quyền: Customer */
router.get(
  '/yeuCauXemSoDu',
  authenticate,
  authorize('Customer'),
  asyncHandler(async (req, res) => ok(res, await walletService.yeuCauXemSoDu(requestContext(req)))),
);

/** UC13. Nạp tiền vào ví (#2)  | quyền: Customer */
router.post(
  '/guiYeuCauNapTien',
  authenticate,
  authorize('Customer'),
  asyncHandler(async (req, res) => ok(res, await walletService.guiYeuCauNapTien(requestContext(req)))),
);

/** UC14. Rút tiền (#2)  | quyền: Customer */
router.post(
  '/guiYeuCauRutTien',
  authenticate,
  authorize('Customer'),
  asyncHandler(async (req, res) => ok(res, await walletService.guiYeuCauRutTien(requestContext(req)))),
);

/** UC15. Thanh toán (#15)  | quyền: Customer */
router.post(
  '/chuyenHuongNapTien',
  authenticate,
  authorize('Customer'),
  asyncHandler(async (req, res) => ok(res, await walletService.chuyenHuongNapTien(requestContext(req)))),
);

/** UC20. Xem lịch sử giao dịch (#2)  | quyền: Customer */
router.get(
  '/yeuCauXemLichSuGiaoDich',
  authenticate,
  authorize('Customer'),
  asyncHandler(async (req, res) => ok(res, await walletService.yeuCauXemLichSuGiaoDich(requestContext(req)))),
);

/** UC20. Xem lịch sử giao dịch (#8)  | quyền: Customer */
router.get(
  '/yeuCauXemChiTiet',
  authenticate,
  authorize('Customer'),
  asyncHandler(async (req, res) => ok(res, await walletService.yeuCauXemChiTiet(requestContext(req)))),
);

/** UC20. Xem lịch sử giao dịch (#14)  | quyền: Customer */
router.post(
  '/guiTieuChiTimKiem',
  authenticate,
  authorize('Customer'),
  asyncHandler(async (req, res) => ok(res, await walletService.guiTieuChiTimKiem(requestContext(req)))),
);

module.exports = router;
