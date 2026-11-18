'use strict';
const express = require('express');
const { authenticate, authorize } = require('../middlewares/auth');
const upload = require('../middlewares/upload');
const asyncHandler = require('../utils/asyncHandler');
const requestContext = require('../utils/requestContext');
const { ok } = require('../utils/response');
const { systemConfigService } = require('../services');

const router = express.Router();

/** UC58. Cấu hình tham số hệ thống (#2)  | quyền: Admin */
router.get('/yeuCauLayDanhSachThamSo', authenticate, authorize('Admin'), asyncHandler(async (req, res) => ok(res, await systemConfigService.yeuCauLayDanhSachThamSo(requestContext(req)))));

/** UC58. Cấu hình tham số hệ thống (#8)  | quyền: Admin */
router.post('/guiYeuCauCapNhatThamSo', authenticate, authorize('Admin'), asyncHandler(async (req, res) => ok(res, await systemConfigService.guiYeuCauCapNhatThamSo(requestContext(req)))));

module.exports = router;
