'use strict';

// Test cho 2 luồng mới:
//   1. Tải game (LibraryService.yeuCauTaiGame) — mô phỏng luồng tải thật, không đổi bản quyền.
//   2. Khóa tài khoản và giữ chính sách thu hồi/khôi phục bản quyền hiện có.

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const jwt = require('jsonwebtoken');
const { describe, it, after } = require('node:test');

// Phải đặt TRƯỚC các require: env.js đọc STORAGE_LOCAL_DIR đúng 1 lần khi load module.
process.env.STORAGE_LOCAL_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'sstore-dl-'));

const LibraryService = require('../src/services/LibraryService');
const AccountService = require('../src/services/AccountService');
const storagePaths = require('../src/utils/storagePaths');
const env = require('../src/config/env');
const {
  ValidationException,
  ForbiddenException,
  NotFoundException,
} = require('../src/exceptions');

describe('Luồng: Tải game (yeuCauTaiGame)', () => {
  after(() => {
    fs.rmSync(process.env.STORAGE_LOCAL_DIR, { recursive: true, force: true });
  });

  it('Tải game: Từ chối nếu thiếu gameId', async () => {
    const service = new LibraryService();
    await assert.rejects(
      () => service.yeuCauTaiGame({ user: { accountId: 'cus-1' } }),
      ValidationException,
    );
  });

  it('Tải game: Chặn 403 nếu không sở hữu / bản quyền đã thu hồi', async () => {
    const service = new LibraryService();
    service.licenseDAO.kiemTraTokenBanQuyen = async () => null;
    await assert.rejects(
      () => service.yeuCauTaiGame({ gameId: 'game-x', user: { accountId: 'cus-1' } }),
      (err) => {
        assert.ok(err instanceof ForbiddenException);
        assert.match(err.message, /chưa sở hữu|thu hồi/i);
        return true;
      },
    );
  });

  it('Tải game: Báo 404 nếu bản build chưa được upload', async () => {
    const service = new LibraryService();
    service.licenseDAO.kiemTraTokenBanQuyen = async () => ({
      LicenseID: 'l-1',
      DeveloperID: 'dev-1',
      VersionNumber: '1.0.0',
      Sha256: null,
    });
    await assert.rejects(
      () => service.yeuCauTaiGame({ gameId: 'game-dl-1', user: { accountId: 'cus-1' } }),
      (err) => {
        assert.ok(err instanceof NotFoundException);
        assert.match(err.message, /chưa sẵn sàng/i);
        return true;
      },
    );
  });

  it('Tải game: Trả metadata build.zip (kích thước, sha256, tên file) khi sở hữu hợp lệ', async () => {
    const service = new LibraryService();
    service.licenseDAO.kiemTraTokenBanQuyen = async () => ({
      LicenseID: 'l-2',
      DeveloperID: 'dev-1',
      VersionNumber: '1.0.0',
      Sha256: 'a'.repeat(64),
    });

    const versionDir = storagePaths.getGameVersionDir('dev-1', 'game-dl-1', '1.0.0');
    fs.mkdirSync(versionDir, { recursive: true });
    const payload = Buffer.from('PK-demo-build-zip-content');
    fs.writeFileSync(path.join(versionDir, 'build.zip'), payload);

    const meta = await service.yeuCauTaiGame({ gameId: 'game-dl-1', user: { accountId: 'cus-1' } });

    assert.equal(meta.allowed, true);
    assert.equal(meta.versionNumber, '1.0.0');
    assert.equal(meta.fileSize, payload.length);
    assert.equal(meta.sha256, 'a'.repeat(64));
    assert.equal(meta.fileName, 'game-game-dl-1-v1.0.0.zip');
    assert.ok(meta.filePath.endsWith(path.join('1.0.0', 'build.zip')));
  });

  it('Tải game: Dự phòng sang cấu trúc thư mục build cũ (legacy) nếu cấu trúc mới không có file', async () => {
    const service = new LibraryService();
    service.licenseDAO.kiemTraTokenBanQuyen = async () => ({
      LicenseID: 'l-3',
      DeveloperID: 'dev-legacy',
      VersionNumber: '2.0.0',
      Sha256: 'b'.repeat(64),
    });

    const legacyDir = storagePaths.getLegacyGameVersionDir('game-dl-legacy', '2.0.0');
    fs.mkdirSync(legacyDir, { recursive: true });
    fs.writeFileSync(path.join(legacyDir, 'build.zip'), Buffer.from('legacy-build'));

    const meta = await service.yeuCauTaiGame({ gameId: 'game-dl-legacy', user: { accountId: 'cus-1' } });
    assert.ok(meta.filePath.startsWith(storagePaths.LEGACY_BUILDS_ROOT));
  });

  it('Phục vụ tệp game: kiểm tra lại license đang hoạt động trước mỗi yêu cầu tệp', async () => {
    const service = new LibraryService();
    service.licenseDAO.kiemTraHopLeTheoThoiGianThuc = async () => null;
    const gameId = 'game-revoked';
    const launchToken = jwt.sign({
      type: 'GAME_LAUNCH',
      licenseId: 'license-revoked',
      customerId: 'customer-1',
      gameId,
      developerId: 'dev-1',
    }, env.jwtSecret, { expiresIn: '1m' });

    await assert.rejects(
      () => service.serveGameFile({
        gameId,
        version: '1.0.0',
        filePath: 'index.html',
        launchToken,
      }),
      (error) => {
        assert.ok(error instanceof ForbiddenException);
        assert.match(error.message, /Bản quyền không tồn tại/i);
        return true;
      },
    );
  });
});

describe('Luồng: khóa tài khoản và giữ chính sách khôi phục bản quyền', () => {
  function buildAccountService(calls, status = 'Active', previouslyBanned = false) {
    const service = new AccountService();
    service.transaction = async (cb) => cb({});
    service.accountDAO = {
      layTaiKhoanTheoId: async () => ({ AccountID: 'acc-1', Status: status }),
      kiemTraLaQuanTri: async () => null,
      kiemTraTaiKhoanTungBiKhoaVinhVien: async () => (previouslyBanned ? { LogID: 'ban-1' } : null),
      capNhatTrangThaiTaiKhoan: async (params) => calls.statusUpdates.push(params),
      taoThongBaoTaiKhoan: async (params) => calls.notifications.push(params),
    };
    service.auditLogService = { recordLog: async (params) => calls.auditLogs.push(params) };
    service.licenseDAO = {
      thuHoiBanQuyenTaiKhoan: async (params) => {
        calls.revocations.push(params);
        return 2;
      },
      khoiPhucBanQuyenTaiKhoan: async (params) => {
        calls.restorations.push(params);
        return 2;
      },
    };
    return service;
  }

  function createCalls() {
    return { statusUpdates: [], revocations: [], restorations: [], auditLogs: [], notifications: [] };
  }

  it('Khóa vĩnh viễn: thu hồi license đang hoạt động và ghi nhận audit', async () => {
    const calls = createCalls();
    const service = buildAccountService(calls);

    const result = await service.capNhatTrangThai(
      { accountId: 'acc-1', reason: 'vi pham nghiem trong', user: { accountId: 'admin-1' } },
      'Banned',
      'ACCOUNT_BAN',
      'Khóa vĩnh viễn',
    );

    assert.equal(result.status, 'Banned');
    assert.equal(result.revokedLicenses, 2);
    assert.deepEqual(calls.revocations, [{ customerId: 'acc-1' }]);
    assert.equal(JSON.parse(calls.auditLogs[0].detail).revokedLicenses, 2);
  });

  it('Tạm khóa: lưu thời hạn và thu hồi license đang hoạt động', async () => {
    const calls = createCalls();
    const service = buildAccountService(calls);

    const result = await service.capNhatTrangThai(
      { accountId: 'acc-1', reason: 'can tra xac minh', suspensionHours: 48, user: { accountId: 'admin-1' } },
      'Suspended',
      'ACCOUNT_SUSPEND',
      'Tạm khóa',
    );

    assert.equal(result.revokedLicenses, 2);
    assert.deepEqual(calls.revocations, [{ customerId: 'acc-1' }]);
    assert.equal(calls.statusUpdates[0].suspensionHours, 48);
    assert.equal(JSON.parse(calls.auditLogs[0].detail).suspensionHours, 48);
  });

  it('Mở khóa tạm thời: khôi phục license đã thu hồi do tạm khóa', async () => {
    const calls = createCalls();
    const service = buildAccountService(calls, 'Suspended');

    const result = await service.capNhatTrangThai(
      { accountId: 'acc-1', reason: 'duoc giai trich', user: { accountId: 'admin-1' } },
      'Active',
      'ACCOUNT_UNBAN',
      'Mở khóa',
    );

    assert.equal(result.restoredLicenses, 2);
    assert.deepEqual(calls.restorations, [{ customerId: 'acc-1' }]);
  });

  it('Không khôi phục license khi tài khoản có lịch sử khóa vĩnh viễn', async () => {
    const calls = createCalls();
    const service = buildAccountService(calls, 'Suspended', true);

    const result = await service.capNhatTrangThai(
      { accountId: 'acc-1', reason: 'reviewed', user: { accountId: 'admin-1' } },
      'Active',
      'ACCOUNT_UNBAN',
      'Mở khóa',
    );

    assert.equal(result.restoredLicenses, 0);
    assert.deepEqual(calls.restorations, []);
  });
});
