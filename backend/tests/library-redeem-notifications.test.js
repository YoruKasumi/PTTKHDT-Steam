'use strict';

const assert = require('node:assert/strict');
const { describe, it } = require('node:test');
const LibraryService = require('../src/services/LibraryService');
const NotificationService = require('../src/services/NotificationService');
const { createNotification } = require('../src/services/NotificationService');
const {
  NghiepVuException,
  ConflictException,
  ValidationException,
  NotFoundException,
} = require('../src/exceptions');

describe('Luồng 1.5: Thư viện & Đổi Key (Redeem Key)', () => {
  it('1.5.1 - LibraryService.redeemKey: Từ chối nếu mã key bị trống', async () => {
    const service = new LibraryService();
    await assert.rejects(
      () => service.redeemKey({ keyCode: '   ', user: { accountId: 'cus-1' } }),
      (err) => {
        assert.ok(err instanceof ValidationException);
        assert.match(err.message, /vui lòng nhập mã kích hoạt/i);
        return true;
      },
    );
  });

  it('1.5.2 - LibraryService.redeemKey: Báo lỗi 404 nếu mã key không tồn tại', async () => {
    const service = new LibraryService();
    service.transaction = async (cb) => cb({});
    service.licenseDAO.timKeyKichHoat = async () => null;

    await assert.rejects(
      () => service.redeemKey({ keyCode: 'NON-EXISTENT-KEY', user: { accountId: 'cus-1' } }),
      (err) => {
        assert.ok(err instanceof NotFoundException);
        assert.match(err.message, /không tồn tại/i);
        return true;
      },
    );
  });

  it('1.5.3 - LibraryService.redeemKey: Báo lỗi 422 nếu key đã qua sử dụng (Status=Used)', async () => {
    const service = new LibraryService();
    service.transaction = async (cb) => cb({});
    service.licenseDAO.timKeyKichHoat = async () => ({
      KeyID: 'key-1',
      KeyCode: 'USED-KEY',
      GameID: 'game-1',
      Status: 'Used',
    });

    await assert.rejects(
      () => service.redeemKey({ keyCode: 'USED-KEY', user: { accountId: 'cus-1' } }),
      (err) => {
        assert.ok(err instanceof NghiepVuException);
        assert.equal(err.status, 422);
        assert.equal(err.code, 'KEY_ALREADY_USED');
        return true;
      },
    );
  });

  it('1.5.4 - LibraryService.redeemKey: Báo lỗi 422 nếu key đã bị thu hồi (Status=Revoked)', async () => {
    const service = new LibraryService();
    service.transaction = async (cb) => cb({});
    service.licenseDAO.timKeyKichHoat = async () => ({
      KeyID: 'key-2',
      KeyCode: 'REVOKED-KEY',
      GameID: 'game-1',
      Status: 'Revoked',
    });

    await assert.rejects(
      () => service.redeemKey({ keyCode: 'REVOKED-KEY', user: { accountId: 'cus-1' } }),
      (err) => {
        assert.ok(err instanceof NghiepVuException);
        assert.equal(err.status, 422);
        assert.equal(err.code, 'KEY_REVOKED');
        return true;
      },
    );
  });

  it('1.5.5 - LibraryService.redeemKey: Báo lỗi Conflict 409 nếu khách đã sở hữu game', async () => {
    const service = new LibraryService();
    service.transaction = async (cb) => cb({});
    service.licenseDAO.timKeyKichHoat = async () => ({
      KeyID: 'key-3',
      KeyCode: 'VALID-KEY',
      GameID: 'game-1',
      Status: 'Unused',
    });
    service.licenseDAO.kiemTraGameDaSoHuu = async () => ({ LicenseID: 'lic-existing' });

    await assert.rejects(
      () => service.redeemKey({ keyCode: 'VALID-KEY', user: { accountId: 'cus-1' } }),
      (err) => {
        assert.ok(err instanceof ConflictException);
        assert.match(err.message, /đã sở hữu trò chơi này/i);
        return true;
      },
    );
  });

  it('1.5.6 - LibraryService.redeemKey: Kích hoạt thành công, cập nhật Used và cấp License SHA-256', async () => {
    const service = new LibraryService();
    let keyUpdated = false;
    let licenseCreated = null;

    service.transaction = async (cb) => cb({});
    service.licenseDAO.timKeyKichHoat = async () => ({
      KeyID: 'key-4',
      KeyCode: 'VALID-UNUSED-KEY',
      GameID: 'game-100',
      Status: 'Unused',
    });
    service.licenseDAO.kiemTraGameDaSoHuu = async () => null;
    service.licenseDAO.capNhatKeyDaSuDung = async ({ keyId, customerId }) => {
      assert.equal(keyId, 'key-4');
      assert.equal(customerId, 'cus-1');
      keyUpdated = true;
      return true;
    };
    service.licenseDAO.taoBanQuyenTuKey = async (payload) => {
      licenseCreated = payload;
      assert.equal(payload.customerId, 'cus-1');
      assert.equal(payload.gameId, 'game-100');
      assert.equal(payload.accessTokenHash.length, 64); // SHA-256 hex string
      return true;
    };
    service.licenseDAO.layThongTinGameDonGian = async () => ({
      GameID: 'game-100',
      Title: 'Hollow Knight',
      CoverImage: 'hollow.jpg',
    });

    const result = await service.redeemKey({
      keyCode: 'valid-unused-key', // test lower-case conversion
      user: { accountId: 'cus-1' },
    });

    assert.equal(keyUpdated, true);
    assert.ok(licenseCreated);
    assert.equal(result.success, true);
    assert.equal(result.gameId, 'game-100');
    assert.equal(result.title, 'Hollow Knight');
    assert.match(result.message, /kích hoạt thành công/i);
  });

  it('1.5.6b - LibraryService.redeemKey: Người dùng từng sở hữu nhưng bản quyền đã bị thu hồi (Revoked) thì VẪN được kích hoạt mã mới thành công', async () => {
    const service = new LibraryService();
    let licenseCreated = false;

    service.transaction = async (cb) => cb({});
    service.licenseDAO.timKeyKichHoat = async () => ({
      KeyID: 'key-revoked-rebuy',
      KeyCode: 'NEW-VALID-KEY',
      GameID: 'game-100',
      Status: 'Unused',
    });
    // kiemTraGameDaSoHuu chỉ query Status = 'Active', nên khi license cũ bị Revoked nó trả về null
    service.licenseDAO.kiemTraGameDaSoHuu = async () => null;
    service.licenseDAO.capNhatKeyDaSuDung = async () => true;
    service.licenseDAO.taoBanQuyenTuKey = async (payload) => {
      assert.equal(payload.customerId, 'cus-1');
      assert.equal(payload.gameId, 'game-100');
      licenseCreated = true;
      return true;
    };
    service.licenseDAO.layThongTinGameDonGian = async () => ({
      GameID: 'game-100',
      Title: 'Hollow Knight',
    });

    const result = await service.redeemKey({
      keyCode: 'NEW-VALID-KEY',
      user: { accountId: 'cus-1' },
    });

    assert.equal(licenseCreated, true);
    assert.equal(result.success, true);
  });

  it('1.5.7 - LibraryService.yeuCauXemThuVien: Trả về Sha256 trong thông tin game', async () => {
    const service = new LibraryService();
    service.licenseDAO.layDanhSachGameDaSoHuu = async () => [
      {
        LicenseID: 'lic-1',
        GameID: 'game-1',
        Title: 'Game 1',
        Source: 'Purchase',
        PurchaseDate: new Date(),
        LicenseStatus: 'Active',
        GameStatus: 'Approved',
        VersionNumber: '1.0.0',
        FileSize: 1048576,
        Sha256: 'a'.repeat(64),
        ChangeLog: 'Initial release',
      },
    ];

    const result = await service.yeuCauXemThuVien({ user: { accountId: 'cus-1' } });
    assert.equal(result.length, 1);
    assert.equal(result[0].sha256, 'a'.repeat(64));
    assert.equal(result[0].versionNumber, '1.0.0');
    assert.equal(result[0].changeLog, 'Initial release');
  });
});

describe('Luồng 1.5: Quản lý thông báo người dùng (NotificationService)', () => {
  it('1.5.8 - NotificationService.layDanhSachThongBao: Trả về danh sách và unreadCount', async () => {
    const service = new NotificationService();
    service.notificationDAO.layDanhSachThongBao = async () => [
      {
        NotificationID: 'notif-1',
        AccountID: 'acc-1',
        Type: 'PURCHASE',
        Content: 'Mua game thành công',
        SentAt: new Date(),
        IsRead: 0,
      },
      {
        NotificationID: 'notif-2',
        AccountID: 'acc-1',
        Type: 'SYSTEM',
        Content: 'Chào mừng bạn đến với Steam',
        SentAt: new Date(),
        IsRead: 1,
      },
    ];
    service.notificationDAO.demThongBaoChuaDoc = async () => 1;

    const res = await service.layDanhSachThongBao({ user: { accountId: 'acc-1' } });
    assert.equal(res.items.length, 2);
    assert.equal(res.unreadCount, 1);
    assert.equal(res.items[0].isRead, false);
    assert.equal(res.items[1].isRead, true);
    assert.equal(res.items[0].type, 'PURCHASE');
  });

  it('1.5.9 - NotificationService.danhDauDaDoc: Cập nhật thành công 1 thông báo', async () => {
    const service = new NotificationService();
    service.notificationDAO.danhDauDaDoc = async ({ notificationId, accountId }) => {
      assert.equal(notificationId, 'notif-1');
      assert.equal(accountId, 'acc-1');
      return true;
    };

    const res = await service.danhDauDaDoc({
      notificationId: 'notif-1',
      user: { accountId: 'acc-1' },
    });
    assert.equal(res.notificationId, 'notif-1');
    assert.equal(res.isRead, true);
  });

  it('1.5.10 - NotificationService.danhDauDaDoc: Ném lỗi 404 nếu không tìm thấy thông báo', async () => {
    const service = new NotificationService();
    service.notificationDAO.danhDauDaDoc = async () => false;

    await assert.rejects(
      () => service.danhDauDaDoc({ notificationId: 'notif-ghost', user: { accountId: 'acc-1' } }),
      (err) => {
        assert.ok(err instanceof NotFoundException);
        return true;
      },
    );
  });

  it('1.5.11 - NotificationService.danhDauTatCaDaDoc: Đánh dấu tất cả thông báo của tài khoản', async () => {
    const service = new NotificationService();
    service.notificationDAO.danhDauTatCaDaDoc = async ({ accountId }) => {
      assert.equal(accountId, 'acc-1');
      return 5;
    };

    const res = await service.danhDauTatCaDaDoc({ user: { accountId: 'acc-1' } });
    assert.equal(res.updatedCount, 5);
    assert.equal(res.isRead, true);
  });

  it('1.5.12 - createNotification: Exported helper function hoạt động chính xác', async () => {
    let saved = null;
    const service = new NotificationService();
    service.notificationDAO.createNotification = async (payload) => {
      saved = payload;
      return true;
    };

    const result = await service.createNotification({
      accountId: 'acc-2',
      type: 'REFUND',
      content: 'Hoàn tiền đơn hàng thành công',
    });

    assert.equal(result.accountId, 'acc-2');
    assert.equal(result.type, 'REFUND');
    assert.equal(result.content, 'Hoàn tiền đơn hàng thành công');
    assert.equal(result.isRead, false);
    assert.ok(result.notificationId);
  });
});
