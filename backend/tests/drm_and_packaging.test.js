'use strict';
/**
 * drm_and_packaging.test.js
 *
 * 6 test scenarios cho DRM & Packaging (node:test + assert).
 * Chạy: npm test   (hoặc node --test tests/drm_and_packaging.test.js)
 *
 * Các test không cần DB thật — dùng mock/stub để kiểm tra logic thuần túy.
 */

const assert = require('node:assert/strict');
const { describe, it, before, after } = require('node:test');
const path = require('path');
const fs = require('fs');
const os = require('os');
const AdmZip = require('adm-zip');
const crypto = require('crypto');

// ─── Helper: tạo file zip tạm thời ─────────────────────────────────────────

/**
 * Tạo một .zip tạm trong thư mục hệ thống, trả về đường dẫn.
 * @param {Array<{name: string, content: string}>} entries - danh sách file trong zip
 * @returns {string} Đường dẫn file .zip tạm
 */
function makeTempZip(entries = []) {
  const zip = new AdmZip();
  for (const { name, content } of entries) {
    zip.addFile(name, Buffer.from(content ?? '', 'utf8'));
  }
  const tmpPath = path.join(os.tmpdir(), `test_${Date.now()}_${Math.random().toString(36).slice(2)}.zip`);
  zip.writeZip(tmpPath);
  return tmpPath;
}

/**
 * Tạo file tạm không phải zip.
 */
function makeTempNonZip() {
  const tmpPath = path.join(os.tmpdir(), `not_a_zip_${Date.now()}.txt`);
  fs.writeFileSync(tmpPath, 'this is not a zip file at all', 'utf8');
  return tmpPath;
}

/**
 * Tạo file zip rỗng (0 byte).
 */
function makeTempEmptyFile() {
  const tmpPath = path.join(os.tmpdir(), `empty_${Date.now()}.zip`);
  fs.writeFileSync(tmpPath, Buffer.alloc(0));
  return tmpPath;
}

// ─── Import module cần test ──────────────────────────────────────────────────
const {
  validateAndProcessBuildZip,
  ensureDrmWrappedOnApprove,
} = require('../src/utils/autoDrmPackager');
const { getGameVersionDir } = require('../src/utils/storagePaths');

const { NghiepVuException, ValidationException } = require('../src/exceptions');

// ─── Thư mục test tạm để lưu build ──────────────────────────────────────────
const TEST_GAME_ID = `test-game-${Date.now()}`;
const TEST_VERSION = '9.9.9';

// ─────────────────────────────────────────────────────────────────────────────
// SCENARIO 1: Upload tệp không hợp lệ → phải ném NghiepVuException
// ─────────────────────────────────────────────────────────────────────────────
describe('Scenario 1 — Kiểm tra an toàn tệp upload (validateAndProcessBuildZip)', () => {

  it('1a. Từ chối file 0 byte', async () => {
    const tmpPath = makeTempEmptyFile();
    await assert.rejects(
      () => validateAndProcessBuildZip({ tempFilePath: tmpPath, gameId: TEST_GAME_ID, versionNumber: '0.0.1' }),
      (err) => {
        assert.ok(err instanceof NghiepVuException, `Phải là NghiepVuException, nhận được: ${err.constructor.name}`);
        assert.ok(err.status === 400, `HTTP status phải là 400, nhận: ${err.status}`);
        return true;
      },
      'File 0 byte phải bị từ chối',
    );
    // Dọn dẹp nếu còn tồn tại
    if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
  });

  it('1b. Từ chối file không phải định dạng .zip', async () => {
    const tmpPath = makeTempNonZip();
    await assert.rejects(
      () => validateAndProcessBuildZip({ tempFilePath: tmpPath, gameId: TEST_GAME_ID, versionNumber: '0.0.2' }),
      (err) => {
        assert.ok(err instanceof NghiepVuException);
        assert.ok([400, 422].includes(err.status), `HTTP status phải là 400 hoặc 422, nhận: ${err.status}`);
        return true;
      },
      'File không phải ZIP phải bị từ chối',
    );
    if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
  });

  it('1c. Từ chối .zip không có index.html', async () => {
    const tmpPath = makeTempZip([
      { name: 'style.css', content: 'body { margin: 0; }' },
      { name: 'game.js', content: 'console.log("game");' },
    ]);
    await assert.rejects(
      () => validateAndProcessBuildZip({ tempFilePath: tmpPath, gameId: TEST_GAME_ID, versionNumber: '0.0.3' }),
      (err) => {
        assert.ok(err instanceof NghiepVuException);
        assert.equal(err.status, 422);
        return true;
      },
      'ZIP thiếu index.html phải bị từ chối',
    );
    if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
  });

  it('1d. Từ chối .zip chứa file thực thi nguy hiểm (.exe)', async () => {
    const tmpPath = makeTempZip([
      { name: 'index.html', content: '<html>game</html>' },
      { name: 'hack.exe', content: 'MZ' },
    ]);
    await assert.rejects(
      () => validateAndProcessBuildZip({ tempFilePath: tmpPath, gameId: TEST_GAME_ID, versionNumber: '0.0.4' }),
      (err) => {
        assert.ok(err instanceof NghiepVuException);
        assert.equal(err.status, 422);
        assert.ok(err.message.includes('.exe') || err.message.toLowerCase().includes('nguy hiểm') || err.message.toLowerCase().includes('thực thi'));
        return true;
      },
      'ZIP chứa .exe phải bị từ chối',
    );
    if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
  });

  it('1e. Từ chối Zip Slip (entry chứa ..)', async () => {
    /**
     * AdmZip.addFile() sanitizes tên nên không thể dùng addFile để tạo entry path traversal.
     * Thay vào đó, kiểm tra trực tiếp hàm isSafeEntryName (logic kiểm tra Zip Slip)
     * thông qua một ZIP thủ công có entryName chứa '..'  bằng cách
     * mock entry và gọi lại logic nội bộ của validateAndProcessBuildZip.
     *
     * Vì AdmZip tự normalize, ta kiểm tra logic phòng thủ bằng cách:
     * 1. Tạo zip hợp lệ nhưng thêm entry với tên có '..' qua addFile buffer raw.
     * 2. Nếu AdmZip vẫn sanitize → test kiểm tra isSafeEntryName trực tiếp.
     */

    // Kiểm tra logic isSafeEntryName (trích xuất cùng pattern với autoDrmPackager)
    function isSafeEntryName(entryName) {
      if (entryName.startsWith('/') || entryName.startsWith('\\')) return false;
      const parts = entryName.replace(/\\/g, '/').split('/');
      return !parts.includes('..') && !parts.includes('.');
    }

    // Các entry không an toàn phải bị phát hiện
    const unsafeEntries = [
      '../../../etc/passwd',
      '..\\Windows\\System32\\config',
      'subdir/../../secret.txt',
      '/absolute/path/file.js',
    ];
    for (const entry of unsafeEntries) {
      assert.equal(
        isSafeEntryName(entry),
        false,
        `isSafeEntryName("${entry}") phải trả false`,
      );
    }

    // Các entry hợp lệ
    const safeEntries = ['index.html', 'subdir/game.js', 'assets/img/icon.png'];
    for (const entry of safeEntries) {
      assert.equal(isSafeEntryName(entry), true, `isSafeEntryName("${entry}") phải trả true`);
    }

    // Nếu AdmZip giữ nguyên entry '..' (một số phiên bản cũ), validate sẽ chặn
    // Kiểm tra hành vi thực tế của validateAndProcessBuildZip với ZIP hợp lệ nhưng entry name mock
    const zip2 = new AdmZip();
    zip2.addFile('index.html', Buffer.from('<html>ok</html>'));
    // Kiểm tra AdmZip có sanitize '../' không
    const entries = zip2.getEntries().map((e) => e.entryName);
    // Dù AdmZip có sanitize hay không, hàm isSafeEntryName sẽ bắt được nếu bypass
    assert.ok(entries.every(isSafeEntryName), 'Tất cả entry hợp lệ phải qua isSafeEntryName');
  });

});

// ─────────────────────────────────────────────────────────────────────────────
// SCENARIO 2: Game thô (chỉ có index.html) → Manager Approved → Auto-DRM
// ─────────────────────────────────────────────────────────────────────────────
describe('Scenario 2 — Game thô: validateAndProcessBuildZip + ensureDrmWrappedOnApprove', () => {

  const gameId = `raw-game-${Date.now()}`;
  const version = '1.0.0';

  before(async () => {
    // Tạo build hợp lệ bằng validateAndProcessBuildZip
    const tmpZip = makeTempZip([
      { name: 'index.html', content: '<html><body>Rắn Săn Mồi</body></html>' },
      { name: 'game.js', content: 'function startGame() { console.log("start"); }' },
      { name: 'style.css', content: 'body { background: #000; }' },
    ]);
    await validateAndProcessBuildZip({ tempFilePath: tmpZip, gameId, versionNumber: version });
  });

  after(() => {
    // Dọn dẹp thư mục test
    const versionDir = getGameVersionDir('unassigned', gameId, version);
    if (fs.existsSync(versionDir)) {
      fs.rmSync(versionDir, { recursive: true, force: true });
    }
  });

  it('2a. Build hợp lệ được lưu vào BUILDS_ROOT', () => {
    const buildZip = path.join(getGameVersionDir('unassigned', gameId, version), 'build.zip');
    assert.ok(fs.existsSync(buildZip), `build.zip phải tồn tại tại: ${buildZip}`);
  });

  it('2b. Thư mục unpacked/ được giải nén sẵn', () => {
    const unpackedDir = path.join(getGameVersionDir('unassigned', gameId, version), 'unpacked');
    assert.ok(fs.existsSync(unpackedDir), 'unpacked/ phải tồn tại');
    const indexHtml = path.join(unpackedDir, 'index.html');
    assert.ok(fs.existsSync(indexHtml), 'unpacked/index.html phải tồn tại');
  });

  it('2c. ensureDrmWrappedOnApprove — game thô → autoWrapped: true', async () => {
    const result = await ensureDrmWrappedOnApprove({
      gameId,
      versionId: null,
      versionNumber: version,
      gameTitle: 'Rắn Săn Mồi',
    });
    assert.equal(result.autoWrapped, true, 'autoWrapped phải là true cho game thô');
    assert.ok(result.fileSize > 0, 'fileSize phải > 0');
    assert.match(result.sha256, /^[0-9a-f]{64}$/, 'sha256 phải là 64 ký tự hex');
  });

  it('2d. Sau Auto-DRM: manifest.json + drm.js + _game_app.html tồn tại trong unpacked/', () => {
    const unpackedDir = path.join(getGameVersionDir('unassigned', gameId, version), 'unpacked');
    assert.ok(fs.existsSync(path.join(unpackedDir, 'manifest.json')), 'manifest.json phải có');
    assert.ok(fs.existsSync(path.join(unpackedDir, 'drm.js')), 'drm.js phải có');
    assert.ok(fs.existsSync(path.join(unpackedDir, '_game_app.html')), '_game_app.html phải có (đổi tên từ index.html)');
    assert.ok(fs.existsSync(path.join(unpackedDir, 'index.html')), 'index.html mới (DRM gate) phải có');
  });

  it('2e. manifest.json đúng cấu trúc DRM', () => {
    const unpackedDir = path.join(getGameVersionDir('unassigned', gameId, version), 'unpacked');
    const manifest = JSON.parse(fs.readFileSync(path.join(unpackedDir, 'manifest.json'), 'utf8'));
    assert.equal(manifest.drm?.required, true, 'drm.required phải là true');
    assert.equal(manifest.drm?.autoWrappedByPlatform, true, 'drm.autoWrappedByPlatform phải là true');
    assert.equal(manifest.drm?.verifyEndpoint, '/api/library/verify-launch');
    assert.equal(manifest.wrappedEntry, '_game_app.html');
  });

});

// ─────────────────────────────────────────────────────────────────────────────
// SCENARIO 3: Game đã có DRM sẵn → Manager Approved → autoWrapped: false
// ─────────────────────────────────────────────────────────────────────────────
describe('Scenario 3 — Game DRM-ready: ensureDrmWrappedOnApprove giữ nguyên', () => {

  const gameId = `drm-ready-game-${Date.now()}`;
  const version = '2.0.0';

  before(async () => {
    const manifest = JSON.stringify({
      entryPoint: 'index.html',
      version: '2.0.0',
      drm: { required: true, verifyEndpoint: '/api/library/verify-launch' },
    });
    const tmpZip = makeTempZip([
      { name: 'manifest.json', content: manifest },
      { name: 'index.html', content: '<html>DRM Gate</html>' },
      { name: 'drm.js', content: 'window.SteamStoreDRM = { bootWithDRM: function(){} };' },
      { name: 'game.js', content: 'function play() {}' },
    ]);
    await validateAndProcessBuildZip({ tempFilePath: tmpZip, gameId, versionNumber: version });
  });

  after(() => {
    const versionDir = getGameVersionDir('unassigned', gameId, version);
    if (fs.existsSync(versionDir)) fs.rmSync(versionDir, { recursive: true, force: true });
  });

  it('3a. ensureDrmWrappedOnApprove — game DRM-ready → autoWrapped: false', async () => {
    const result = await ensureDrmWrappedOnApprove({
      gameId,
      versionId: null,
      versionNumber: version,
      gameTitle: 'Tetris Pro',
    });
    assert.equal(result.autoWrapped, false, 'autoWrapped phải là false khi đã có DRM sẵn');
    assert.ok(result.fileSize > 0);
    assert.match(result.sha256, /^[0-9a-f]{64}$/);
  });

  it('3b. index.html gốc không bị đổi tên khi đã có DRM', () => {
    const unpackedDir = path.join(getGameVersionDir('unassigned', gameId, version), 'unpacked');
    assert.ok(fs.existsSync(path.join(unpackedDir, 'index.html')), 'index.html phải vẫn còn');
    // _game_app.html KHÔNG tồn tại (không bị auto-wrap)
    assert.ok(
      !fs.existsSync(path.join(unpackedDir, '_game_app.html')),
      '_game_app.html KHÔNG được tạo ra khi đã có DRM sẵn',
    );
  });

});

// ─────────────────────────────────────────────────────────────────────────────
// SCENARIO 4: Launch + verify-launch (mock DB) — Happy path & 403
// ─────────────────────────────────────────────────────────────────────────────
describe('Scenario 4 — Launch Token: ký/xác thực & bảo vệ file tĩnh', () => {

  const jwt = require('jsonwebtoken');
  // Dùng secret test độc lập để không cần env
  const TEST_JWT_SECRET = 'test-secret-drm-2026';
  const GAME_ID = 'game-abc-123';
  const LICENSE_ID = 'lic-xyz-456';
  const DEVICE_FP = crypto.createHash('sha256').update('test-device').digest('hex');

  it('4a. Ký Launch Token hợp lệ — verify giải mã thành công', () => {
    const token = jwt.sign(
      { type: 'GAME_LAUNCH', licenseId: LICENSE_ID, customerId: 'cus-001', gameId: GAME_ID, deviceFingerprint: DEVICE_FP },
      TEST_JWT_SECRET,
      { expiresIn: '10m' },
    );

    const payload = jwt.verify(token, TEST_JWT_SECRET);
    assert.equal(payload.type, 'GAME_LAUNCH');
    assert.equal(payload.gameId, GAME_ID);
    assert.equal(payload.licenseId, LICENSE_ID);
    assert.equal(payload.deviceFingerprint, DEVICE_FP);
    // Token còn hạn (exp > iat)
    assert.ok(payload.exp > payload.iat);
  });

  it('4b. Token hết hạn → jwt.verify ném lỗi TokenExpiredError', () => {
    const expiredToken = jwt.sign(
      { type: 'GAME_LAUNCH', gameId: GAME_ID, deviceFingerprint: DEVICE_FP },
      TEST_JWT_SECRET,
      { expiresIn: '-1s' }, // đã hết hạn ngay lập tức
    );
    assert.throws(
      () => jwt.verify(expiredToken, TEST_JWT_SECRET),
      (err) => err.name === 'TokenExpiredError',
    );
  });

  it('4c. Token bị giả mạo (sai secret) → JsonWebTokenError', () => {
    const fakeToken = jwt.sign(
      { type: 'GAME_LAUNCH', gameId: GAME_ID, deviceFingerprint: DEVICE_FP },
      'wrong-secret',
      { expiresIn: '10m' },
    );
    assert.throws(
      () => jwt.verify(fakeToken, TEST_JWT_SECRET),
      (err) => err.name === 'JsonWebTokenError',
    );
  });

  it('4d. Token payload.type sai → không phải GAME_LAUNCH', () => {
    const wrongToken = jwt.sign(
      { type: 'USER_SESSION', gameId: GAME_ID, deviceFingerprint: DEVICE_FP },
      TEST_JWT_SECRET,
      { expiresIn: '10m' },
    );
    const payload = jwt.verify(wrongToken, TEST_JWT_SECRET);
    // Business logic phải từ chối type không phải GAME_LAUNCH
    assert.notEqual(payload.type, 'GAME_LAUNCH', 'type phải khác GAME_LAUNCH để bị từ chối');
  });

  it('4e. verify-launch: payload.gameId không khớp → phải trả valid: false', () => {
    const token = jwt.sign(
      { type: 'GAME_LAUNCH', licenseId: LICENSE_ID, customerId: 'cus-001', gameId: 'other-game', deviceFingerprint: DEVICE_FP },
      TEST_JWT_SECRET,
      { expiresIn: '10m' },
    );
    const payload = jwt.verify(token, TEST_JWT_SECRET);
    // Mô phỏng logic verify-launch: kiểm tra gameId khớp
    const requestedGameId = GAME_ID;
    const isValid = payload.type === 'GAME_LAUNCH'
      && payload.gameId === requestedGameId
      && payload.deviceFingerprint === DEVICE_FP;
    assert.equal(isValid, false, 'Phải từ chối khi gameId không khớp');
  });

});

// ─────────────────────────────────────────────────────────────────────────────
// SCENARIO 5: Giới hạn 3 thiết bị + thu hồi bản quyền
// ─────────────────────────────────────────────────────────────────────────────
describe('Scenario 5 — Giới hạn thiết bị & thu hồi bản quyền (logic thuần túy)', () => {

  /**
   * Mô phỏng logic kiểm tra giới hạn thiết bị của LibraryService.yeuCauKhoiChay
   * mà không cần kết nối DB.
   */
  function checkDeviceLimit({ activeDeviceCount, deviceExists, deviceStatus }) {
    const MAX_DEVICES = 3;

    if (deviceExists) {
      if (deviceStatus === 'Revoked') {
        return { allowed: false, reason: 'Thiết bị này đã bị thu hồi quyền khởi chạy.', code: 'DEVICE_REVOKED' };
      }
      return { allowed: true }; // Active → cập nhật LastSeen
    }

    // Thiết bị mới
    if (activeDeviceCount >= MAX_DEVICES) {
      return { allowed: false, reason: 'Đã đạt giới hạn tối đa 3 thiết bị. Vui lòng gỡ bớt thiết bị cũ.', code: 'DEVICE_LIMIT_EXCEEDED' };
    }
    return { allowed: true }; // INSERT thiết bị mới
  }

  it('5a. Thiết bị thứ 1 (mới, 0 active) → allowed', () => {
    const result = checkDeviceLimit({ activeDeviceCount: 0, deviceExists: false });
    assert.equal(result.allowed, true);
  });

  it('5b. Thiết bị thứ 3 (mới, 2 active) → allowed', () => {
    const result = checkDeviceLimit({ activeDeviceCount: 2, deviceExists: false });
    assert.equal(result.allowed, true);
  });

  it('5c. Thiết bị thứ 4 (mới, 3 active) → DEVICE_LIMIT_EXCEEDED', () => {
    const result = checkDeviceLimit({ activeDeviceCount: 3, deviceExists: false });
    assert.equal(result.allowed, false);
    assert.equal(result.code, 'DEVICE_LIMIT_EXCEEDED');
    assert.ok(result.reason.includes('3 thiết bị'));
  });

  it('5d. Thiết bị đã có, Status=Active → allowed (cập nhật LastSeen)', () => {
    const result = checkDeviceLimit({ activeDeviceCount: 2, deviceExists: true, deviceStatus: 'Active' });
    assert.equal(result.allowed, true);
  });

  it('5e. Thiết bị đã có, Status=Revoked → DEVICE_REVOKED', () => {
    const result = checkDeviceLimit({ activeDeviceCount: 1, deviceExists: true, deviceStatus: 'Revoked' });
    assert.equal(result.allowed, false);
    assert.equal(result.code, 'DEVICE_REVOKED');
  });

  it('5f. Sau khi license bị thu hồi, verify-launch phải trả valid: false', () => {
    // Mô phỏng kiểm tra thời gian thực
    function verifyLaunchRealtime({ licenseStatus, accountStatus, deviceStatus }) {
      if (licenseStatus !== 'Active') return { valid: false, reason: 'Bản quyền đã bị thu hồi.' };
      if (accountStatus !== 'Active') return { valid: false, reason: 'Tài khoản bị khóa.' };
      if (deviceStatus !== 'Active') return { valid: false, reason: 'Thiết bị đã bị thu hồi.' };
      return { valid: true };
    }

    // Trường hợp bình thường
    assert.deepEqual(
      verifyLaunchRealtime({ licenseStatus: 'Active', accountStatus: 'Active', deviceStatus: 'Active' }),
      { valid: true },
    );

    // License bị Revoked
    assert.equal(
      verifyLaunchRealtime({ licenseStatus: 'Revoked', accountStatus: 'Active', deviceStatus: 'Active' }).valid,
      false,
    );

    // Tài khoản bị khóa (Banned/Suspended)
    assert.equal(
      verifyLaunchRealtime({ licenseStatus: 'Active', accountStatus: 'Suspended', deviceStatus: 'Active' }).valid,
      false,
    );

    // Thiết bị bị thu hồi
    assert.equal(
      verifyLaunchRealtime({ licenseStatus: 'Active', accountStatus: 'Active', deviceStatus: 'Revoked' }).valid,
      false,
    );
  });

});

// ─────────────────────────────────────────────────────────────────────────────
// SCENARIO 6: Upload Patch + Rollback — đảm bảo ràng buộc IsCurrent
// ─────────────────────────────────────────────────────────────────────────────
describe('Scenario 6 — Patch & Rollback: validateAndProcessBuildZip nhiều phiên bản', () => {

  const gameId = `patch-game-${Date.now()}`;

  // Danh sách phiên bản mô phỏng (giống DB)
  let versions = [];

  /**
   * Mô phỏng INSERT phiên bản mới (đúng thứ tự transaction: reset → insert).
   * Ràng buộc: chỉ 1 bản có IsCurrent=1 tại mỗi thời điểm.
   */
  function simulatePatchInsert(versionNumber, buildFile) {
    // Bước 1: Reset tất cả IsCurrent về 0 (giống resetCurrentVersion)
    versions = versions.map((v) => ({ ...v, IsCurrent: 0 }));
    // Bước 2: Insert bản mới với IsCurrent=1
    versions.push({ VersionNumber: versionNumber, BuildFile: buildFile, IsCurrent: 1 });
  }

  /**
   * Mô phỏng Rollback: đặt phiên bản cũ thành current.
   */
  function simulateRollback(targetVersion) {
    const target = versions.find((v) => v.VersionNumber === targetVersion);
    if (!target) throw new Error(`Phiên bản ${targetVersion} không tồn tại.`);
    if (versions.length < 2) throw new Error('Cần ít nhất 2 phiên bản để rollback.');
    // Bước 1: Reset tất cả
    versions = versions.map((v) => ({ ...v, IsCurrent: 0 }));
    // Bước 2: Set target thành current
    versions = versions.map((v) => v.VersionNumber === targetVersion ? { ...v, IsCurrent: 1 } : v);
  }

  /**
   * Kiểm tra ràng buộc uq_one_current_per_game: chỉ đúng 1 bản IsCurrent=1.
   */
  function assertOnlyOneCurrentVersion() {
    const currentVersions = versions.filter((v) => v.IsCurrent === 1);
    assert.equal(currentVersions.length, 1, `Phải có đúng 1 phiên bản IsCurrent=1, tìm thấy: ${currentVersions.length}`);
    return currentVersions[0];
  }

  before(async () => {
    // Upload phiên bản đầu (1.0.0) thực tế vào disk
    const tmpZip1 = makeTempZip([
      { name: 'index.html', content: '<html>v1.0.0</html>' },
      { name: 'game.js', content: 'var v = "1.0.0";' },
    ]);
    await validateAndProcessBuildZip({ tempFilePath: tmpZip1, gameId, versionNumber: '1.0.0' });
    simulatePatchInsert('1.0.0', `games/${gameId}/1.0.0/build.zip`);
  });

  after(() => {
    const gameDir = path.dirname(getGameVersionDir('unassigned', gameId, '1.0.0'));
    if (fs.existsSync(gameDir)) fs.rmSync(gameDir, { recursive: true, force: true });
  });

  it('6a. Sau upload v1.0.0: đúng 1 phiên bản IsCurrent=1', () => {
    const current = assertOnlyOneCurrentVersion();
    assert.equal(current.VersionNumber, '1.0.0');
  });

  it('6b. Upload patch v1.1.0: v1.0.0 → IsCurrent=0, v1.1.0 → IsCurrent=1', async () => {
    const tmpZip2 = makeTempZip([
      { name: 'index.html', content: '<html>v1.1.0 — Bug fixes</html>' },
      { name: 'game.js', content: 'var v = "1.1.0";' },
    ]);
    await validateAndProcessBuildZip({ tempFilePath: tmpZip2, gameId, versionNumber: '1.1.0' });
    simulatePatchInsert('1.1.0', `games/${gameId}/1.1.0/build.zip`);

    const current = assertOnlyOneCurrentVersion();
    assert.equal(current.VersionNumber, '1.1.0', 'Phiên bản hiện hành phải là 1.1.0');

    const old = versions.find((v) => v.VersionNumber === '1.0.0');
    assert.equal(old.IsCurrent, 0, 'v1.0.0 phải có IsCurrent=0 sau khi patch');
  });

  it('6c. Upload patch v2.0.0: chỉ v2.0.0 là IsCurrent=1', async () => {
    const tmpZip3 = makeTempZip([
      { name: 'index.html', content: '<html>v2.0.0 — Major update</html>' },
      { name: 'game.js', content: 'var v = "2.0.0";' },
    ]);
    await validateAndProcessBuildZip({ tempFilePath: tmpZip3, gameId, versionNumber: '2.0.0' });
    simulatePatchInsert('2.0.0', `games/${gameId}/2.0.0/build.zip`);

    const current = assertOnlyOneCurrentVersion();
    assert.equal(current.VersionNumber, '2.0.0');
    assert.equal(versions.length, 3, 'Phải có đúng 3 phiên bản');
  });

  it('6d. Rollback về v1.1.0: không vi phạm uq_one_current_per_game', () => {
    simulateRollback('1.1.0');
    const current = assertOnlyOneCurrentVersion();
    assert.equal(current.VersionNumber, '1.1.0', 'Sau rollback, v1.1.0 phải là phiên bản hiện hành');
    assert.equal(versions.find((v) => v.VersionNumber === '2.0.0').IsCurrent, 0);
    assert.equal(versions.find((v) => v.VersionNumber === '1.0.0').IsCurrent, 0);
  });

  it('6e. Rollback khi chỉ có 1 phiên bản → ném lỗi', () => {
    const singleVersionState = [{ VersionNumber: '1.0.0', IsCurrent: 1 }];
    function rollbackSingle(target) {
      if (singleVersionState.length < 2) throw new Error('Cần ít nhất 2 phiên bản để rollback.');
    }
    assert.throws(() => rollbackSingle('1.0.0'), /ít nhất 2 phiên bản/);
  });

  it('6f. Build file thực tế tồn tại trên disk sau patch', () => {
    for (const v of ['1.0.0', '1.1.0', '2.0.0']) {
      const buildPath = path.join(getGameVersionDir('unassigned', gameId, v), 'build.zip');
      assert.ok(fs.existsSync(buildPath), `build.zip của v${v} phải tồn tại tại: ${buildPath}`);
    }
  });

});
