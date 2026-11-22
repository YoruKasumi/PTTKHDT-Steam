'use strict';

const assert = require('node:assert/strict');
const { test, describe, beforeEach } = require('node:test');
const AuthService = require('../src/services/AuthService');
const WithdrawalService = require('../src/services/WithdrawalService');
const otpStore = require('../src/utils/otpStore');
const token = require('../src/utils/token');
const { revokeToken, isTokenRevoked } = require('../src/utils/tokenRevocation');
const { mockSentMails, clearMockSentMails } = require('../src/utils/mailer');

describe('M1 & M6: SMTP OTP - Đăng ký & Quên mật khẩu', () => {
  beforeEach(() => {
    otpStore.clearAll();
    clearMockSentMails();
  });

  test('M1: Gửi OTP đăng ký tài khoản thành công qua mailer mock', async () => {
    const dao = {
      kiemTraTenTaiKhoan: async () => null,
      kiemTraTaiKhoan: async () => null,
    };
    const service = new AuthService(dao);

    const res = await service.sendOtp({ email: 'newuser@example.com', purpose: 'register' });
    assert.equal(res.success, true);
    assert.equal(res.email, 'newuser@example.com');

    // Mailer đã ghi nhận email gửi đi
    const mails = mockSentMails.filter((m) => m.to === 'newuser@example.com');
    assert.equal(mails.length, 1);
    assert.match(mails[0].subject, /đăng ký/i);

    // Chặn gửi lại liên tục trong 60 giây (Cooldown)
    await assert.rejects(
      service.sendOtp({ email: 'newuser@example.com', purpose: 'register' }),
      (err) => err.code === 'OTP_COOLDOWN' && err.status === 429,
    );
  });

  test('M1: Chặn gửi OTP đăng ký nếu email đã được sử dụng (409 Conflict)', async () => {
    const dao = {
      kiemTraTenTaiKhoan: async () => ({ AccountID: 'acc-1' }),
    };
    const service = new AuthService(dao);

    await assert.rejects(
      service.sendOtp({ email: 'existing@example.com', purpose: 'register' }),
      (err) => err.code === 'ACCOUNT_EXISTS' && err.status === 409,
    );
  });

  test('M6: Gửi OTP quên mật khẩu và đặt lại mật khẩu mới thành công', async () => {
    let updatedHash = null;
    const dao = {
      kiemTraTaiKhoan: async ({ account }) => {
        if (account === 'user@example.com') {
          return { AccountID: 'acc-100', Email: 'user@example.com', Status: 'Active' };
        }
        return null;
      },
      capNhatMatKhauMoi: async ({ accountId, passwordHash }) => {
        updatedHash = passwordHash;
        return true;
      },
    };
    const service = new AuthService(dao);

    // 1. Gửi OTP
    const res = await service.sendOtp({ email: 'user@example.com', purpose: 'forgot_password' });
    assert.equal(res.success, true);

    const mails = mockSentMails.filter((m) => m.to === 'user@example.com');
    assert.equal(mails.length, 1);
    assert.match(mails[0].subject, /đặt lại mật khẩu/i);

    // Trích xuất mã OTP từ nội dung email mock
    const match = mails[0].html.match(/>\s*(\d{6})\s*</);
    assert.ok(match, 'Phải tìm thấy mã OTP 6 chữ số trong email');
    const otp = match[1];

    // 2. Nhập sai OTP -> báo lỗi
    await assert.rejects(
      service.guiYeuCauDatLaiMatKhau({
        email: 'user@example.com',
        otp: '000000',
        newPassword: 'new-password-123',
      }),
      (err) => err.code === 'OTP_INVALID',
    );

    // 3. Nhập đúng OTP -> thành công
    const resetRes = await service.guiYeuCauDatLaiMatKhau({
      email: 'user@example.com',
      otp,
      newPassword: 'new-password-123',
    });
    assert.equal(resetRes.success, true);
    assert.ok(updatedHash, 'PasswordHash phải được cập nhật');

    // 4. Mã OTP không thể tái sử dụng
    await assert.rejects(
      service.guiYeuCauDatLaiMatKhau({
        email: 'user@example.com',
        otp,
        newPassword: 'another-password',
      }),
      (err) => err.code === 'OTP_EXPIRED',
    );
  });
});

describe('M2: Thu hồi JWT Token khi Đăng xuất (Revocation / Blacklist)', () => {
  test('Token ký mới có jti, sau khi revoke thì isRevoked = true', () => {
    const jwtString = token.sign({ accountId: 'acc-1', username: 'testuser' });
    const payload = token.verify(jwtString);
    assert.ok(payload.jti, 'Token payload phải có claim jti');

    assert.equal(token.isRevoked(payload.jti), false);

    token.revoke(payload.jti, payload.exp);
    assert.equal(token.isRevoked(payload.jti), true);
  });

  test('AuthService.guiYeuCauDangXuat thu hồi jti của user', async () => {
    const service = new AuthService();
    const jti = 'custom-jti-' + Date.now();
    assert.equal(token.isRevoked(jti), false);

    const res = await service.guiYeuCauDangXuat({
      user: { accountId: 'acc-1', jti, exp: Math.floor(Date.now() / 1000) + 3600 },
    });
    assert.equal(res.loggedOut, true);
    assert.equal(token.isRevoked(jti), true);
  });
});

describe('M3, M4, M5: Nghiệp vụ Rút doanh thu (BankClient, Locking, AuditLog, Notification)', () => {
  test('M5: guiYeuCauRutDoanhThu khóa dòng DEVELOPER (khoaDeveloper) trong transaction', async () => {
    let lockedDev = false;
    let createdTicket = null;
    const dao = {
      khoaDeveloper: async () => {
        lockedDev = true;
        return { AccountID: 'dev-1', VerifyStatus: 'Approved' };
      },
      kiemTraSoTienKhaDung: async () => ({
        grossSales: 10000000,
        totalRefunds: 0,
        devShare: 7000000,
        totalWithdrawn: 0,
        availableRevenue: 7000000,
      }),
      taoLenhRutTienVaTamGiuSoDu: async (params) => {
        createdTicket = params;
        return params;
      },
    };
    const sysDao = {
      truyVanThamSoToanCuc: async () => [
        { ParamKey: 'MIN_WITHDRAWAL_VND', ParamValue: '500000' },
        { ParamKey: 'PLATFORM_COMMISSION_PERCENT', ParamValue: '30' },
      ],
    };
    const service = new WithdrawalService(dao, sysDao);
    service.transaction = async (cb) => cb({});

    const result = await service.guiYeuCauRutDoanhThu({
      user: { accountId: 'dev-1' },
      amount: 1000000,
      bankInfo: 'VIB - 0123456789 - NGUYEN VAN A',
    });

    assert.equal(lockedDev, true, 'Bắt buộc gọi khoaDeveloper FOR UPDATE');
    assert.equal(result.success, true);
    assert.equal(createdTicket.amount, 1000000);
  });

  test('M3: guiYeuCauChuyenKhoan gọi BankClient, ghi AuditLog và Notification', async () => {
    let bankCalled = false;
    let auditRecorded = false;
    let notifSent = false;
    let approved = false;

    const dao = {
      khoaLenhRutTien: async () => ({
        RequestID: 'req-01',
        DeveloperID: 'dev-01',
        Amount: 2000000,
        BankInfo: 'VCB - 987654321',
        Status: 'Pending',
      }),
      capNhatTrangThaiRutTienThanhCong: async () => {
        approved = true;
        return true;
      },
      timViCustomer: async () => null,
    };
    const bankClient = {
      yeuCauChuyenKhoanNganHang: async (params) => {
        bankCalled = true;
        return { success: true, referenceCode: 'BANK-REF-999' };
      },
    };
    const auditLogService = {
      recordLog: async (log) => {
        auditRecorded = true;
        assert.equal(log.action, 'withdrawal.approve');
        assert.equal(log.targetId, 'req-01');
      },
    };
    const notificationService = {
      createNotification: async (notif) => {
        notifSent = true;
        assert.equal(notif.accountId, 'dev-01');
        assert.match(notif.content, /phê duyệt/i);
      },
    };

    const service = new WithdrawalService(dao, {}, bankClient);
    service.auditLogService = auditLogService;
    service.notificationService = notificationService;
    service.transaction = async (cb) => cb({});

    const res = await service.guiYeuCauChuyenKhoan({
      requestId: 'req-01',
      user: { accountId: 'staff-01' },
    });

    assert.equal(res.success, true);
    assert.equal(bankCalled, true, 'Phải gọi BankClient giải ngân');
    assert.equal(approved, true, 'Phải cập nhật Approved');
    assert.equal(auditRecorded, true, 'Phải ghi AuditLog');
    assert.equal(notifSent, true, 'Phải gửi thông báo');
  });

  test('M3: guiYeuCauTuChoi bắt buộc có reason, cập nhật Rejected, AuditLog và Notification', async () => {
    let rejected = false;
    let auditRecorded = false;
    let notifSent = false;

    const dao = {
      khoaLenhRutTien: async () => ({
        RequestID: 'req-02',
        DeveloperID: 'dev-02',
        Amount: 1500000,
        BankInfo: 'TCB - 123456789',
        Status: 'Pending',
      }),
      hoanLaiSoDuTamGiuVaoViNPH: async () => {
        rejected = true;
        return true;
      },
    };
    const auditLogService = {
      recordLog: async (log) => {
        auditRecorded = true;
        assert.equal(log.action, 'withdrawal.reject');
      },
    };
    const notificationService = {
      taoThongBaoChoDeveloper: async (notif) => {
        notifSent = true;
        assert.equal(notif.developerId, 'dev-02');
        assert.match(notif.content, /từ chối/i);
      },
    };

    const service = new WithdrawalService(dao, {});
    service.auditLogService = auditLogService;
    service.notificationService = notificationService;
    service.transaction = async (cb) => cb({});

    // 1. Thiếu reason -> ném lỗi
    await assert.rejects(
      service.guiYeuCauTuChoi({ requestId: 'req-02', reason: '   ' }),
      (err) => err.status === 422,
    );

    // 2. Có reason -> thành công
    const res = await service.guiYeuCauTuChoi({
      requestId: 'req-02',
      reason: 'Thông tin tài khoản ngân hàng không chính chủ',
      user: { accountId: 'admin-01' },
    });

    assert.equal(res.success, true);
    assert.equal(rejected, true);
    assert.equal(auditRecorded, true);
    assert.equal(notifSent, true);
  });
});
