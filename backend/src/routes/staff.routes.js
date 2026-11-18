'use strict';
const express = require('express');
const { authenticate, authorize } = require('../middlewares/auth');
const upload = require('../middlewares/upload');
const asyncHandler = require('../utils/asyncHandler');
const requestContext = require('../utils/requestContext');
const { ok } = require('../utils/response');
const { staffService } = require('../services');

const router = express.Router();

/** UC61. Tạo tài khoản nhân sự mới (#4)  | quyền: Admin */
router.post('/guiYeuCauTaoTaiKhoan', authenticate, authorize('Admin'), asyncHandler(async (req, res) => ok(res, await staffService.guiYeuCauTaoTaiKhoan(requestContext(req)))));

/** UC62. Cập nhật thông tin nhân sự (#2)  | quyền: Admin */
router.post('/layChiTietNhanSu', authenticate, authorize('Admin'), asyncHandler(async (req, res) => ok(res, await staffService.layChiTietNhanSu(requestContext(req)))));

/** UC62. Cập nhật thông tin nhân sự (#7)  | quyền: Admin */
router.post('/guiYeuCauCapNhatThongTin', authenticate, authorize('Admin'), asyncHandler(async (req, res) => ok(res, await staffService.guiYeuCauCapNhatThongTin(requestContext(req)))));

module.exports = router;
