'use strict';
const express = require('express');
const { authenticate, authorize } = require('../middlewares/auth');
const upload = require('../middlewares/upload');
const asyncHandler = require('../utils/asyncHandler');
const requestContext = require('../utils/requestContext');
const { ok } = require('../utils/response');
const { authService } = require('../services');

const router = express.Router();

/** UC1. Đăng ký tài khoản (#4)  | quyền: Guest */
router.post('/guiThongTinDangKy', authorize('Guest'), asyncHandler(async (req, res) => ok(res, await authService.guiThongTinDangKy(requestContext(req)))));

/** UC2. Đăng nhập hệ thống (#2)  | quyền: Guest */
router.post('/guiThongTinDangNhap', authorize('Guest'), asyncHandler(async (req, res) => ok(res, await authService.guiThongTinDangNhap(requestContext(req)))));

/** UC3. Đăng xuất khỏi hệ thống (#2)  | quyền: Authenticated */
router.post('/guiYeuCauDangXuat', authenticate, asyncHandler(async (req, res) => ok(res, await authService.guiYeuCauDangXuat(requestContext(req)))));

/** UC5. Thay đổi mật khẩu tài khoản (#2)  | quyền: Authenticated */
router.post('/guiYeuCauThayDoiMatKhau', authenticate, asyncHandler(async (req, res) => ok(res, await authService.guiYeuCauThayDoiMatKhau(requestContext(req)))));

module.exports = router;
