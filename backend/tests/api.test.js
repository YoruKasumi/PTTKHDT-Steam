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
  assert.ok(spec.paths['/api/auth/guiThongTinDangKy']);
  assert.ok(spec.paths['/api/auth/guiThongTinDangNhap']);
  assert.ok(spec.paths['/api/profile/layThongTinHoSo']);
  assert.ok(spec.paths['/api/profile/guiYeuCauThayDoiMatKhau']);
  assert.ok(spec.paths['/api/profile/capNhatTrangThaiThongBao']);
  assert.ok(spec.paths['/api/catalog/layDanhSachGame']);
  assert.ok(spec.paths['/api/catalog/yeuCauXemChiTietSanPham']);
  assert.ok(spec.paths['/api/catalog/taoDanhGia']);
  assert.ok(spec.paths['/api/library/yeuCauTaiGame']);
  assert.ok(spec.paths['/api/admin/layDanhSachVaiTro']);
  assert.ok(spec.paths['/api/admin/traCuuLichSuTaiKhoan']);
  assert.ok(spec.paths['/api/moderation/layDanhSachDanhGia']);
  assert.ok(spec.paths['/api/genres/layDanhSachTheLoaiCongKhai']);
  assert.ok(spec.paths['/api/banners/layBannerHienThi']);
  assert.deepEqual(spec.paths['/api/cart/yeuCauXemGioHang'].get.security, [{ bearerAuth: [] }]);
  assert.ok(spec.paths['/health/database']);
});

test('download metadata headers are readable by a cross-origin frontend', async () => {
  const allowedOrigin = process.env.CORS_ORIGIN?.split(',')[0].trim() || 'http://localhost:5173';
  const response = await fetch(`${baseUrl}/health`, {
    headers: { Origin: allowedOrigin },
  });

  const exposedHeaders = response.headers.get('access-control-expose-headers')
    .split(',')
    .map((header) => header.trim());
  assert.deepEqual(exposedHeaders, ['Content-Disposition', 'X-Game-Version', 'X-Game-Sha256']);
});

test('auth validation on Vietnamese endpoints rejects missing credentials and bad OTP', async () => {
  const loginResponse = await fetch(`${baseUrl}/api/auth/guiThongTinDangNhap`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{}',
  });
  assert.equal(loginResponse.status, 400);
  assert.equal((await loginResponse.json()).code, 'MISSING_CREDENTIALS');

  const registerResponse = await fetch(`${baseUrl}/api/auth/guiThongTinDangKy`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      username: 'rest_otp_failure',
      email: 'rest.otp.failure@example.test',
      displayName: 'Rest Test',
      password: 'strong-password-123',
      otp: '0000',
    }),
  });
  assert.equal(registerResponse.status, 400);
  assert.equal((await registerResponse.json()).code, 'OTP_INVALID');
});

test('review endpoint requires a Customer session', async () => {
  const response = await fetch(`${baseUrl}/api/catalog/taoDanhGia`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ gameId: 'game-1', rating: 5, content: 'Review' }),
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
});

test('admin endpoints require authentication', async () => {
  const requests = [
    fetch(`${baseUrl}/api/admin/layDanhSachVaiTro`),
    fetch(`${baseUrl}/api/admin/layDanhSachMaGiamGia`),
    fetch(`${baseUrl}/api/admin/taoMaGiamGia`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ code: 'TEST20', discountValue: 20000, expiryDate: '2030-01-01T00:00', usageLimit: 10 }),
    }),
  ];
  for (const pendingResponse of requests) {
    const response = await pendingResponse;
    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), {
      success: false,
      code: 'UNAUTHORIZED',
      message: 'Chưa đăng nhập hoặc phiên đã hết hạn',
    });
  }
});
