'use strict';
const express = require('express');
const { authenticate, authorize } = require('../middlewares/auth');
const upload = require('../middlewares/upload');
const asyncHandler = require('../utils/asyncHandler');
const requestContext = require('../utils/requestContext');
const { ok } = require('../utils/response');
const { rbacService } = require('../services');

const router = express.Router();

/** UC59. Phân quyền truy cập (RBAC) (#2)  | quyền: Admin */
router.get('/yeuCauLayMaTranPhanQuyen', authenticate, authorize('Admin'), asyncHandler(async (req, res) => ok(res, await rbacService.yeuCauLayMaTranPhanQuyen(requestContext(req)))));

/** UC59. Phân quyền truy cập (RBAC) (#8)  | quyền: Admin */
router.post('/guiYeuCauCapNhatPhanQuyen', authenticate, authorize('Admin'), asyncHandler(async (req, res) => ok(res, await rbacService.guiYeuCauCapNhatPhanQuyen(requestContext(req)))));

module.exports = router;
