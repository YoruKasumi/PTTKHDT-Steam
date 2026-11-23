'use strict';
const express = require('express');
const { authenticate, authorize } = require('../middlewares/auth');
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

/** Lấy danh sách game đã duyệt */
router.get('/layDanhSachGame', asyncHandler(async (req, res) => (
  ok(res, await catalogService.layDanhSachGame(requestContext(req)))
)));

/** Gửi đánh giá game */
router.post('/taoDanhGia', authenticate, authorize('Customer'), asyncHandler(async (req, res) => (
  ok(res, await catalogService.taoDanhGia(requestContext(req)), 201, 'Review created')
)));

router.put('/capNhatDanhGia/:reviewId', authenticate, authorize('Customer'), asyncHandler(async (req, res) => (
  ok(res, await catalogService.updateReview({ ...requestContext(req), reviewId: req.params.reviewId }))
)));
router.delete('/xoaDanhGia/:reviewId', authenticate, authorize('Customer'), asyncHandler(async (req, res) => (
  ok(res, await catalogService.deleteReview({ ...requestContext(req), reviewId: req.params.reviewId }))
)));

module.exports = router;
