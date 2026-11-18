'use strict';
const express = require('express');
const { authenticate, authorize } = require('../middlewares/auth');
const upload = require('../middlewares/upload');
const asyncHandler = require('../utils/asyncHandler');
const requestContext = require('../utils/requestContext');
const { ok } = require('../utils/response');
const { libraryService } = require('../services');

const router = express.Router();

/** UC16. Xem thư viện cá nhân (#2)  | quyền: Customer */
router.get('/yeuCauXemThuVien', authenticate, authorize('Customer'), asyncHandler(async (req, res) => ok(res, await libraryService.yeuCauXemThuVien(requestContext(req)))));

/** UC17. Khởi chạy game (#2)  | quyền: Customer */
router.post('/yeuCauKhoiChay', authenticate, authorize('Customer'), asyncHandler(async (req, res) => ok(res, await libraryService.yeuCauKhoiChay(requestContext(req)))));

/** UC18. Tải game (#2)  | quyền: Customer */
router.post('/yeuCauTaiGame', authenticate, authorize('Customer'), asyncHandler(async (req, res) => ok(res, await libraryService.yeuCauTaiGame(requestContext(req)))));

module.exports = router;
