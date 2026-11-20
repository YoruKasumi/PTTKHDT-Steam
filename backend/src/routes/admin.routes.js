'use strict';

const express = require('express');
const { authenticate, requireRole, requirePermission } = require('../middlewares/auth');
const asyncHandler = require('../utils/asyncHandler');
const requestContext = require('../utils/requestContext');
const { ok } = require('../utils/response');
const {
  rbacService,
  accountService,
  staffService,
  genreService,
  bannerService,
  systemConfigService,
  auditLogService,
} = require('../services');

const router = express.Router();
const adminOnly = [authenticate, requireRole('Admin')];
const accountManagers = [
  authenticate,
  requireRole('Admin', 'Manager'),
  requirePermission('account.moderate'),
];
const contentManagers = (permission) => [
  authenticate,
  requireRole('Admin', 'Manager'),
  requirePermission(permission),
];

router.get('/permissions', ...adminOnly, asyncHandler(async (req, res) => (
  ok(res, await rbacService.listPermissions())
)));

router.get('/roles', ...adminOnly, asyncHandler(async (req, res) => (
  ok(res, await rbacService.listRoles(requestContext(req)))
)));

router.post('/roles', ...adminOnly, asyncHandler(async (req, res) => (
  ok(res, await rbacService.createRole(requestContext(req)), 201, 'Role created')
)));

router.put('/roles/:roleId', ...adminOnly, asyncHandler(async (req, res) => (
  ok(res, await rbacService.updateRole(requestContext(req)))
)));

router.delete('/roles/:roleId', ...adminOnly, asyncHandler(async (req, res) => (
  ok(res, await rbacService.deleteRole(requestContext(req)))
)));

router.put('/roles/:roleId/permissions', ...adminOnly, asyncHandler(async (req, res) => (
  ok(res, await rbacService.updatePermissions(requestContext(req)))
)));

router.get('/accounts', ...accountManagers, asyncHandler(async (req, res) => (
  ok(res, await accountService.layDanhSachTaiKhoan(requestContext(req)))
)));

router.get('/accounts/:accountId/history', ...accountManagers, asyncHandler(async (req, res) => (
  ok(res, await accountService.layLichSuTaiKhoan(requestContext(req)))
)));

router.patch('/accounts/:accountId/suspend', ...accountManagers, asyncHandler(async (req, res) => (
  ok(res, await accountService.yeuCauTamKhoaTaiKhoan(requestContext(req)))
)));

router.patch('/accounts/:accountId/ban', ...accountManagers, asyncHandler(async (req, res) => (
  ok(res, await accountService.yeuCauKhoaVinhVien(requestContext(req)))
)));

router.patch('/accounts/:accountId/unban', ...accountManagers, asyncHandler(async (req, res) => (
  ok(res, await accountService.yeuCauMoKhoaTaiKhoan(requestContext(req)))
)));

router.get('/staff', ...adminOnly, asyncHandler(async (req, res) => (
  ok(res, await staffService.layDanhSachNhanSu())
)));

router.post('/staff', ...adminOnly, asyncHandler(async (req, res) => (
  ok(res, await staffService.guiYeuCauTaoTaiKhoan(requestContext(req)), 201, 'Staff account created')
)));

router.put('/staff/:accountId', ...adminOnly, asyncHandler(async (req, res) => (
  ok(res, await staffService.guiYeuCauCapNhatThongTin(requestContext(req)))
)));

router.patch('/staff/:accountId/status', ...adminOnly, asyncHandler(async (req, res) => (
  ok(res, await staffService.capNhatTrangThai(requestContext(req)))
)));

router.get('/genres', ...contentManagers('genres.manage'), asyncHandler(async (req, res) => (
  ok(res, await genreService.listGenres())
)));

router.post('/genres', ...contentManagers('genres.manage'), asyncHandler(async (req, res) => (
  ok(res, await genreService.yeuCauThemTheLoai(requestContext(req)), 201, 'Genre created')
)));

router.put('/genres/:genreId', ...contentManagers('genres.manage'), asyncHandler(async (req, res) => (
  ok(res, await genreService.yeuCauSuaTheLoai(requestContext(req)))
)));

router.delete('/genres/:genreId', ...contentManagers('genres.manage'), asyncHandler(async (req, res) => (
  ok(res, await genreService.yeuCauXoaTheLoai(requestContext(req)))
)));

router.get('/banners', ...contentManagers('banners.manage'), asyncHandler(async (req, res) => (
  ok(res, await bannerService.listBanners())
)));

router.post('/banners', ...contentManagers('banners.manage'), asyncHandler(async (req, res) => (
  ok(res, await bannerService.guiThongTinBannerMoi(requestContext(req)), 201, 'Banner created')
)));

router.put('/banners/:bannerId', ...contentManagers('banners.manage'), asyncHandler(async (req, res) => (
  ok(res, await bannerService.updateBanner(requestContext(req)))
)));

router.delete('/banners/:bannerId', ...contentManagers('banners.manage'), asyncHandler(async (req, res) => (
  ok(res, await bannerService.deleteBanner(requestContext(req)))
)));

router.get('/system-config', ...adminOnly, asyncHandler(async (req, res) => (
  ok(res, await systemConfigService.yeuCauLayDanhSachThamSo(requestContext(req)))
)));

router.put('/system-config', ...adminOnly, asyncHandler(async (req, res) => (
  ok(res, await systemConfigService.guiYeuCauCapNhatThamSo(requestContext(req)))
)));

router.get('/audit-logs', ...adminOnly, asyncHandler(async (req, res) => (
  ok(res, await auditLogService.guiYeuCauLocNhatKy(requestContext(req)))
)));

module.exports = router;
