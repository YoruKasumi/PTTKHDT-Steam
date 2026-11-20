'use strict';
const express = require('express');
const { authenticate, authorize, requirePermission } = require('../middlewares/auth');
const upload = require('../middlewares/upload');
const asyncHandler = require('../utils/asyncHandler');
const requestContext = require('../utils/requestContext');
const { ok } = require('../utils/response');
const { accountService } = require('../services');

const router = express.Router();

/** UC42. Tra cứu lịch sử tài khoản (#2)  | quyền: Admin, Manager */
router.post('/guiYeuCauTraCuu', authenticate, authorize('Admin', 'Manager'), requirePermission('account.moderate'), asyncHandler(async (req, res) => ok(res, await accountService.guiYeuCauTraCuu(requestContext(req)))));

/** UC44. Tạm khóa tài khoản vi phạm (#4)  | quyền: Admin, Manager */
router.post('/yeuCauTamKhoaTaiKhoan', authenticate, authorize('Admin', 'Manager'), requirePermission('account.moderate'), asyncHandler(async (req, res) => ok(res, await accountService.yeuCauTamKhoaTaiKhoan(requestContext(req)))));

/** UC45. Khóa vĩnh viễn tài khoản (#4)  | quyền: Admin, Manager */
router.post('/yeuCauKhoaVinhVien', authenticate, authorize('Admin', 'Manager'), requirePermission('account.moderate'), asyncHandler(async (req, res) => ok(res, await accountService.yeuCauKhoaVinhVien(requestContext(req)))));

module.exports = router;
