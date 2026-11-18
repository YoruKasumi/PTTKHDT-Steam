'use strict';
const express = require('express');
const { authenticate, authorize } = require('../middlewares/auth');
const upload = require('../middlewares/upload');
const asyncHandler = require('../utils/asyncHandler');
const requestContext = require('../utils/requestContext');
const { ok } = require('../utils/response');
const { orderService } = require('../services');

const router = express.Router();

/** UC15. Thanh toán (#2)  | quyền: Customer */
router.post('/yeuCauThanhToan', authenticate, authorize('Customer'), asyncHandler(async (req, res) => ok(res, await orderService.yeuCauThanhToan(requestContext(req)))));

/** UC15. Thanh toán (#4)  | quyền: Customer */
router.post('/kiemTraMaGiamGia', authenticate, authorize('Customer'), asyncHandler(async (req, res) => ok(res, await orderService.kiemTraMaGiamGia(requestContext(req)))));

/** UC21. Yêu cầu hoàn tiền (#2)  | quyền: Customer */
router.post('/guiYeuCauHoanTien', authenticate, authorize('Customer'), asyncHandler(async (req, res) => ok(res, await orderService.guiYeuCauHoanTien(requestContext(req)))));

module.exports = router;
