'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const { requirePermission, requireRole } = require('../src/middlewares/auth');
const RbacService = require('../src/services/RbacService');
const StaffService = require('../src/services/StaffService');
const GenreService = require('../src/services/GenreService');
const BannerService = require('../src/services/BannerService');
const SystemConfigService = require('../src/services/SystemConfigService');

function runMiddleware(middleware, user) {
  let nextError = null;
  middleware({ user }, {}, (error) => { nextError = error || null; });
  return nextError;
}

test('permission middleware allows Admin and assigned Manager permissions only', () => {
  assert.equal(runMiddleware(requirePermission('review.moderate'), {
    roles: ['Admin'],
    permissions: [],
  }), null);
  assert.equal(runMiddleware(requirePermission('review.moderate'), {
    roles: ['Manager'],
    permissions: ['review.moderate'],
  }), null);
  assert.equal(runMiddleware(requirePermission('review.moderate'), {
    roles: ['Manager'],
    permissions: [],
  }).status, 403);
});

test('role middleware rejects a signed-in user without the required role', () => {
  assert.equal(runMiddleware(requireRole('Admin'), { roles: ['Manager'] }).status, 403);
  assert.equal(runMiddleware(requireRole('Admin'), { roles: ['Admin'] }), null);
});

test('RBAC permission catalogue exposes required moderation and finance codes', async () => {
  const service = new RbacService();
  const permissions = await service.listPermissions();
  const codes = permissions.map(({ code }) => code);
  for (const code of ['game.approve', 'game.delist', 'finance.read', 'review.moderate']) {
    assert.ok(codes.includes(code));
  }
});

test('system configuration validates safe numeric ranges', () => {
  const service = new SystemConfigService();
  assert.equal(service.validateParameter({ key: 'PLATFORM_COMMISSION_PERCENT', value: '50' }).value, '50');
  assert.throws(() => service.validateParameter({ key: 'PLATFORM_COMMISSION_PERCENT', value: '50.01' }), { status: 422 });
  assert.throws(() => service.validateParameter({ key: 'MIN_WITHDRAWAL_VND', value: '0' }), { status: 422 });
  assert.throws(() => service.validateParameter({ key: 'UNRECOGNIZED', value: '1' }), { status: 422 });
});

test('staff and genre forms validate required fields and lengths', () => {
  const staff = new StaffService();
  assert.equal(staff.validateStaffData({
    username: 'operator_01',
    email: 'operator@example.test',
    displayName: 'Operator',
    password: 'secure-password',
    roleId: 'role-id',
  }, true).roleId, 'role-id');
  assert.throws(() => staff.validateStaffData({ username: 'op', email: 'bad', displayName: '', password: 'x', roleId: '' }, true), { status: 422 });

  const genres = new GenreService();
  assert.deepEqual(genres.validateGenre({ genreName: 'Action', description: '' }), {
    genreName: 'Action',
    description: '',
  });
  assert.throws(() => genres.validateGenre({ genreName: 'x'.repeat(81) }), { status: 422 });
});

test('banner schedule requires a valid date range and a boolean active flag', () => {
  const service = new BannerService();
  assert.equal(service.validateBanner({
    imageUrl: 'banners/home.webp',
    startDate: '2030-01-01T10:00',
    endDate: '2030-01-02T10:00',
    sortOrder: 1,
    isActive: true,
  }).isActive, true);
  assert.throws(() => service.validateBanner({
    imageUrl: 'banners/home.webp',
    startDate: '2030-01-02T10:00',
    endDate: '2030-01-01T10:00',
    isActive: true,
  }), { status: 422 });
});

test('audit log filter validates date format and range', () => {
  const service = new (require('../src/services/AuditLogService'))();
  assert.throws(() => service.validateFilters({ fromDate: 'invalid-date' }), { status: 422 });
  assert.throws(() => service.validateFilters({ fromDate: '2026-12-01', toDate: '2026-01-01' }), { status: 422 });
  assert.equal(service.validateFilters({ fromDate: '2026-01-01', toDate: '2026-01-02' }).fromDate, '2026-01-01');
});
