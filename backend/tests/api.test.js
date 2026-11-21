'use strict';

const assert = require('node:assert/strict');
const { after, before, test } = require('node:test');
const app = require('../src/app');
const { pool } = require('../src/config/database');

let server;
let baseUrl;

before(async () => {
  server = app.listen(0, '127.0.0.1');
  await new Promise((resolve, reject) => {
    server.once('listening', resolve);
    server.once('error', reject);
  });
  const address = server.address();
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  if (server) {
    await new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
  await pool.end();
});

test('health endpoint uses the standard success response envelope', async () => {
  const response = await fetch(`${baseUrl}/health`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    success: true,
    message: 'Request completed successfully',
    data: { status: 'ok' },
  });
});

test('Swagger UI and generated OpenAPI document are available in development', async () => {
  const uiResponse = await fetch(`${baseUrl}/api-docs/`);
  assert.equal(uiResponse.status, 200);
  assert.match(await uiResponse.text(), /swagger-ui/);

  const specResponse = await fetch(`${baseUrl}/api-docs/openapi.json`);
  assert.equal(specResponse.status, 200);
  const spec = await specResponse.json();
  assert.equal(spec.openapi, '3.0.3');
  assert.ok(spec.paths['/api/auth/register']);
  assert.ok(spec.paths['/api/auth/login']);
  assert.ok(spec.paths['/api/profile']);
  assert.ok(spec.paths['/api/profile/password']);
  assert.ok(spec.paths['/api/profile/notifications']);
  assert.ok(spec.paths['/api/catalog/games']);
  assert.ok(spec.paths['/api/catalog/games/{gameId}']);
  assert.ok(spec.paths['/api/catalog/games/{gameId}/reviews']);
  assert.ok(spec.paths['/api/auth/guiThongTinDangNhap']);
  assert.ok(spec.paths['/api/admin/roles']);
  assert.ok(spec.paths['/api/admin/accounts/{accountId}/history']);
  assert.ok(spec.paths['/api/moderation/reviews']);
  assert.ok(spec.paths['/api/genres']);
  assert.ok(spec.paths['/api/banners/active']);
  assert.deepEqual(spec.paths['/api/cart/yeuCauXemGioHang'].get.security, [{ bearerAuth: [] }]);
  assert.ok(spec.paths['/health/database']);
});

test('REST auth aliases apply the same validation as the legacy endpoints', async () => {
  const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{}',
  });
  assert.equal(loginResponse.status, 400);
  assert.equal((await loginResponse.json()).code, 'MISSING_CREDENTIALS');

  const registerResponse = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      username: 'rest_otp_failure',
      email: 'rest.otp.failure@example.test',
      password: 'strong-password-123',
      otp: '0000',
    }),
  });
  assert.equal(registerResponse.status, 400);
  assert.equal((await registerResponse.json()).code, 'OTP_INVALID');
});

test('review endpoint requires a Customer session', async () => {
  const response = await fetch(`${baseUrl}/api/catalog/games/game-1/reviews`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ rating: 5, content: 'Review' }),
  });
  assert.equal(response.status, 401);
  assert.equal((await response.json()).code, 'UNAUTHORIZED');
});

test('unknown paths use the standard error response envelope', async () => {
  const response = await fetch(`${baseUrl}/api/not-a-route`);
  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), {
    success: false,
    code: 'NOT_FOUND',
    message: 'Không có đường dẫn GET /api/not-a-route',
  });
});

test('malformed JSON is returned as a client error, not an internal error', async () => {
  const response = await fetch(`${baseUrl}/api/auth/guiThongTinDangNhap`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{',
  });
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), {
    success: false,
    code: 'BAD_REQUEST',
    message: 'JSON request body không hợp lệ',
  });
});

test('oversized JSON is returned as a payload-too-large error', async () => {
  const response = await fetch(`${baseUrl}/api/auth/guiThongTinDangNhap`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ value: 'x'.repeat(2 * 1024 * 1024) }),
  });
  assert.equal(response.status, 413);
  assert.deepEqual(await response.json(), {
    success: false,
    code: 'PAYLOAD_TOO_LARGE',
    message: 'Request body vượt quá kích thước cho phép',
  });
});

test('login rejects a missing username or password as a client error', async () => {
  const response = await fetch(`${baseUrl}/api/auth/guiThongTinDangNhap`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{}',
  });
  assert.equal(response.status, 400);
  const body = await response.json();
  assert.equal(body.success, false);
  assert.equal(body.code, 'MISSING_CREDENTIALS');
});

test('registration rejects the simulated failure OTP without accessing the database', async () => {
  const response = await fetch(`${baseUrl}/api/auth/guiThongTinDangKy`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      username: 'otp_failure',
      email: 'otp.failure@example.test',
      displayName: 'OTP Failure',
      password: 'strong-password-123',
      otp: '0000',
    }),
  });
  assert.equal(response.status, 400);
  assert.equal((await response.json()).code, 'OTP_INVALID');
});

test('protected routes reject an invalid JWT', async () => {
  const response = await fetch(`${baseUrl}/api/cart/yeuCauXemGioHang`, {
    headers: { authorization: 'Bearer invalid-token' },
  });
  assert.equal(response.status, 401);
  assert.equal((await response.json()).code, 'UNAUTHORIZED');
});

test('customer-only routes still reject requests without a JWT', async () => {
  const response = await fetch(`${baseUrl}/api/cart/yeuCauXemGioHang`);
  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), {
    success: false,
    code: 'UNAUTHORIZED',
    message: 'Chưa đăng nhập hoặc phiên đã hết hạn',
  });

  test('admin endpoints require authentication', async () => {
    const response = await fetch(`${baseUrl}/api/admin/roles`);
    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), {
      success: false,
      code: 'UNAUTHORIZED',
      message: 'Chưa đăng nhập hoặc phiên đã hết hạn',
    });
  });
});
