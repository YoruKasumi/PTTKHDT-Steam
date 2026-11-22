'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const AccountDAO = require('../src/dao/AccountDAO');

test('expired suspension selection is bounded, locked, and uses UTC', async () => {
  const dao = new AccountDAO();
  let captured;
  dao.query = async (sql, params, conn) => {
    captured = { sql, params, conn };
    return [];
  };
  const connection = {};

  await dao.layTaiKhoanTamKhoaDaHetHan(connection);

  assert.match(captured.sql, /Status = 'Suspended'/);
  assert.match(captured.sql, /SuspendUntil <= UTC_TIMESTAMP\(\)/);
  assert.match(captured.sql, /LIMIT 50\s+FOR UPDATE/);
  assert.deepEqual(captured.params, []);
  assert.equal(captured.conn, connection);
});

test('account status updates set an expiry only for suspensions and clear it otherwise', async () => {
  const dao = new AccountDAO();
  let captured;
  dao.query = async (sql, params, conn) => {
    captured = { sql, params, conn };
    return { affectedRows: 1 };
  };

  await dao.capNhatTrangThaiTaiKhoan({
    accountId: 'customer-1',
    status: 'Suspended',
    suspensionHours: 24,
  });
  assert.match(captured.sql, /TIMESTAMPADD\(HOUR, \?, UTC_TIMESTAMP\(\)\)/);
  assert.deepEqual(captured.params, ['Suspended', 'Suspended', 24, 'customer-1']);

  await dao.capNhatTrangThaiTaiKhoan({ accountId: 'customer-1', status: 'Active' });
  assert.match(captured.sql, /ELSE NULL/);
  assert.deepEqual(captured.params, ['Active', 'Active', null, 'customer-1']);
});
