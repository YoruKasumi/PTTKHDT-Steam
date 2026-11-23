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

function addLicenseRecheck(html, launchToken, gameId) {
  const tokenLiteral = JSON.stringify(launchToken).replace(/</g, '\\u003c');
  const gameLiteral = JSON.stringify(gameId).replace(/</g, '\\u003c');
  const script = `<script>
(() => {
  const launchToken = ${tokenLiteral};
  const gameId = ${gameLiteral};
  async function recheckLicense() {
    let valid = false;
    let messageText = 'Bản quyền không còn hợp lệ.';
    try {
      const response = await fetch('/api/library/verify-launch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ launchToken, gameId }),
      });
      const payload = await response.json();
      const result = payload.data || payload;
      valid = response.ok && Boolean(result.valid);
      if (!valid && result.reason) messageText = result.reason;
    } catch {
      messageText = 'Không thể kết nối máy chủ xác thực; game đã bị khóa.';
    }
    if (valid) return;
    const lock = document.createElement('main');
    lock.style.cssText = 'position:fixed;inset:0;z-index:2147483647;display:grid;place-content:center;background:#0f0f17;color:#fff;text-align:center;font:16px sans-serif;padding:24px';
    const message = document.createElement('p');
    message.textContent = messageText + ' Hãy khởi chạy lại game từ Thư viện.';
    const link = document.createElement('a');
    link.href = '/library';
    link.textContent = 'Về Thư viện';
    link.style.color = '#a78bfa';
    document.body.replaceChildren(lock);
    lock.append(message, link);
  }
  window.setInterval(recheckLicense, 60000);
})();
</script>`;
  const closingBody = /<\/body\s*>/i;
  return closingBody.test(html) ? html.replace(closingBody, `${script}</body>`) : `${html}${script}`;
}

// ─── UC16. Xem thư viện cá nhân ─────────────────────────────────────────────
router.get(
  '/yeuCauXemThuVien',
  authenticate,
  authorize('Customer'),
  asyncHandler(async (req, res) => ok(res, await libraryService.yeuCauXemThuVien({ user: req.user }))),
);

/** Kích hoạt Key nhận bản quyền game */
router.post(
  '/kichHoatKey',
  authenticate,
  authorize('Customer'),
  asyncHandler(async (req, res) => {
    const result = await libraryService.kichHoatKey({
      keyCode: req.body.keyCode || req.body.code,
      user: req.user,
    });
    return ok(res, result, 201, result.message || 'Kích hoạt game thành công.');
  }),
);

// ─── UC17. Khởi chạy game ────────────────────────────────────────────────────
router.post(
  '/yeuCauKhoiChay',
  authenticate,
  authorize('Customer'),
  asyncHandler(async (req, res) => {
    const gameId = req.body.gameId || req.params.gameId || req.query.gameId;
    const result = await libraryService.yeuCauKhoiChay({
      gameId,
      user: req.user,
    });
    return ok(res, result, 200, 'Khởi chạy game thành công.');
  }),
);

// ─── verify-launch (Public endpoint — được drm.js gọi về) ──────────────────
async function handleVerifyLaunch(req, res) {
  const result = await libraryService.xacThucKhoiChay({
    launchToken: req.body.launchToken,
    gameId: req.body.gameId,
  });

  if (!result.valid) {
    return res.status(403).json({ success: true, data: result });
  }
  return ok(res, result, 200, 'Xác thực bản quyền thành công.');
}

router.post('/xacThucKhoiChay', asyncHandler(handleVerifyLaunch));
router.post('/verify-launch', asyncHandler(handleVerifyLaunch)); // Hỗ trợ tương thích ngược cho drm.js đã đóng gói

// ─── Phục vụ file tĩnh game (có bảo vệ DRM) ────────────────────────────────
router.get(
  '/play/:gameId/:version/*',
  asyncHandler(async (req, res) => {
    const { gameId, version } = req.params;
    const requestedPath = req.params[0] || req.params['*'] || 'index.html';

    const launchToken = req.query.launchToken;
    const cookieToken = req.cookies ? req.cookies[`__sstore_lt_${gameId}`] : undefined;

    const fileMeta = await libraryService.serveGameFile({
      gameId,
      version,
      filePath: requestedPath,
      launchToken,
      cookieToken,
    });

    if (fileMeta.setCookieOnIndexHtml && fileMeta.launchToken) {
      res.cookie(`__sstore_lt_${gameId}`, fileMeta.launchToken, {
        httpOnly: true,
        sameSite: 'strict',
        maxAge: 10 * 60 * 1000,
      });
    }

    const contentType = getMimeType(fileMeta.resolvedPath);
    res.setHeader('Content-Type', contentType);
    res.setHeader('X-Content-Type-Options', 'nosniff');

    if (path.basename(requestedPath).toLowerCase() === 'index.html') {
      const html = await fs.promises.readFile(fileMeta.resolvedPath, 'utf8');
      return res.send(addLicenseRecheck(html, fileMeta.launchToken, gameId));
    }

    return res.sendFile(fileMeta.resolvedPath);
  }),
);

// ─── Tải game về máy ────────────────────────────────────────────────────────
router.get(
  '/yeuCauTaiGame',
  authenticate,
  authorize('Customer'),
  asyncHandler(async (req, res) => {
    const gameId = req.query.gameId || req.params.gameId || req.body.gameId;
    const meta = await libraryService.yeuCauTaiGame({ gameId, user: req.user });

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Length', meta.fileSize);
    res.setHeader('Content-Disposition', `attachment; filename="${meta.fileName}"`);
    res.setHeader('X-Game-Version', meta.versionNumber || '');
    res.setHeader('X-Game-Sha256', meta.sha256 || '');
    res.setHeader('X-Content-Type-Options', 'nosniff');

    const stream = fs.createReadStream(meta.filePath);
    stream.on('error', () => {
      if (!res.headersSent) {
        res.status(500).json({ success: false, message: 'Lỗi đọc tệp build trên máy chủ.' });
      } else {
        res.destroy();
      }
    });
    return stream.pipe(res);
  }),
);

router.post(
  '/yeuCauTaiGame',
  authenticate,
  authorize('Customer'),
  asyncHandler(async (req, res) => ok(res, await libraryService.yeuCauTaiGame({ user: req.user, ...req.body }))),
);

module.exports = router;
