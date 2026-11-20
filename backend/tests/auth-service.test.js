'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const AuthService = require('../src/services/AuthService');
const password = require('../src/utils/password');
const token = require('../src/utils/token');

function createService(account = null) {
  const created = [];
  const dao = {
    kiemTraTenTaiKhoan: async () => null,
    taoTaiKhoanMoi: async (params) => {
      created.push(params);
      return 'new-account-id';
    },
    kiemTraTaiKhoan: async () => account,
  };
  const service = new AuthService(dao);
  service.transaction = (callback) => callback({});
  return { service, created };
}

test('registration rejects the simulated failure OTP without creating an account', async () => {
  const { service, created } = createService();
  await assert.rejects(
    service.guiThongTinDangKy({
      username: 'test_user',
      email: 'test@example.test',
      password: 'strong-password-123',
      otp: '0000',
    }),
    (error) => error.code === 'OTP_INVALID' && error.status === 400,
  );
  assert.equal(created.length, 0);
});

test('registration does not allow the simulated OTP in production', async () => {
  const { service, created } = createService();
  const previousNodeEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  try {
    await assert.rejects(
      service.guiThongTinDangKy({
        username: 'test_user',
        email: 'test@example.test',
        password: 'strong-password-123',
        otp: '1234',
      }),
      (error) => error.code === 'OTP_NOT_CONFIGURED' && error.status === 503,
    );
    assert.equal(created.length, 0);
  } finally {
    if (previousNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousNodeEnv;
  }
});

test('registration accepts a non-zero four-digit demo OTP and stores only a password hash', async () => {
  const { service, created } = createService();
  const result = await service.guiThongTinDangKy({
    username: 'test_user',
    email: 'TEST@example.test',
    displayName: 'Test User',
    password: 'strong-password-123',
    otp: '1234',
  });

  assert.equal(result.accountId, 'new-account-id');
  assert.equal(result.otpVerified, true);
  assert.equal(created[0].email, 'test@example.test');
  assert.notEqual(created[0].passwordHash, 'strong-password-123');
  assert.equal(await password.compare('strong-password-123', created[0].passwordHash), true);
});

test('login returns a JWT containing account roles after password verification', async () => {
  const passwordHash = await password.hash('strong-password-123');
  const { service } = createService({
    AccountID: 'account-123',
    Username: 'demo_admin',
    PasswordHash: passwordHash,
    Email: 'demo.admin@example.test',
    DisplayName: 'Demo Administrator',
    Status: 'Active',
    IsCustomer: 0,
    IsDeveloper: 0,
    IsManager: 0,
    IsAdmin: 1,
  });

  const result = await service.guiThongTinDangNhap({
    account: 'demo_admin',
    password: 'strong-password-123',
  });
  assert.deepEqual(result.user.roles, ['Admin']);
  assert.equal(token.verify(result.token).accountId, 'account-123');
  assert.deepEqual(token.verify(result.token).roles, ['Admin']);
});

test('login rejects invalid passwords and inactive accounts', async () => {
  const passwordHash = await password.hash('strong-password-123');
  const invalidPasswordService = createService({
    AccountID: 'account-123',
    PasswordHash: passwordHash,
    Status: 'Active',
  }).service;
  await assert.rejects(
    invalidPasswordService.guiThongTinDangNhap({ account: 'demo_admin', password: 'wrong-password' }),
    (error) => error.status === 401,
  );

  const inactiveService = createService({
    AccountID: 'account-123',
    PasswordHash: passwordHash,
    Status: 'Suspended',
  }).service;
  await assert.rejects(
    inactiveService.guiThongTinDangNhap({ account: 'demo_admin', password: 'strong-password-123' }),
    (error) => error.code === 'ACCOUNT_INACTIVE' && error.status === 403,
  );
});
