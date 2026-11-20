'use strict';
/**
 * autoDrmPackager.js — Tiện ích đóng gói & kiểm tra DRM cho gói game .zip
 *
 * Hai hàm chính:
 *   validateAndProcessBuildZip(params)   — Dùng khi Developer upload build mới.
 *   ensureDrmWrappedOnApprove(params)    — Dùng khi Manager bấm Approved.
 */

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const AdmZip = require('adm-zip');

// ─────────────────────────── Hằng số ───────────────────────────────────────

/** Phần mở rộng thực thi nguy hiểm */
const DANGEROUS_EXTS = new Set(['.exe', '.bat', '.cmd', '.sh', '.msi', '.dll', '.php', '.ps1']);

/** Đường dẫn thư mục gốc lưu trữ build (tương đối từ cwd, tuyệt đối tốt hơn) */
const BUILDS_ROOT = path.resolve(__dirname, '../../storage/builds');

// ─────────────────────────── Tiện ích file ─────────────────────────────────

/**
 * Tính SHA-256 của một file trên đĩa.
 * @param {string} filePath
 * @returns {Promise<string>} Chuỗi hex 64 ký tự
 */
function computeFileSha256(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}

/**
 * Lấy kích thước file theo byte.
 * @param {string} filePath
 * @returns {number}
 */
function getFileSize(filePath) {
  return fs.statSync(filePath).size;
}

/**
 * Tạo thư mục nếu chưa tồn tại (đệ quy).
 * @param {string} dir
 */
function mkdirSafe(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

/**
 * Xóa thư mục và toàn bộ nội dung bên trong.
 * @param {string} dir
 */
function rmdirSafe(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

// ─────────────────────────── Kiểm tra an toàn ZIP ──────────────────────────

/**
 * Kiểm tra Zip Slip: entry không được chứa '..' hoặc bắt đầu bằng '/'.
 * @param {string} entryName
 * @returns {boolean} true nếu an toàn
 */
function isSafeEntryName(entryName) {
  if (entryName.startsWith('/') || entryName.startsWith('\\')) return false;
  const parts = entryName.replace(/\\/g, '/').split('/');
  return !parts.includes('..') && !parts.includes('.');
}

/**
 * Kiểm tra phần mở rộng nguy hiểm.
 * @param {string} entryName
 * @returns {boolean} true nếu nguy hiểm
 */
function isDangerousEntry(entryName) {
  const ext = path.extname(entryName).toLowerCase();
  return DANGEROUS_EXTS.has(ext);
}

// ─────────────────────────── validateAndProcessBuildZip ────────────────────

/**
 * Kiểm tra an toàn, tính toán FileSize/Sha256, lưu file và giải nén.
 *
 * @param {object} params
 * @param {string} params.tempFilePath   - Đường dẫn file .zip tạm (multer dest)
 * @param {string} params.gameId         - UUID của game
 * @param {string} params.versionNumber  - VD: "1.0.0"
 * @returns {Promise<{
 *   buildFilePath: string,   // Đường dẫn vật lý build.zip
 *   buildFileKey: string,    // Object key: games/<gameId>/<version>/build.zip
 *   fileSize: number,
 *   sha256: string,
 *   unpackedDir: string,     // Thư mục đã giải nén
 *   hasManifest: boolean,
 *   hasDrmJs: boolean,
 *   hasIndexHtml: boolean,
 * }>}
 * @throws {NghiepVuException} Nếu file không hợp lệ
 */
async function validateAndProcessBuildZip({ tempFilePath, gameId, versionNumber }) {
  const { NghiepVuException } = require('../exceptions');

  // 1. Kiểm tra file tạm tồn tại và không rỗng
  if (!tempFilePath || !fs.existsSync(tempFilePath)) {
    throw new NghiepVuException('Không tìm thấy tệp upload. Vui lòng thử lại.', 400);
  }

  const tempStat = fs.statSync(tempFilePath);
  if (tempStat.size === 0) {
    fs.unlinkSync(tempFilePath);
    throw new NghiepVuException('Tệp .zip rỗng (0 byte). Vui lòng kiểm tra lại gói game.', 400);
  }

  // 2. Kiểm tra định dạng ZIP hợp lệ và phân tích entries
  let zip;
  try {
    zip = new AdmZip(tempFilePath);
  } catch (_) {
    fs.unlinkSync(tempFilePath);
    throw new NghiepVuException('Tệp không phải định dạng .zip hợp lệ hoặc bị hỏng.', 422);
  }

  const entries = zip.getEntries();
  if (!entries || entries.length === 0) {
    fs.unlinkSync(tempFilePath);
    throw new NghiepVuException('Gói .zip rỗng (không có entry nào). Vui lòng kiểm tra lại.', 422);
  }

  // 3. Kiểm tra Zip Slip và phần mở rộng nguy hiểm
  for (const entry of entries) {
    const name = entry.entryName;
    if (!isSafeEntryName(name)) {
      fs.unlinkSync(tempFilePath);
      throw new NghiepVuException(`Lỗ hổng Zip Slip: entry "${name}" chứa đường dẫn không hợp lệ.`, 422);
    }
    if (!entry.isDirectory && isDangerousEntry(name)) {
      fs.unlinkSync(tempFilePath);
      throw new NghiepVuException(
        `Phần mở rộng thực thi nguy hiểm bị phát hiện: "${path.extname(name)}". Chỉ cho phép HTML5/JS/CSS/ảnh.`,
        422,
      );
    }
  }

  // 4. Kiểm tra có file khởi chạy
  const entryNames = entries.filter((e) => !e.isDirectory).map((e) => e.entryName.replace(/\\/g, '/'));
  const hasIndexHtml = entryNames.some((n) => n === 'index.html' || n.endsWith('/index.html'));
  const hasManifest = entryNames.some((n) => n === 'manifest.json' || n.endsWith('/manifest.json'));
  const hasDrmJs = entryNames.some((n) => n === 'drm.js' || n.endsWith('/drm.js'));

  // Xác định entryPoint từ manifest (nếu có)
  let entryPoint = 'index.html';
  if (hasManifest) {
    try {
      const manifestEntry = entries.find((e) => e.entryName === 'manifest.json' || e.entryName.endsWith('/manifest.json'));
      if (manifestEntry) {
        const manifest = JSON.parse(manifestEntry.getData().toString('utf8'));
        if (manifest.entryPoint) entryPoint = manifest.entryPoint;
      }
    } catch (_) {
      // manifest lỗi JSON → dùng mặc định
    }
  }

  const hasEntryPoint = entryNames.some((n) => n === entryPoint || n.endsWith('/' + entryPoint));
  if (!hasEntryPoint) {
    fs.unlinkSync(tempFilePath);
    throw new NghiepVuException(
      `Gói .zip thiếu tệp khởi chạy "${entryPoint}". Đây là bắt buộc để hệ thống phân phối game.`,
      422,
    );
  }

  // 5. Lưu file vào đường dẫn chính thức
  const versionDir = path.join(BUILDS_ROOT, 'games', gameId, versionNumber);
  mkdirSafe(versionDir);
  const buildFilePath = path.join(versionDir, 'build.zip');
  fs.copyFileSync(tempFilePath, buildFilePath);
  fs.unlinkSync(tempFilePath); // xóa tạm

  // 6. Tính FileSize và Sha256
  const fileSize = getFileSize(buildFilePath);
  const sha256 = await computeFileSha256(buildFilePath);

  // 7. Giải nén vào unpacked/
  const unpackedDir = path.join(versionDir, 'unpacked');
  rmdirSafe(unpackedDir);
  mkdirSafe(unpackedDir);
  zip.extractAllTo(unpackedDir, true /* overwrite */);

  return {
    buildFilePath,
    buildFileKey: `games/${gameId}/${versionNumber}/build.zip`,
    fileSize,
    sha256,
    unpackedDir,
    hasManifest,
    hasDrmJs,
    hasIndexHtml,
  };
}

// ─────────────────────────── ensureDrmWrappedOnApprove ─────────────────────

/**
 * Kiểm tra build file & tự động bọc DRM nếu cần (Trường hợp C).
 * Trường hợp A → ném lỗi ngay.
 * Trường hợp B → giữ nguyên, chỉ trả metadata.
 * Trường hợp C → bọc DRM, nén lại, cập nhật FileSize/Sha256.
 *
 * @param {object} params
 * @param {string} params.gameId
 * @param {string} params.versionId
 * @param {string} params.versionNumber
 * @param {string} params.gameTitle
 * @returns {Promise<{
 *   fileSize: number,
 *   sha256: string,
 *   autoWrapped: boolean,   // true nếu hệ thống đã bọc DRM
 * }>}
 * @throws {NghiepVuException} Trường hợp A
 */
async function ensureDrmWrappedOnApprove({ gameId, versionId, versionNumber, gameTitle }) {
  const { NghiepVuException } = require('../exceptions');

  const versionDir = path.join(BUILDS_ROOT, 'games', gameId, versionNumber);
  const buildFilePath = path.join(versionDir, 'build.zip');
  const unpackedDir = path.join(versionDir, 'unpacked');

  // ── Trường hợp A: file rỗng / không tồn tại ──
  if (!fs.existsSync(buildFilePath)) {
    throw new NghiepVuException(
      'Tệp build rỗng hoặc thiếu tệp khởi chạy index.html, vui lòng chọn Từ chối (Rejected)',
      422,
    );
  }

  const buildStat = fs.statSync(buildFilePath);
  if (buildStat.size === 0) {
    throw new NghiepVuException(
      'Tệp build rỗng hoặc thiếu tệp khởi chạy index.html, vui lòng chọn Từ chối (Rejected)',
      422,
    );
  }

  let zip;
  try {
    zip = new AdmZip(buildFilePath);
  } catch (_) {
    throw new NghiepVuException(
      'Tệp build rỗng hoặc thiếu tệp khởi chạy index.html, vui lòng chọn Từ chối (Rejected)',
      422,
    );
  }

  const entries = zip.getEntries();
  if (!entries || entries.length === 0) {
    throw new NghiepVuException(
      'Tệp build rỗng hoặc thiếu tệp khởi chạy index.html, vui lòng chọn Từ chối (Rejected)',
      422,
    );
  }

  const entryNames = entries.filter((e) => !e.isDirectory).map((e) => e.entryName.replace(/\\/g, '/'));
  const hasIndexHtml = entryNames.some((n) => n === 'index.html' || n.endsWith('/index.html'));

  if (!hasIndexHtml) {
    throw new NghiepVuException(
      'Tệp build rỗng hoặc thiếu tệp khởi chạy index.html, vui lòng chọn Từ chối (Rejected)',
      422,
    );
  }

  // Xác định trường hợp B hay C
  const hasManifest = entryNames.some((n) => n === 'manifest.json' || n.endsWith('/manifest.json'));
  const hasDrmJs = entryNames.some((n) => n === 'drm.js' || n.endsWith('/drm.js'));

  // ── Trường hợp B: đã có DRM sẵn ──
  if (hasManifest && hasDrmJs) {
    // Kiểm tra manifest có drm.required = true không
    let drmRequired = false;
    try {
      const manifestEntry = entries.find((e) => e.entryName === 'manifest.json' || e.entryName.endsWith('/manifest.json'));
      if (manifestEntry) {
        const manifest = JSON.parse(manifestEntry.getData().toString('utf8'));
        drmRequired = !!(manifest.drm && manifest.drm.required);
      }
    } catch (_) {
      drmRequired = false;
    }

    if (drmRequired) {
      // Giữ nguyên, đảm bảo unpacked/ đồng bộ
      rmdirSafe(unpackedDir);
      mkdirSafe(unpackedDir);
      zip.extractAllTo(unpackedDir, true);

      const fileSize = getFileSize(buildFilePath);
      const sha256 = await computeFileSha256(buildFilePath);
      return { fileSize, sha256, autoWrapped: false };
    }
  }

  // ── Trường hợp C: game thô — bọc DRM tự động ──

  // Bước 1: Giải nén vào unpacked/ sạch
  rmdirSafe(unpackedDir);
  mkdirSafe(unpackedDir);
  zip.extractAllTo(unpackedDir, true);

  // Bước 2: Đổi tên index.html → _game_app.html
  const originalIndex = path.join(unpackedDir, 'index.html');
  const renamedApp = path.join(unpackedDir, '_game_app.html');
  if (fs.existsSync(originalIndex)) {
    fs.renameSync(originalIndex, renamedApp);
  }

  // Bước 3: Tạo index.html mới — cổng khóa DRM
  const drmGateHtml = buildDrmGateHtml(gameTitle);
  fs.writeFileSync(path.join(unpackedDir, 'index.html'), drmGateHtml, 'utf8');

  // Bước 4: Copy drm.js template
  const drmTemplatePath = path.join(__dirname, '../templates/drm.js');
  fs.copyFileSync(drmTemplatePath, path.join(unpackedDir, 'drm.js'));

  // Bước 5: Tạo manifest.json
  const manifest = {
    gameId,
    title: gameTitle,
    version: versionNumber,
    entryPoint: 'index.html',
    wrappedEntry: '_game_app.html',
    drm: {
      required: true,
      autoWrappedByPlatform: true,
      verifyEndpoint: '/api/library/verify-launch',
    },
  };
  fs.writeFileSync(path.join(unpackedDir, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');

  // Bước 6: Nén lại thư mục unpacked/ → build.zip mới
  const newZip = new AdmZip();
  addDirectoryToZip(newZip, unpackedDir, '');
  newZip.writeZip(buildFilePath);

  // Bước 7: Tính lại FileSize và Sha256
  const fileSize = getFileSize(buildFilePath);
  const sha256 = await computeFileSha256(buildFilePath);

  return { fileSize, sha256, autoWrapped: true };
}

// ─────────────────────────── Helper: Tạo DRM Gate HTML ──────────────────────

/**
 * Tạo nội dung file index.html đóng vai trò cổng khóa DRM.
 * @param {string} gameTitle
 * @returns {string} HTML content
 */
function buildDrmGateHtml(gameTitle) {
  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(gameTitle)} — SteamStore DRM</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #0f0f17; color: #e2e8f0; font-family: 'Segoe UI', system-ui, sans-serif; height: 100vh; overflow: hidden; }
    #drm-overlay {
      position: fixed; inset: 0; z-index: 9999;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      background: linear-gradient(135deg, #0f0f17 0%, #1a1a2e 50%, #16213e 100%);
      gap: 20px;
    }
    #drm-logo {
      font-size: 2rem; font-weight: 900; letter-spacing: 2px;
      background: linear-gradient(90deg, #6366f1, #a78bfa); -webkit-background-clip: text;
      -webkit-text-fill-color: transparent; background-clip: text;
    }
    #drm-spinner {
      width: 40px; height: 40px;
      border: 3px solid rgba(99,102,241,0.3);
      border-top-color: #6366f1;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    #drm-message { font-size: 0.9rem; color: #94a3b8; text-align: center; max-width: 320px; }
    #game-app {
      position: fixed; inset: 0; width: 100%; height: 100%; border: none;
      display: none;
    }
    #game-frame { width: 100%; height: 100%; border: none; }
  </style>
</head>
<body>
  <div id="drm-overlay">
    <div id="drm-logo">⚡ SteamStore</div>
    <div id="drm-spinner"></div>
    <p id="drm-message">Đang xác thực bản quyền SteamStore...</p>
  </div>
  <div id="game-app">
    <iframe id="game-frame" src="" allowfullscreen></iframe>
  </div>
  <script src="drm.js"></script>
  <script>
    window.SteamStoreDRM.bootWithDRM(function (licenseId) {
      var params = window.location.search;
      var frame = document.getElementById('game-frame');
      if (frame) frame.src = '_game_app.html' + params;
    });
  </script>
</body>
</html>`;
}

/**
 * Escape HTML entities để tránh XSS trong title.
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Thêm đệ quy tất cả file trong thư mục vào AdmZip instance.
 * @param {AdmZip} zip
 * @param {string} dirPath - Thư mục nguồn trên đĩa
 * @param {string} zipPrefix - Tiền tố trong zip ('' = root)
 */
function addDirectoryToZip(zip, dirPath, zipPrefix) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    const zipEntry = zipPrefix ? `${zipPrefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      addDirectoryToZip(zip, fullPath, zipEntry);
    } else {
      zip.addLocalFile(fullPath, zipPrefix || '', entry.name);
    }
  }
}

// ─────────────────────────── Xuất ───────────────────────────────────────────

module.exports = { validateAndProcessBuildZip, ensureDrmWrappedOnApprove, BUILDS_ROOT };
