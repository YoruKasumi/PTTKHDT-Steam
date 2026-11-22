'use strict';
const express = require('express');
const { authenticate, authorize, requirePermission } = require('../middlewares/auth');
const upload = require('../middlewares/upload');
const asyncHandler = require('../utils/asyncHandler');
const requestContext = require('../utils/requestContext');
const { ok } = require('../utils/response');
const { withdrawalService } = require('../services');

const router = express.Router();

/** UC33. Rút doanh thu về ngân hàng (#2)  | quyền: Developer */
router.post('/guiYeuCauRutDoanhThu', authenticate, authorize('Developer'), asyncHandler(async (req, res) => ok(res, await withdrawalService.guiYeuCauRutDoanhThu(requestContext(req)))));

router.get('/myRequests', authenticate, authorize('Developer'), asyncHandler(async (req, res) => (
  ok(res, await withdrawalService.yeuCauXemLichSuRutTien(requestContext(req)))
)));

/** UC57. Phê duyệt rút doanh thu (#2)  | quyền: Admin, Manager */
router.post('/layChiTietLenhRutTien', authenticate, authorize('Admin', 'Manager'), requirePermission('withdrawal.approve'), asyncHandler(async (req, res) => ok(res, await withdrawalService.layChiTietLenhRutTien(requestContext(req)))));

/** UC57. Phê duyệt rút doanh thu (#7)  | quyền: Admin, Manager */
router.post('/guiYeuCauTuChoi', authenticate, authorize('Admin', 'Manager'), requirePermission('withdrawal.approve'), asyncHandler(async (req, res) => ok(res, await withdrawalService.guiYeuCauTuChoi(requestContext(req)))));

/** UC57. Phê duyệt rút doanh thu (#13)  | quyền: Admin, Manager */
router.post('/guiYeuCauChuyenKhoan', authenticate, authorize('Admin', 'Manager'), requirePermission('withdrawal.approve'), asyncHandler(async (req, res) => ok(res, await withdrawalService.guiYeuCauChuyenKhoan(requestContext(req)))));

module.exports = router;
