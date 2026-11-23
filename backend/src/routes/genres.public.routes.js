'use strict';

const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const { ok } = require('../utils/response');
const { genreService } = require('../services');

const router = express.Router();

router.get('/layDanhSachTheLoaiCongKhai', asyncHandler(async (req, res) => ok(res, await genreService.layDanhSachTheLoai())));
router.get('/', asyncHandler(async (req, res) => ok(res, await genreService.layDanhSachTheLoai())));

module.exports = router;
