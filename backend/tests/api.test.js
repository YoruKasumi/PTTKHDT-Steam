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
    ok: true,
    data: { status: 'ok' },
  });
});

test('unknown paths use the standard error response envelope', async () => {
  const response = await fetch(`${baseUrl}/api/not-a-route`);
  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), {
    ok: false,
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
    ok: false,
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
    ok: false,
    code: 'PAYLOAD_TOO_LARGE',
    message: 'Request body vượt quá kích thước cho phép',
  });
});

test('Guest can reach public login without a JWT', async () => {
  const response = await fetch(`${baseUrl}/api/auth/guiThongTinDangNhap`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{}',
  });
  assert.equal(response.status, 501);
  const body = await response.json();
  assert.equal(body.ok, false);
  assert.equal(body.code, 'NOT_IMPLEMENTED');
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
    ok: false,
    code: 'UNAUTHORIZED',
    message: 'Chưa đăng nhập hoặc phiên đã hết hạn',
  });
});
