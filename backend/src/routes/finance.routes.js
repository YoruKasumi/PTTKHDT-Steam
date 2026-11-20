'use strict';
const express = require('express');
const { authenticate, authorize, requirePermission } = require('../middlewares/auth');
const upload = require('../middlewares/upload');
const asyncHandler = require('../utils/asyncHandler');
const requestContext = require('../utils/requestContext');
const { ok } = require('../utils/response');
const { financeService } = require('../services');

const router = express.Router();

/** UC50. Dashboard tài chính tổng quan (#2)  | quyền: Admin, Manager */
router.get('/yeuCauLayDuLieuTongQuan', authenticate, authorize('Admin', 'Manager'), requirePermission('finance.read'), asyncHandler(async (req, res) => ok(res, await financeService.yeuCauLayDuLieuTongQuan(requestContext(req)))));

/** UC51. Thống kê doanh số toàn sàn (#4)  | quyền: Admin, Manager */
router.post('/guiYeuCauThongKeDoanhSo', authenticate, authorize('Admin', 'Manager'), requirePermission('finance.read'), asyncHandler(async (req, res) => ok(res, await financeService.guiYeuCauThongKeDoanhSo(requestContext(req)))));

/** UC52. Thống kê hoa hồng nền tảng (#2)  | quyền: Admin, Manager */
router.get('/yeuCauThongKeHoaHong', authenticate, authorize('Admin', 'Manager'), requirePermission('finance.read'), asyncHandler(async (req, res) => ok(res, await financeService.yeuCauThongKeHoaHong(requestContext(req)))));

/** UC53. Xuất báo cáo tài chính định kỳ (#4)  | quyền: Admin, Manager */
router.post('/yeuCauXuatBaoCaoTaiChinh', authenticate, authorize('Admin', 'Manager'), requirePermission('finance.read'), asyncHandler(async (req, res) => ok(res, await financeService.yeuCauXuatBaoCaoTaiChinh(requestContext(req)))));

/** UC54. Theo dõi dòng tiền chờ rút (#2)  | quyền: Admin, Manager */
router.get('/yeuCauDuLieuDongTienChoRut', authenticate, authorize('Admin', 'Manager'), requirePermission('finance.read'), asyncHandler(async (req, res) => ok(res, await financeService.yeuCauDuLieuDongTienChoRut(requestContext(req)))));

/** UC55. Thống kê giá trị hoàn tiền (#2)  | quyền: Admin, Manager */
router.get('/yeuCauThongKeHoanTien', authenticate, authorize('Admin', 'Manager'), requirePermission('finance.read'), asyncHandler(async (req, res) => ok(res, await financeService.yeuCauThongKeHoanTien(requestContext(req)))));

/** UC56. Theo dõi biến động số dư ví (#2)  | quyền: Admin, Manager */
router.get('/yeuCauNhatKyBienDongSoDu', authenticate, authorize('Admin', 'Manager'), requirePermission('finance.read'), asyncHandler(async (req, res) => ok(res, await financeService.yeuCauNhatKyBienDongSoDu(requestContext(req)))));

module.exports = router;
