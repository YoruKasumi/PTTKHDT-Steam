'use strict';
const express = require('express');
const { authenticate, authorize } = require('../middlewares/auth');
const asyncHandler = require('../utils/asyncHandler');
const requestContext = require('../utils/requestContext');
const { ok } = require('../utils/response');
const { cartService } = require('../services');

const router = express.Router();

/** UC8. Xem giỏ hàng (#2)  | quyền: Customer */
router.get('/yeuCauXemGioHang', authenticate, authorize('Customer'), asyncHandler(async (req, res) => (
  ok(res, await cartService.yeuCauXemGioHang(requestContext(req)))
)));

/** UC9. Thêm game vào giỏ hàng (#2)  | quyền: Customer */
router.post('/yeuCauThemSanPham', authenticate, authorize('Customer'), asyncHandler(async (req, res) => (
  ok(res, await cartService.yeuCauThemSanPham(requestContext(req)), 201, 'Đã thêm vào giỏ hàng')
)));

/** UC10. Xóa game khỏi giỏ hàng (#2)  | quyền: Customer */
router.post('/yeuCauXoaSanPham', authenticate, authorize('Customer'), asyncHandler(async (req, res) => (
  ok(res, await cartService.yeuCauXoaSanPham(requestContext(req)))
)));

module.exports = router;
