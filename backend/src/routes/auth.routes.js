'use strict';
const express = require('express');
const { authenticate, authorize } = require('../middlewares/auth');
const asyncHandler = require('../utils/asyncHandler');
const requestContext = require('../utils/requestContext');
const { ok } = require('../utils/response');
const { authService } = require('../services');

const router = express.Router();

/** Gửi mã OTP xác thực đăng ký tài khoản */
router.post('/guiMaOtp', authorize('Guest'), asyncHandler(async (req, res) => ok(res, await authService.sendOtp(requestContext(req)))));

/** Gửi mã OTP quên mật khẩu */
router.post('/quenMatKhauGuiMaOtp', authorize('Guest'), asyncHandler(async (req, res) => ok(res, await authService.sendOtp({ ...requestContext(req), purpose: 'forgot_password' }))));

/** Đặt lại mật khẩu với OTP */
router.post('/datLaiMatKhau', authorize('Guest'), asyncHandler(async (req, res) => ok(res, await authService.guiYeuCauDatLaiMatKhau(requestContext(req)))));

/** UC1. Đăng ký tài khoản (#4)  | quyền: Guest */
router.post('/guiThongTinDangKy', authorize('Guest'), asyncHandler(async (req, res) => ok(res, await authService.guiThongTinDangKy(requestContext(req)), 201, 'Account created')));

/** UC2. Đăng nhập hệ thống (#2)  | quyền: Guest */
router.post('/guiThongTinDangNhap', authorize('Guest'), asyncHandler(async (req, res) => ok(res, await authService.guiThongTinDangNhap(requestContext(req)))));

/** UC3. Đăng xuất khỏi hệ thống (#2)  | quyền: Authenticated */
router.post('/guiYeuCauDangXuat', authenticate, asyncHandler(async (req, res) => ok(res, await authService.guiYeuCauDangXuat(requestContext(req)))));

/** UC5. Thay đổi mật khẩu tài khoản (#2)  | quyền: Authenticated */
router.post('/guiYeuCauThayDoiMatKhau', authenticate, asyncHandler(async (req, res) => ok(res, await authService.guiYeuCauThayDoiMatKhau(requestContext(req)))));

module.exports = router;
