'use strict';

const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const { ok } = require('../utils/response');
const { genreService } = require('../services');

const router = express.Router();

router.get('/', asyncHandler(async (req, res) => ok(res, await genreService.listGenres())));

module.exports = router;
