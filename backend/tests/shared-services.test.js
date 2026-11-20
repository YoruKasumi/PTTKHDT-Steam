'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const { typeCast } = require('../src/config/database');
const NotificationService = require('../src/services/NotificationService');
const WalletDAO = require('../src/dao/WalletDAO');
const WalletService = require('../src/services/WalletService');

test('mysql2 maps TINYINT(1) values to booleans and preserves NULL', () => {
  const field = (value) => ({
    type: 'TINY',
    length: 1,
    string: () => value,
  });
  assert.equal(typeCast(field('1'), () => assert.fail('should typecast')), true);
  assert.equal(typeCast(field('0'), () => assert.fail('should typecast')), false);
  assert.equal(typeCast(field(null), () => assert.fail('should typecast')), null);
});

test('createNotification validates data and forwards the transaction connection', async () => {
  const service = new NotificationService();
  const conn = {};
  let inserted;
  service.notificationDAO.createNotification = async (notification, transaction) => {
    inserted = { notification, transaction };
  };

  const result = await service.createNotification({
    accountId: 'account-1',
    type: 'REVIEW_WARNING',
    content: 'Please review your content',
  }, conn);

  assert.equal(inserted.transaction, conn);
  assert.equal(inserted.notification.notificationId, result.notificationId);
  assert.match(result.notificationId, /^[0-9a-f-]{36}$/i);
  assert.equal(result.isRead, false);
  await assert.rejects(
    service.createNotification({ accountId: 'account-1', type: '', content: 'Message' }),
    { status: 422 },
  );
});

test('truTienVi records a Fee and updates the wallet in the caller transaction', async () => {
  const service = new WalletService();
  const conn = {};
  const calls = [];
  service.walletDAO.truyVanSoDuKhaDung = async (params, transaction) => {
    calls.push(['lock', params, transaction]);
    return { WalletID: 'wallet-1', Balance: 150000 };
  };
  service.walletDAO.capNhatSoDuVi = async (params, transaction) => {
    calls.push(['update', params, transaction]);
    return true;
  };
  service.walletDAO.luuLichSuGiaoDich = async (params, transaction) => {
    calls.push(['record', params, transaction]);
  };

  const result = await service.truTienVi({
    accountId: 'account-1',
    amount: 100000,
    type: 'Fee',
  }, conn);

  assert.equal(result.type, 'Fee');
  assert.equal(result.balance, 50000);
  assert.deepEqual(calls.map(([name]) => name), ['lock', 'update', 'record']);
  assert.ok(calls.every(([, , transaction]) => transaction === conn));
  assert.equal(calls[2][1].amount, 100000);
});

test('truTienVi rejects insufficient balance before updating or recording', async () => {
  const service = new WalletService();
  let writes = 0;
  service.walletDAO.truyVanSoDuKhaDung = async () => ({ WalletID: 'wallet-1', Balance: 50 });
  service.walletDAO.capNhatSoDuVi = async () => { writes += 1; return true; };
  service.walletDAO.luuLichSuGiaoDich = async () => { writes += 1; };
  service.transaction = (operation) => operation({});

  await assert.rejects(
    service.truTienVi({ accountId: 'account-1', amount: 100, type: 'Fee' }),
    (error) => error.status === 422
      && error.details.required === 100
      && error.details.available === 50,
  );
  assert.equal(writes, 0);
});

test('wallet DAO debits safely and inserts Fee using the escaped transaction table name', async () => {
  const dao = new WalletDAO();
  const conn = {};
  const queries = [];
  dao.query = async (sql, params, transaction) => {
    queries.push({ sql, params, transaction });
    return { affectedRows: 1 };
  };

  assert.equal(await dao.capNhatSoDuVi({
    walletId: 'wallet-1',
    amount: 100000,
    operation: 'debit',
  }, conn), true);
  await dao.luuLichSuGiaoDich({
    transactionId: 'transaction-1',
    walletId: 'wallet-1',
    orderId: null,
    type: 'Fee',
    amount: 100000,
  }, conn);

  assert.match(queries[0].sql, /Balance = Balance - \?/);
  assert.deepEqual(queries[0].params, [100000, 'wallet-1', 100000]);
  assert.match(queries[1].sql, /INSERT INTO `TRANSACTION`/);
  assert.deepEqual(queries[1].params, ['transaction-1', 'wallet-1', null, 'Fee', 100000]);
  assert.ok(queries.every((query) => query.transaction === conn));
});
