'use strict';
const express = require('express');
const { authenticate, authorize } = require('../middlewares/auth');
const upload = require('../middlewares/upload');
const asyncHandler = require('../utils/asyncHandler');
const requestContext = require('../utils/requestContext');
const { ok } = require('../utils/response');
const { promotionService } = require('../services');

const router = express.Router();

/** UC27. Lên chiến dịch Sale (#2)  | quyền: Developer */
router.post('/yeuCauLenChienDichSale', authenticate, authorize('Developer'), asyncHandler(async (req, res) => ok(res, await promotionService.yeuCauLenChienDichSale(requestContext(req)))));

/** UC28. Tự sinh mã kích hoạt (Key) (#2)  | quyền: Developer */
router.post('/yeuCauSinhMaKichHoat', authenticate, authorize('Developer'), asyncHandler(async (req, res) => ok(res, await promotionService.yeuCauSinhMaKichHoat(requestContext(req)))));

module.exports = router;
