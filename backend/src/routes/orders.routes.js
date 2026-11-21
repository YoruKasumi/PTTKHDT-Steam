'use strict';
const express = require('express');
const { authenticate, authorize } = require('../middlewares/auth');
const asyncHandler = require('../utils/asyncHandler');
const requestContext = require('../utils/requestContext');
const { ok } = require('../utils/response');
const { orderService } = require('../services');

const router = express.Router();

router.get('/', authenticate, authorize('Customer'), asyncHandler(async (req, res) => (
  ok(res, await orderService.yeuCauXemDonHang(requestContext(req)))
)));

router.post('/preview', authenticate, authorize('Customer'), asyncHandler(async (req, res) => (
  ok(res, await orderService.preview(requestContext(req)))
)));

router.post('/checkout', authenticate, authorize('Customer'), asyncHandler(async (req, res) => (
  ok(res, await orderService.checkout(requestContext(req)), 201, 'Thanh toán thành công')
)));

router.post('/:orderId/refund', authenticate, authorize('Customer'), asyncHandler(async (req, res) => (
  ok(res, await orderService.guiYeuCauHoanTien(requestContext(req)), 200, 'Hoàn tiền thành công')
)));

module.exports = router;
