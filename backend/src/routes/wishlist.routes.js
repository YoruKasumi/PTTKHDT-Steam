'use strict';
const express = require('express');
const { authenticate, authorize } = require('../middlewares/auth');
const upload = require('../middlewares/upload');
const asyncHandler = require('../utils/asyncHandler');
const requestContext = require('../utils/requestContext');
const { ok } = require('../utils/response');
const { wishlistService } = require('../services');

const router = express.Router();

router.get('/', authenticate, authorize('Customer'), asyncHandler(async (req, res) => (
  ok(res, await wishlistService.yeuCauXemWishlist(requestContext(req)))
)));

router.post('/', authenticate, authorize('Customer'), asyncHandler(async (req, res) => (
  ok(res, await wishlistService.yeuCauThemWishlist(requestContext(req)), 201, 'Đã thêm vào Wishlist')
)));

router.delete('/:gameId', authenticate, authorize('Customer'), asyncHandler(async (req, res) => (
  ok(res, await wishlistService.yeuCauXoaWishlist(requestContext(req)))
)));

/** UC11. Quản lý Wishlist (#2)  | quyền: Customer */
router.post('/yeuCauThemWishlist', authenticate, authorize('Customer'), asyncHandler(async (req, res) => ok(res, await wishlistService.yeuCauThemWishlist(requestContext(req)))));

/** UC11. Quản lý Wishlist (#13)  | quyền: Customer */
router.post('/yeuCauXoaWishlist', authenticate, authorize('Customer'), asyncHandler(async (req, res) => ok(res, await wishlistService.yeuCauXoaWishlist(requestContext(req)))));

module.exports = router;
