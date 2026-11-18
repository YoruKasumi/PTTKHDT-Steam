'use strict';
const express = require('express');
const { authenticate, authorize } = require('../middlewares/auth');
const upload = require('../middlewares/upload');
const asyncHandler = require('../utils/asyncHandler');
const requestContext = require('../utils/requestContext');
const { ok } = require('../utils/response');
const { moderationService } = require('../services');

const router = express.Router();

/** UC38. Kiểm tra thông tin game mới (#2)  | quyền: Admin, Manager */
router.get('/yeuCauLayHoSoGameChoDuyet', authenticate, authorize('Admin', 'Manager'), asyncHandler(async (req, res) => ok(res, await moderationService.yeuCauLayHoSoGameChoDuyet(requestContext(req)))));

/** UC38. Kiểm tra thông tin game mới (#7)  | quyền: Admin, Manager */
router.post('/layChiTietHoSoGame', authenticate, authorize('Admin', 'Manager'), asyncHandler(async (req, res) => ok(res, await moderationService.layChiTietHoSoGame(requestContext(req)))));

/** UC38. Kiểm tra thông tin game mới (#12)  | quyền: Admin, Manager */
router.post('/capNhatTrangThaiDaKiemTra', authenticate, authorize('Admin', 'Manager'), asyncHandler(async (req, res) => ok(res, await moderationService.capNhatTrangThaiDaKiemTra(requestContext(req)))));

/** UC39. Phê duyệt phát hành game (#2)  | quyền: Admin, Manager */
router.post('/yeuCauPheDuyetGame', authenticate, authorize('Admin', 'Manager'), asyncHandler(async (req, res) => ok(res, await moderationService.yeuCauPheDuyetGame(requestContext(req)))));

/** UC40. Từ chối phát hành game (#4)  | quyền: Admin, Manager */
router.post('/guiYeuCauTuChoiKemLyDo', authenticate, authorize('Admin', 'Manager'), asyncHandler(async (req, res) => ok(res, await moderationService.guiYeuCauTuChoiKemLyDo(requestContext(req)))));

/** UC41. Gỡ bỏ game khẩn cấp (#4)  | quyền: Admin, Manager */
router.post('/yeuCauGoBoGameKhanCap', authenticate, authorize('Admin', 'Manager'), asyncHandler(async (req, res) => ok(res, await moderationService.yeuCauGoBoGameKhanCap(requestContext(req)))));

/** UC43. Xử lý đánh giá vi phạm (#4)  | quyền: Admin, Manager */
router.post('/yeuCauXuLyDanhGiaViPham', authenticate, authorize('Admin', 'Manager'), asyncHandler(async (req, res) => ok(res, await moderationService.yeuCauXuLyDanhGiaViPham(requestContext(req)))));

/** UC47. Giám sát nội dung cộng đồng (#2)  | quyền: Admin, Manager */
router.get('/yeuCauDanhSachNoiDungGanCo', authenticate, authorize('Admin', 'Manager'), asyncHandler(async (req, res) => ok(res, await moderationService.yeuCauDanhSachNoiDungGanCo(requestContext(req)))));

/** UC47. Giám sát nội dung cộng đồng (#7)  | quyền: Admin, Manager */
router.post('/capNhatTrangThaiKiemDuyet', authenticate, authorize('Admin', 'Manager'), asyncHandler(async (req, res) => ok(res, await moderationService.capNhatTrangThaiKiemDuyet(requestContext(req)))));

module.exports = router;
