'use strict';
const express = require('express');
const { authenticate, authorize } = require('../middlewares/auth');
const asyncHandler = require('../utils/asyncHandler');
const requestContext = require('../utils/requestContext');
const { ok } = require('../utils/response');
const { notificationService } = require('../services');

const router = express.Router();

/** Lấy danh sách thông báo & unreadCount */
router.get(
  '/layDanhSachThongBao',
  authenticate,
  asyncHandler(async (req, res) => {
    const result = await notificationService.layDanhSachThongBao({
      user: req.user,
      limit: req.query.limit,
      offset: req.query.offset,
    });
    return ok(res, result);
  }),
);

/** Đánh dấu tất cả thông báo đã đọc */
router.post(
  '/danhDauTatCaDaDoc',
  authenticate,
  asyncHandler(async (req, res) => {
    const result = await notificationService.danhDauTatCaDaDoc({ user: req.user });
    return ok(res, result, 200, 'Đã đánh dấu tất cả thông báo là đã đọc.');
  }),
);

/** Đánh dấu 1 thông báo đã đọc */
router.post(
  '/danhDauDaDoc',
  authenticate,
  asyncHandler(async (req, res) => {
    const notificationId = req.body.notificationId || req.body.id || req.params.id;
    const result = await notificationService.danhDauDaDoc({
      notificationId,
      user: req.user,
    });
    return ok(res, result, 200, 'Đã đánh dấu thông báo là đã đọc.');
  }),
);

/** UC22. Quản lý thông báo hệ thống (#3)  | quyền: Customer */
router.post(
  '/capNhatTrangThaiBat',
  authenticate,
  authorize('Customer'),
  asyncHandler(async (req, res) => ok(res, await notificationService.capNhatTrangThaiBat(requestContext(req)))),
);

/** UC22. Quản lý thông báo hệ thống (#9)  | quyền: Customer */
router.post(
  '/capNhatTrangThaiTat',
  authenticate,
  authorize('Customer'),
  asyncHandler(async (req, res) => ok(res, await notificationService.capNhatTrangThaiTat(requestContext(req)))),
);

module.exports = router;
