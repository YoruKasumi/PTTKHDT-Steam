'use strict';
const express = require('express');
const { authenticate, authorize } = require('../middlewares/auth');
const asyncHandler = require('../utils/asyncHandler');
const requestContext = require('../utils/requestContext');
const { ok } = require('../utils/response');
const { orderService } = require('../services');

const router = express.Router();

/** Lấy danh sách đơn hàng đã mua */
router.get('/layDanhSachDonHang', authenticate, authorize('Customer'), asyncHandler(async (req, res) => (
  ok(res, await orderService.layDanhSachDonHang(requestContext(req)))
)));

/** UC15. Kiểm tra mã giảm giá / Xem trước thanh toán (#4)  | quyền: Customer */
router.post('/kiemTraMaGiamGia', authenticate, authorize('Customer'), asyncHandler(async (req, res) => (
  ok(res, await orderService.kiemTraMaGiamGia(requestContext(req)))
)));

/** UC15. Thanh toán đơn hàng (#2)  | quyền: Customer */
router.post('/yeuCauThanhToan', authenticate, authorize('Customer'), asyncHandler(async (req, res) => (
  ok(res, await orderService.yeuCauThanhToan(requestContext(req)), 201, 'Thanh toán thành công')
)));

/** UC21. Yêu cầu hoàn tiền đơn hàng (#2)  | quyền: Customer */
router.post('/guiYeuCauHoanTien', authenticate, authorize('Customer'), asyncHandler(async (req, res) => (
  ok(res, await orderService.guiYeuCauHoanTien(requestContext(req)), 200, 'Hoàn tiền thành công')
)));

module.exports = router;
