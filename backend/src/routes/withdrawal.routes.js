'use strict';
const express = require('express');
const { authenticate, authorize } = require('../middlewares/auth');
const asyncHandler = require('../utils/asyncHandler');
const requestContext = require('../utils/requestContext');
const { ok } = require('../utils/response');
const { withdrawalService } = require('../services');

const router = express.Router();

/** UC33. Rút doanh thu về ngân hàng (#2)  | quyền: Developer */
router.post('/guiYeuCauRutDoanhThu', authenticate, authorize('Developer'), asyncHandler(async (req, res) => ok(res, await withdrawalService.guiYeuCauRutDoanhThu(requestContext(req)))));

/** Lấy danh sách lịch sử yêu cầu rút tiền của NPH */
router.get('/layDanhSachYeuCauRutTien', authenticate, authorize('Developer'), asyncHandler(async (req, res) => (
  ok(res, await withdrawalService.layDanhSachYeuCauRutTien(requestContext(req)))
)));

module.exports = router;
