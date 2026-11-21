'use strict';
const express = require('express');
const { authenticate, authorize } = require('../middlewares/auth');
const upload = require('../middlewares/upload');
const asyncHandler = require('../utils/asyncHandler');
const requestContext = require('../utils/requestContext');
const { ok } = require('../utils/response');
const { catalogService } = require('../services');

const router = express.Router();

/** UC6. Tìm kiếm sản phẩm (#2)  | công khai */
router.post('/guiYeuCauTimKiem', asyncHandler(async (req, res) => ok(res, await catalogService.guiYeuCauTimKiem(requestContext(req)))));

/** UC6. Tìm kiếm sản phẩm (#8)  | công khai */
router.post('/yeuCauLocTheoTheLoai', asyncHandler(async (req, res) => ok(res, await catalogService.yeuCauLocTheoTheLoai(requestContext(req)))));

/** UC6. Tìm kiếm sản phẩm (#11)  | công khai */
router.post('/yeuCauLocTheoKhoangGia', asyncHandler(async (req, res) => ok(res, await catalogService.yeuCauLocTheoKhoangGia(requestContext(req)))));

/** UC6. Tìm kiếm sản phẩm (#14)  | công khai */
router.post('/yeuCauLocTheoTrangThaiSale', asyncHandler(async (req, res) => ok(res, await catalogService.yeuCauLocTheoTrangThaiSale(requestContext(req)))));

/** UC6. Tìm kiếm sản phẩm (#20)  | công khai */
router.post('/sapXepTheoNgayPhatHanh', asyncHandler(async (req, res) => ok(res, await catalogService.sapXepTheoNgayPhatHanh(requestContext(req)))));

/** UC6. Tìm kiếm sản phẩm (#23)  | công khai */
router.post('/sapXepTheoDoPhoBien', asyncHandler(async (req, res) => ok(res, await catalogService.sapXepTheoDoPhoBien(requestContext(req)))));

/** UC6. Tìm kiếm sản phẩm (#26)  | công khai */
router.post('/sapXepTheoGia', asyncHandler(async (req, res) => ok(res, await catalogService.sapXepTheoGia(requestContext(req)))));

/** UC7. Xem chi tiết sản phẩm (#2)  | công khai */
router.get('/yeuCauXemChiTietSanPham', asyncHandler(async (req, res) => ok(res, await catalogService.yeuCauXemChiTietSanPham(requestContext(req)))));

router.get('/games', asyncHandler(async (req, res) => (
  ok(res, await catalogService.listGames(requestContext(req)))
)));

router.get('/games/:gameId', asyncHandler(async (req, res) => (
  ok(res, await catalogService.getGameDetails(requestContext(req)))
)));

router.post('/games/:gameId/reviews', authenticate, authorize('Customer'), asyncHandler(async (req, res) => (
  ok(res, await catalogService.createReview(requestContext(req)), 201, 'Review created')
)));

module.exports = router;
