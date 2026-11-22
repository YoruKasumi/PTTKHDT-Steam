'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const WithdrawalService = require('../src/services/WithdrawalService');

test('developer withdrawal history is scoped to the authenticated developer and includes available revenue', async () => {
  const calls = [];
  const service = new WithdrawalService({
    async kiemTraSoTienKhaDung(params) {
      calls.push(['balance', params.developerId]);
      return { availableRevenue: 2500000 };
    },
    async layLichSuRutTien(developerId) {
      calls.push(['history', developerId]);
      return [{
        RequestID: 'request-1',
        Amount: '1000000',
        BankInfo: 'Bank account',
        Status: 'Pending',
        RequestDate: '2026-11-01T10:00:00Z',
      }];
    },
  });

  const result = await service.yeuCauXemLichSuRutTien({ user: { accountId: 'developer-1' } });

  assert.deepEqual(calls, [['balance', 'developer-1'], ['history', 'developer-1']]);
  assert.equal(result.availableRevenue, 2500000);
  assert.deepEqual(result.withdrawals, [{
    requestId: 'request-1',
    amount: 1000000,
    bankInfo: 'Bank account',
    status: 'Pending',
    requestDate: '2026-11-01T10:00:00Z',
  }]);
});

test('withdrawal admin list defaults to pending and supports all statuses', async () => {
  const requestedStatuses = [];
  const service = new WithdrawalService({
    async layDanhSachLenhRutTien(params) {
      requestedStatuses.push(params.status);
      return [];
    },
  });

  assert.deepEqual(await service.layChiTietLenhRutTien({}), []);
  assert.deepEqual(await service.layChiTietLenhRutTien({ status: 'all' }), []);
  assert.deepEqual(requestedStatuses, ['Pending', 'all']);
  await assert.rejects(service.layChiTietLenhRutTien({ status: 'unknown' }), { status: 422 });
});

test('developer withdrawal requires bank details that fit the database column', async () => {
  const service = new WithdrawalService();

  await assert.rejects(
    service.guiYeuCauRutDoanhThu({ amount: 1000000, bankInfo: '   ' }),
    { status: 422 },
  );
  await assert.rejects(
    service.guiYeuCauRutDoanhThu({ amount: 1000000, bankInfo: 'x'.repeat(101) }),
    { status: 422 },
  );
});
