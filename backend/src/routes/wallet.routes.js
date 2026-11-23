'use strict';
const express = require('express');
const { authenticate, authorize } = require('../middlewares/auth');
const asyncHandler = require('../utils/asyncHandler');
const requestContext = require('../utils/requestContext');
const { ok } = require('../utils/response');
const { walletService } = require('../services');

const router = express.Router();

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
  asyncHandler(async (req, res) => ok(res, await walletService.guiYeuCauNapTien(requestContext(req)), 200, 'Nạp tiền thành công')),
);

/** UC14. Rút tiền từ ví (#2)  | quyền: Customer */
router.post(
  '/guiYeuCauRutTien',
  authenticate,
  authorize('Customer'),
  asyncHandler(async (req, res) => ok(res, await walletService.guiYeuCauRutTien(requestContext(req)), 200, 'Rút tiền thành công')),
);

/** UC20. Xem lịch sử biến động số dư (#2)  | quyền: Customer */
router.get(
  '/yeuCauXemLichSuGiaoDich',
  authenticate,
  authorize('Customer'),
  asyncHandler(async (req, res) => ok(res, await walletService.yeuCauXemLichSuGiaoDich(requestContext(req)))),
);

module.exports = router;
