'use strict';
const express = require('express');
const path = require('path');
const fs = require('fs');
const { authenticate, authorize } = require('../middlewares/auth');
const asyncHandler = require('../utils/asyncHandler');
const { ok } = require('../utils/response');
const { libraryService } = require('../services');
const { ForbiddenException } = require('../exceptions');

const router = express.Router();

// ─── Hàm tiện ích lấy MIME type ─────────────────────────────────────────────

const MIME_MAP = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif':  'image/gif',
  '.svg':  'image/svg+xml',
  '.webp': 'image/webp',
  '.ico':  'image/x-icon',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
  '.ttf':  'font/ttf',
  '.mp3':  'audio/mpeg',
  '.ogg':  'audio/ogg',
  '.wav':  'audio/wav',
};

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_MAP[ext] || 'application/octet-stream';
}

// ─── UC16. Xem thư viện cá nhân ─────────────────────────────────────────────

/** GET /api/library — Lấy danh sách game đã sở hữu */
router.get(
  '/',
  authenticate,
  authorize('Customer'),
  asyncHandler(async (req, res) => ok(res, await libraryService.yeuCauXemThuVien({ user: req.user }))),
);

// Legacy route
router.get(
  '/yeuCauXemThuVien',
  authenticate,
  authorize('Customer'),
  asyncHandler(async (req, res) => ok(res, await libraryService.yeuCauXemThuVien({ user: req.user }))),
);

// ─── UC17. Khởi chạy game ────────────────────────────────────────────────────

/**
 * POST /api/library/:gameId/launch
 * Body: { deviceFingerprint, deviceName }
 * Trả về: { allowed, gameId, versionNumber, launchToken, playUrl }
 */
router.post(
  '/:gameId/launch',
  authenticate,
  authorize('Customer'),
  asyncHandler(async (req, res) => {
    const result = await libraryService.yeuCauKhoiChay({
      gameId: req.params.gameId,
      deviceFingerprint: req.body.deviceFingerprint,
      deviceName: req.body.deviceName,
      user: req.user,
    });
    return ok(res, result, 200, 'Khởi chạy game thành công.');
  }),
);

// Legacy route
router.post(
  '/yeuCauKhoiChay',
  authenticate,
  authorize('Customer'),
  asyncHandler(async (req, res) => ok(res, await libraryService.yeuCauKhoiChay({
    gameId: req.body.gameId,
    deviceFingerprint: req.body.deviceFingerprint,
    deviceName: req.body.deviceName,
    user: req.user,
  }))),
);

// ─── verify-launch (Public endpoint — được drm.js gọi về) ──────────────────

/**
 * POST /api/library/verify-launch
 * Body: { launchToken, gameId, deviceFingerprint }
 * Public (không cần authenticate — drm.js gọi từ trong iframe)
 */
router.post(
  '/verify-launch',
  asyncHandler(async (req, res) => {
    const result = await libraryService.verifyLaunch({
      launchToken: req.body.launchToken,
      gameId: req.body.gameId,
      deviceFingerprint: req.body.deviceFingerprint,
    });

    if (!result.valid) {
      // Trả 403 kèm payload để drm.js xử lý
      return res.status(403).json({ success: true, data: result });
    }
    return ok(res, result, 200, 'Xác thực bản quyền thành công.');
  }),
);

// ─── Phục vụ file tĩnh game (có bảo vệ DRM) ────────────────────────────────

/**
 * GET /api/library/play/:gameId/:version/*
 * Query: ?launchToken=...&gameId=...
 * Cookie: __sstore_lt_<gameId> (HttpOnly, short-lived) — fallback cho sub-resources
 */
router.get(
  '/play/:gameId/:version/*',
  asyncHandler(async (req, res) => {
    const { gameId, version } = req.params;
    // Express wildcard: req.params[0] hoặc '*'
    const requestedPath = req.params[0] || req.params['*'] || 'index.html';

    const launchToken = req.query.launchToken;
    const cookieToken = req.cookies ? req.cookies[`__sstore_lt_${gameId}`] : undefined;

    const result = await libraryService.serveGameFile({
      gameId,
      version,
      filePath: requestedPath,
      launchToken,
      cookieToken,
    });

    // Nếu đây là index.html và có launchToken query param → set HttpOnly cookie ngắn hạn
    if (result.setCookieOnIndexHtml && launchToken) {
      res.cookie(`__sstore_lt_${gameId}`, launchToken, {
        httpOnly: true,
        sameSite: 'strict',
        maxAge: 10 * 60 * 1000, // 10 phút
        path: `/api/library/play/${gameId}/`,
      });
    }

    const mimeType = getMimeType(result.resolvedPath);
    res.setHeader('Content-Type', mimeType);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    // Ngăn browser cache các file game (tránh bypass DRM)
    res.setHeader('Cache-Control', 'no-store');

    return res.sendFile(result.resolvedPath);
  }),
);

// ─── Quản lý thiết bị ────────────────────────────────────────────────────────

/**
 * GET /api/library/:gameId/devices — Danh sách thiết bị
 */
router.get(
  '/:gameId/devices',
  authenticate,
  authorize('Customer'),
  asyncHandler(async (req, res) => {
    const devices = await libraryService.layDanhSachThietBi({
      gameId: req.params.gameId,
      user: req.user,
    });
    return ok(res, devices);
  }),
);

/**
 * DELETE /api/library/:gameId/devices/:deviceId — Thu hồi thiết bị
 */
router.delete(
  '/:gameId/devices/:deviceId',
  authenticate,
  authorize('Customer'),
  asyncHandler(async (req, res) => {
    const result = await libraryService.thuHoiThietBi({
      gameId: req.params.gameId,
      deviceId: req.params.deviceId,
      user: req.user,
    });
    return ok(res, result, 200, 'Thu hồi thiết bị thành công.');
  }),
);

// Legacy route
router.post(
  '/yeuCauTaiGame',
  authenticate,
  authorize('Customer'),
  asyncHandler(async (req, res) => ok(res, await libraryService.yeuCauTaiGame({ user: req.user, ...req.body }))),
);

module.exports = router;
