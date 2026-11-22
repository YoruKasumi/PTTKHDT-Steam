'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const LicenseDAO = require('../src/dao/LicenseDAO');

test('launch license query returns build size and SHA-256 metadata', async () => {
  const dao = new LicenseDAO();
  let capturedSql;
  dao.one = async (sql) => {
    capturedSql = sql;
    return { FileSize: 1234, Sha256: 'a'.repeat(64) };
  };

  const result = await dao.kiemTraTokenBanQuyen({ customerId: 'customer-1', gameId: 'game-1' });

  assert.match(capturedSql, /gv\.FileSize, gv\.Sha256/);
  assert.equal(result.FileSize, 1234);
  assert.equal(result.Sha256, 'a'.repeat(64));
});

test('license restoration restores only suspension-revoked devices up to the three-device limit', async () => {
  const dao = new LicenseDAO();
  const queries = [];
  dao.query = async (sql, params, conn) => {
    queries.push({ sql, params, conn });
    if (/SELECT LicenseID/.test(sql)) {
      return [{ LicenseID: 'license-1' }, { LicenseID: 'license-2' }];
    }
    if (/SELECT DeviceID/.test(sql)) {
      assert.equal(params[0], 'license-1');
      assert.equal(params[1], 1);
      return [{ DeviceID: 'device-3' }];
    }
    return [];
  };
  dao.demThietBiActive = async ({ licenseId }) => (licenseId === 'license-1' ? 2 : 3);

  const restored = await dao.khoiPhucBanQuyenTaiKhoan({ customerId: 'customer-1' }, {});

  assert.equal(restored, 2);
  assert.ok(queries.some(({ sql }) => /RevokedReason = 'AccountSuspended'/.test(sql) && /SET Status = 'Active'/.test(sql)));
  assert.equal(queries.filter(({ sql }) => /SELECT DeviceID/.test(sql)).length, 1);
  const deviceUpdate = queries.find(({ sql }) => /UPDATE LICENSE_DEVICE/.test(sql));
  assert.match(deviceUpdate.sql, /RevokedReason = 'AccountSuspended'/);
  assert.deepEqual(deviceUpdate.params, ['device-3']);
});
