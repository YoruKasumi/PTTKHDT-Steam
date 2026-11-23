'use strict';
const express = require('express');
const { authenticate, authorize } = require('../middlewares/auth');
const asyncHandler = require('../utils/asyncHandler');
const requestContext = require('../utils/requestContext');
const { ok } = require('../utils/response');
const { developerService } = require('../services');

const router = express.Router();

/** UC23. Đăng ký hồ sơ nhà phát hành (#4)  | quyền: Customer, Developer */
router.post('/guiThongTinDangKy', authenticate, authorize('Customer', 'Developer'), asyncHandler(async (req, res) => (
  ok(res, await developerService.guiThongTinDangKy(requestContext(req)))
)));

/** UC23. Nâng cấp vai trò Developer (#15)  | quyền: Customer, Developer */
router.post('/nangCapVaiTroDeveloper', authenticate, authorize('Customer', 'Developer'), asyncHandler(async (req, res) => (
  ok(res, await developerService.nangCapVaiTroDeveloper(requestContext(req)))
)));

/** Lấy thông tin hồ sơ Nhà phát hành */
router.get('/layThongTinHoSo', authenticate, authorize('Developer', 'Admin'), asyncHandler(async (req, res) => (
  ok(res, await developerService.layThongTinHoSo(requestContext(req)))
)));

/** Cập nhật thông tin hồ sơ Nhà phát hành */
router.post('/capNhatHoSo', authenticate, authorize('Developer', 'Admin'), asyncHandler(async (req, res) => (
  ok(res, await developerService.capNhatHoSo(requestContext(req)), 200, 'Cập nhật hồ sơ Nhà phát hành thành công')
)));

module.exports = router;
