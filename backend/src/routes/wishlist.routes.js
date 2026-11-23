'use strict';
const express = require('express');
const { authenticate, authorize } = require('../middlewares/auth');
const asyncHandler = require('../utils/asyncHandler');
const requestContext = require('../utils/requestContext');
const { ok } = require('../utils/response');
const { wishlistService } = require('../services');

const router = express.Router();

/** Lấy danh sách Wishlist */
router.get('/layDanhSachWishlist', authenticate, authorize('Customer'), asyncHandler(async (req, res) => (
  ok(res, await wishlistService.yeuCauXemWishlist(requestContext(req)))
)));

/** UC11. Thêm vào Wishlist (#2)  | quyền: Customer */
router.post('/yeuCauThemWishlist', authenticate, authorize('Customer'), asyncHandler(async (req, res) => (
  ok(res, await wishlistService.yeuCauThemWishlist(requestContext(req)), 201, 'Đã thêm vào Wishlist')
)));

/** UC11. Xóa khỏi Wishlist (#13)  | quyền: Customer */
router.post('/yeuCauXoaWishlist', authenticate, authorize('Customer'), asyncHandler(async (req, res) => (
  ok(res, await wishlistService.yeuCauXoaWishlist(requestContext(req)))
)));

module.exports = router;
