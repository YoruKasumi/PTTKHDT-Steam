'use strict';
const express = require('express');
const { authenticate, authorize } = require('../middlewares/auth');
const upload = require('../middlewares/upload');
const asyncHandler = require('../utils/asyncHandler');
const requestContext = require('../utils/requestContext');
const { ok } = require('../utils/response');
const { bannerService } = require('../services');

const router = express.Router();

/** UC49. Cấu hình banner trang chủ (#4)  | quyền: Admin, Manager */
router.post('/guiThongTinBannerMoi', authenticate, authorize('Admin', 'Manager'), asyncHandler(async (req, res) => ok(res, await bannerService.guiThongTinBannerMoi(requestContext(req)))));

module.exports = router;
