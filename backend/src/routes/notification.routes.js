'use strict';
const express = require('express');
const { authenticate, authorize } = require('../middlewares/auth');
const upload = require('../middlewares/upload');
const asyncHandler = require('../utils/asyncHandler');
const requestContext = require('../utils/requestContext');
const { ok } = require('../utils/response');
const { notificationService } = require('../services');

const router = express.Router();

/** UC22. Quản lý thông báo hệ thống (#3)  | quyền: Customer */
router.post('/capNhatTrangThaiBat', authenticate, authorize('Customer'), asyncHandler(async (req, res) => ok(res, await notificationService.capNhatTrangThaiBat(requestContext(req)))));

/** UC22. Quản lý thông báo hệ thống (#9)  | quyền: Customer */
router.post('/capNhatTrangThaiTat', authenticate, authorize('Customer'), asyncHandler(async (req, res) => ok(res, await notificationService.capNhatTrangThaiTat(requestContext(req)))));

module.exports = router;
