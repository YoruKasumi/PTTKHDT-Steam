'use strict';
const express = require('express');
const { authenticate, authorize } = require('../middlewares/auth');
const upload = require('../middlewares/upload');
const asyncHandler = require('../utils/asyncHandler');
const requestContext = require('../utils/requestContext');
const { ok } = require('../utils/response');
const { reportService } = require('../services');

const router = express.Router();

/** UC30. Báo cáo doanh thu real-time (#2)  | quyền: Developer */
router.get('/yeuCauBaoCaoDoanhThuRealTime', authenticate, authorize('Developer'), asyncHandler(async (req, res) => ok(res, await reportService.yeuCauBaoCaoDoanhThuRealTime(requestContext(req)))));

/** UC31. Kết xuất bảng kê đối soát (#2)  | quyền: Developer */
router.get('/yeuCauKetXuatBangKe', authenticate, authorize('Developer'), asyncHandler(async (req, res) => ok(res, await reportService.yeuCauKetXuatBangKe(requestContext(req)))));

/** UC32. Thống kê Wishlist & Refund (#2)  | quyền: Developer */
router.get('/yeuCauThongKeTuongTac', authenticate, authorize('Developer'), asyncHandler(async (req, res) => ok(res, await reportService.yeuCauThongKeTuongTac(requestContext(req)))));

module.exports = router;
