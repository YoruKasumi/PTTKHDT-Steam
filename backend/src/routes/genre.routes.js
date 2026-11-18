'use strict';
const express = require('express');
const { authenticate, authorize } = require('../middlewares/auth');
const upload = require('../middlewares/upload');
const asyncHandler = require('../utils/asyncHandler');
const requestContext = require('../utils/requestContext');
const { ok } = require('../utils/response');
const { genreService } = require('../services');

const router = express.Router();

/** UC48. Quản lý danh mục thể loại (#3)  | quyền: Admin, Manager */
router.post('/yeuCauThemTheLoai', authenticate, authorize('Admin', 'Manager'), asyncHandler(async (req, res) => ok(res, await genreService.yeuCauThemTheLoai(requestContext(req)))));

/** UC48. Quản lý danh mục thể loại (#13)  | quyền: Admin, Manager */
router.post('/yeuCauSuaTheLoai', authenticate, authorize('Admin', 'Manager'), asyncHandler(async (req, res) => ok(res, await genreService.yeuCauSuaTheLoai(requestContext(req)))));

/** UC48. Quản lý danh mục thể loại (#23)  | quyền: Admin, Manager */
router.post('/yeuCauXoaTheLoai', authenticate, authorize('Admin', 'Manager'), asyncHandler(async (req, res) => ok(res, await genreService.yeuCauXoaTheLoai(requestContext(req)))));

module.exports = router;
