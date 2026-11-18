'use strict';
const express = require('express');
const { authenticate, authorize } = require('../middlewares/auth');
const upload = require('../middlewares/upload');
const asyncHandler = require('../utils/asyncHandler');
const requestContext = require('../utils/requestContext');
const { ok } = require('../utils/response');
const { auditLogService } = require('../services');

const router = express.Router();

/** UC60. Truy xuất nhật ký toàn cục (#2)  | quyền: Admin */
router.get('/yeuCauLayNhatKyGanNhat', authenticate, authorize('Admin'), asyncHandler(async (req, res) => ok(res, await auditLogService.yeuCauLayNhatKyGanNhat(requestContext(req)))));

/** UC60. Truy xuất nhật ký toàn cục (#8)  | quyền: Admin */
router.post('/guiYeuCauLocNhatKy', authenticate, authorize('Admin'), asyncHandler(async (req, res) => ok(res, await auditLogService.guiYeuCauLocNhatKy(requestContext(req)))));

/** UC60. Truy xuất nhật ký toàn cục (#16)  | quyền: Admin */
router.get('/yeuCauChiTietBanGhiLog', authenticate, authorize('Admin'), asyncHandler(async (req, res) => ok(res, await auditLogService.yeuCauChiTietBanGhiLog(requestContext(req)))));

/** UC60. Truy xuất nhật ký toàn cục (#22)  | quyền: Admin */
router.get('/yeuCauKetXuatTepNhatKy', authenticate, authorize('Admin'), asyncHandler(async (req, res) => ok(res, await auditLogService.yeuCauKetXuatTepNhatKy(requestContext(req)))));

module.exports = router;
