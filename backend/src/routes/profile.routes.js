'use strict';
const express = require('express');
const { authenticate, authorize } = require('../middlewares/auth');
const upload = require('../middlewares/upload');
const asyncHandler = require('../utils/asyncHandler');
const requestContext = require('../utils/requestContext');
const { ok } = require('../utils/response');
const { authService, profileService } = require('../services');

const router = express.Router();

/** UC4. Cập nhật hồ sơ cá nhân (#3)  | quyền: Authenticated */
router.post('/guiTenHienThiMoi', authenticate, asyncHandler(async (req, res) => ok(res, await profileService.guiTenHienThiMoi(requestContext(req)))));

/** UC4. Cập nhật hồ sơ cá nhân (#9)  | quyền: Authenticated */
router.post('/guiAnhDaiDien', authenticate, asyncHandler(async (req, res) => ok(res, await profileService.guiAnhDaiDien(requestContext(req)))));

router.put('/', authenticate, asyncHandler(async (req, res) => (
  ok(res, await profileService.updateProfile(requestContext(req)), 200, 'Profile updated')
)));

router.put('/password', authenticate, asyncHandler(async (req, res) => (
  ok(res, await authService.guiYeuCauThayDoiMatKhau(requestContext(req)), 200, 'Password updated')
)));

router.patch('/notifications', authenticate, asyncHandler(async (req, res) => (
  ok(res, await profileService.updateNotifications(requestContext(req)), 200, 'Notification preference updated')
)));

module.exports = router;
