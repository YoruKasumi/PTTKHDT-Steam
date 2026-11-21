'use strict';
const express = require('express');
const { authenticate, authorize } = require('../middlewares/auth');
const asyncHandler = require('../utils/asyncHandler');
const requestContext = require('../utils/requestContext');
const { ok } = require('../utils/response');
const { notificationService } = require('../services');

const router = express.Router();

/** GET /api/notifications — Danh sách thông báo & unreadCount */
router.get(
  '/',
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

/** PATCH /api/notifications/read-all — Đánh dấu tất cả đã đọc */
router.patch(
  '/read-all',
  authenticate,
  asyncHandler(async (req, res) => {
    const result = await notificationService.danhDauTatCaDaDoc({ user: req.user });
    return ok(res, result, 200, 'Đã đánh dấu tất cả thông báo là đã đọc.');
  }),
);

/** PATCH /api/notifications/:id/read — Đánh dấu 1 thông báo đã đọc */
router.patch(
  '/:id/read',
  authenticate,
  asyncHandler(async (req, res) => {
    const result = await notificationService.danhDauDaDoc({
      notificationId: req.params.id,
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
