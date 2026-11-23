'use strict';
const express = require('express');
const { authenticate } = require('../middlewares/auth');
const asyncHandler = require('../utils/asyncHandler');
const requestContext = require('../utils/requestContext');
const { ok } = require('../utils/response');
const { authService, profileService } = require('../services');

const router = express.Router();

/** Lấy thông tin hồ sơ người dùng */
router.get('/layThongTinHoSo', authenticate, asyncHandler(async (req, res) => (
  ok(res, await profileService.getProfile(requestContext(req)))
)));

/** UC4. Cập nhật hồ sơ cá nhân (#3)  | quyền: Authenticated */
router.post('/guiTenHienThiMoi', authenticate, asyncHandler(async (req, res) => (
  ok(res, await profileService.guiTenHienThiMoi(requestContext(req)))
)));

/** UC4. Cập nhật hồ sơ cá nhân (#9)  | quyền: Authenticated */
router.post('/guiAnhDaiDien', authenticate, asyncHandler(async (req, res) => (
  ok(res, await profileService.guiAnhDaiDien(requestContext(req)))
)));

/** Cập nhật thông tin hồ sơ tổng thể */
router.post('/capNhatHoSo', authenticate, asyncHandler(async (req, res) => (
  ok(res, await profileService.updateProfile(requestContext(req)), 200, 'Profile updated')
)));

/** Đổi mật khẩu tài khoản */
router.post('/guiYeuCauThayDoiMatKhau', authenticate, asyncHandler(async (req, res) => (
  ok(res, await authService.guiYeuCauThayDoiMatKhau(requestContext(req)), 200, 'Password updated')
)));

/** Cập nhật tùy chọn nhận thông báo */
router.post('/capNhatTrangThaiThongBao', authenticate, asyncHandler(async (req, res) => (
  ok(res, await profileService.updateNotifications(requestContext(req)), 200, 'Notification preference updated')
)));

module.exports = router;
