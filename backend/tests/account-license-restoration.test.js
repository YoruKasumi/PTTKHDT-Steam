'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const AccountService = require('../src/services/AccountService');

function createService(status, previouslyBanned = false) {
  const calls = [];
  const service = new AccountService();
  service.transaction = (callback) => callback({});
  service.accountDAO = {
    layTaiKhoanTheoId: async () => ({ AccountID: 'customer-1', Status: status }),
    kiemTraLaQuanTri: async () => null,
    kiemTraTaiKhoanTungBiKhoaVinhVien: async () => previouslyBanned ? { LogID: 'ban-log' } : null,
    capNhatTrangThaiTaiKhoan: async (params) => calls.push(['setStatus', params]),
    taoThongBaoTaiKhoan: async (params) => calls.push(['notify', params]),
  };
  service.licenseDAO = {
    thuHoiBanQuyenTaiKhoan: async (params) => {
      calls.push(['revoke', params]);
      return 3;
    },
    khoiPhucBanQuyenTaiKhoan: async (params) => {
      calls.push(['restore', params]);
      return 2;
    },
  };
  service.auditLogService = {
    recordLog: async (params) => calls.push(['audit', params]),
  };
  return { service, calls };
}

test('suspending an account revokes active licenses and records the count', async () => {
  const { service, calls } = createService('Active');
  const result = await service.yeuCauTamKhoaTaiKhoan({
    accountId: 'customer-1',
    reason: 'Policy violation',
    suspensionHours: 24,
    user: { accountId: 'admin-1' },
  });

  assert.equal(result.revokedLicenses, 3);
  assert.ok(calls.some(([type]) => type === 'revoke'));
  const audit = calls.find(([type]) => type === 'audit')[1];
  assert.equal(JSON.parse(audit.detail).revokedLicenses, 3);
});

test('suspending an account requires a positive whole-hour duration', async () => {
  const { service } = createService('Active');
  await assert.rejects(
    service.yeuCauTamKhoaTaiKhoan({
      accountId: 'customer-1',
      reason: 'Policy violation',
      suspensionHours: 0,
      user: { accountId: 'admin-1' },
    }),
    /Thời hạn tạm khóa/,
  );
});

test('unlocking a suspended account restores licenses and informs the customer', async () => {
  const { service, calls } = createService('Suspended');
  const result = await service.yeuCauMoKhoaTaiKhoan({
    accountId: 'customer-1',
    reason: 'Review complete',
    user: { accountId: 'admin-1' },
  });

  assert.equal(result.restoredLicenses, 2);
  assert.ok(calls.some(([type]) => type === 'restore'));
  assert.match(calls.find(([type]) => type === 'notify')[1].content, /khôi phục 2 bản quyền/);
});

test('unlocking an account that was ever banned does not restore licenses', async () => {
  const { service, calls } = createService('Suspended', true);
  const result = await service.yeuCauMoKhoaTaiKhoan({
    accountId: 'customer-1',
    reason: 'Reviewed',
    user: { accountId: 'admin-1' },
  });

  assert.equal(result.restoredLicenses, 0);
  assert.ok(!calls.some(([type]) => type === 'restore'));
  assert.match(calls.find(([type]) => type === 'notify')[1].content, /từng bị khóa vĩnh viễn/);
  const audit = calls.find(([type]) => type === 'audit')[1];
  assert.equal(JSON.parse(audit.detail).restorationSkippedBecausePreviouslyBanned, true);
});

test('expired suspension reactivates the account, restores licenses, audits and notifies', async () => {
  const { service, calls } = createService('Suspended');
  service.accountDAO.layTaiKhoanTamKhoaDaHetHan = async () => [{
    AccountID: 'customer-1',
    SuspendUntil: '2026-11-13 12:00:00',
  }];

  const expiredCount = await service.expireSuspendedAccounts();

  assert.equal(expiredCount, 1);
  assert.deepEqual(calls.find(([type]) => type === 'setStatus')[1], {
    accountId: 'customer-1',
    status: 'Active',
  });
  assert.ok(calls.some(([type]) => type === 'restore'));
  const audit = calls.find(([type]) => type === 'audit')[1];
  assert.equal(audit.accountId, null);
  assert.equal(audit.system, true);
  assert.equal(audit.action, 'ACCOUNT_SUSPENSION_EXPIRED');
  assert.equal(JSON.parse(audit.detail).restoredLicenses, 2);
  assert.match(calls.find(([type]) => type === 'notify')[1].content, /đã kết thúc/);
});

test('expired suspension does not restore licenses for an account with ban history', async () => {
  const { service, calls } = createService('Suspended', true);
  service.accountDAO.layTaiKhoanTamKhoaDaHetHan = async () => [{
    AccountID: 'customer-1',
    SuspendUntil: '2026-11-13 12:00:00',
  }];

  assert.equal(await service.expireSuspendedAccounts(), 1);
  assert.ok(!calls.some(([type]) => type === 'restore'));
  const audit = calls.find(([type]) => type === 'audit')[1];
  assert.equal(JSON.parse(audit.detail).restorationSkippedBecausePreviouslyBanned, true);
  assert.match(calls.find(([type]) => type === 'notify')[1].content, /từng bị khóa vĩnh viễn/);
});
