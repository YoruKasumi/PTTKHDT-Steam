'use strict';
const express = require('express');
const { authenticate, authorize } = require('../middlewares/auth');
const upload = require('../middlewares/upload');
const asyncHandler = require('../utils/asyncHandler');
const requestContext = require('../utils/requestContext');
const { ok } = require('../utils/response');
const { developerService } = require('../services');

const router = express.Router();

/** UC23. Đăng ký hồ sơ nhà phát hành (#4)  | quyền: Customer */
router.post('/guiThongTinDangKy', authenticate, authorize('Customer'), asyncHandler(async (req, res) => ok(res, await developerService.guiThongTinDangKy(requestContext(req)))));

/** UC23. Đăng ký hồ sơ nhà phát hành (#15)  | quyền: Customer */
router.post('/nangCapVaiTroDeveloper', authenticate, authorize('Customer'), asyncHandler(async (req, res) => ok(res, await developerService.nangCapVaiTroDeveloper(requestContext(req)))));

module.exports = router;
