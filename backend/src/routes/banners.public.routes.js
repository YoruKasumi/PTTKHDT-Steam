'use strict';

const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const { ok } = require('../utils/response');
const { bannerService } = require('../services');

const router = express.Router();

router.get('/active', asyncHandler(async (req, res) => ok(res, await bannerService.listActiveBanners())));

module.exports = router;
