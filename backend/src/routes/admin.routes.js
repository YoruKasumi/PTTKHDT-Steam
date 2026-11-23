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
  couponService,
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
const couponManagers = [authenticate, requireRole('Admin', 'Manager')];

router.get('/layDanhSachMaGiamGia', ...couponManagers, asyncHandler(async (req, res) => (
  ok(res, await couponService.listCoupons())
)));

router.post('/taoMaGiamGia', ...couponManagers, asyncHandler(async (req, res) => (
  ok(res, await couponService.createCoupon(requestContext(req)), 201, 'Coupon created')
)));

// ─── 1. RBAC (Vai trò & Quyền hạn) ──────────────────────────────────────────

/** Lấy danh mục quyền hạn */
router.get('/layDanhSachQuyen', ...adminOnly, asyncHandler(async (req, res) => (
  ok(res, await rbacService.layDanhSachQuyen())
)));

/** Lấy danh sách vai trò */
router.get('/layDanhSachVaiTro', ...adminOnly, asyncHandler(async (req, res) => (
  ok(res, await rbacService.layDanhSachVaiTro(requestContext(req)))
)));

/** Tạo vai trò mới */
router.post('/taoVaiTro', ...adminOnly, asyncHandler(async (req, res) => (
  ok(res, await rbacService.taoVaiTro(requestContext(req)), 201, 'Role created')
)));

/** Sửa vai trò */
router.post('/suaVaiTro', ...adminOnly, asyncHandler(async (req, res) => (
  ok(res, await rbacService.suaVaiTro(requestContext(req)))
)));

/** Xóa vai trò */
router.post('/xoaVaiTro', ...adminOnly, asyncHandler(async (req, res) => (
  ok(res, await rbacService.xoaVaiTro(requestContext(req)))
)));

/** Cập nhật quyền hạn cho vai trò */
router.post('/capNhatQuyenVaiTro', ...adminOnly, asyncHandler(async (req, res) => (
  ok(res, await rbacService.capNhatQuyenVaiTro(requestContext(req)))
)));

// ─── 2. QUẢN LÝ TÀI KHOẢN (ACCOUNTS) ────────────────────────────────────────

/** Lấy danh sách tài khoản người dùng */
router.get('/layDanhSachTaiKhoan', ...accountManagers, asyncHandler(async (req, res) => (
  ok(res, await accountService.layDanhSachTaiKhoan(requestContext(req)))
)));

/** Tra cứu lịch sử vi phạm / hoạt động tài khoản */
router.post('/traCuuLichSuTaiKhoan', ...accountManagers, asyncHandler(async (req, res) => (
  ok(res, await accountService.traCuuLichSuTaiKhoan(requestContext(req)))
)));

/** Tạm khóa tài khoản */
router.post('/tamKhoaTaiKhoan', ...accountManagers, asyncHandler(async (req, res) => (
  ok(res, await accountService.tamKhoaTaiKhoan(requestContext(req)))
)));

/** Khóa vĩnh viễn tài khoản */
router.post('/khoaVinhVienTaiKhoan', ...accountManagers, asyncHandler(async (req, res) => (
  ok(res, await accountService.khoaVinhVienTaiKhoan(requestContext(req)))
)));

/** Mở khóa tài khoản */
router.post('/moKhoaTaiKhoan', ...accountManagers, asyncHandler(async (req, res) => (
  ok(res, await accountService.moKhoaTaiKhoan(requestContext(req)))
)));

// ─── 3. NHÂN SỰ & QUẢN TRỊ VIÊN (STAFF) ──────────────────────────────────────

/** Lấy danh sách nhân sự */
router.get('/layDanhSachNhanSu', ...adminOnly, asyncHandler(async (req, res) => (
  ok(res, await staffService.layDanhSachNhanSu())
)));

/** Tạo tài khoản nhân sự mới */
router.post('/guiYeuCauTaoTaiKhoan', ...adminOnly, asyncHandler(async (req, res) => (
  ok(res, await staffService.guiYeuCauTaoTaiKhoan(requestContext(req)), 201, 'Staff account created')
)));

/** Cập nhật thông tin nhân sự */
router.post('/guiYeuCauCapNhatThongTin', ...adminOnly, asyncHandler(async (req, res) => (
  ok(res, await staffService.guiYeuCauCapNhatThongTin(requestContext(req)))
)));

/** Cập nhật trạng thái nhân sự (Active/Suspended) */
router.post('/capNhatTrangThaiNhanSu', ...adminOnly, asyncHandler(async (req, res) => (
  ok(res, await staffService.capNhatTrangThaiNhanSu(requestContext(req)))
)));

// ─── 4. THỂ LOẠI (GENRES) ───────────────────────────────────────────────────

/** Lấy danh sách thể loại quản trị */
router.get('/layDanhSachTheLoai', ...contentManagers('genres.manage'), asyncHandler(async (req, res) => (
  ok(res, await genreService.layDanhSachTheLoai())
)));

/** Thêm thể loại mới */
router.post('/yeuCauThemTheLoai', ...contentManagers('genres.manage'), asyncHandler(async (req, res) => (
  ok(res, await genreService.yeuCauThemTheLoai(requestContext(req)), 201, 'Genre created')
)));

/** Sửa thể loại */
router.post('/yeuCauSuaTheLoai', ...contentManagers('genres.manage'), asyncHandler(async (req, res) => (
  ok(res, await genreService.yeuCauSuaTheLoai(requestContext(req)))
)));

/** Xóa thể loại */
router.post('/yeuCauXoaTheLoai', ...contentManagers('genres.manage'), asyncHandler(async (req, res) => (
  ok(res, await genreService.yeuCauXoaTheLoai(requestContext(req)))
)));

// ─── 5. BANNER QUẢNG BÁ ──────────────────────────────────────────────────────

/** Lấy danh sách banner */
router.get('/layDanhSachBanner', ...contentManagers('banners.manage'), asyncHandler(async (req, res) => (
  ok(res, await bannerService.layDanhSachBanner())
)));

/** Tạo banner quảng bá mới */
router.post('/guiThongTinBannerMoi', ...contentManagers('banners.manage'), asyncHandler(async (req, res) => (
  ok(res, await bannerService.guiThongTinBannerMoi(requestContext(req)), 201, 'Banner created')
)));

/** Sửa banner */
router.post('/suaBanner', ...contentManagers('banners.manage'), asyncHandler(async (req, res) => (
  ok(res, await bannerService.suaBanner(requestContext(req)))
)));

/** Xóa banner */
router.post('/xoaBanner', ...contentManagers('banners.manage'), asyncHandler(async (req, res) => (
  ok(res, await bannerService.xoaBanner(requestContext(req)))
)));

// ─── 6. CẤU HÌNH HỆ THỐNG (SYSTEM CONFIG) ───────────────────────────────────

/** Lấy danh sách tham số cấu hình sàn */
router.get('/layDanhSachThamSo', ...adminOnly, asyncHandler(async (req, res) => (
  ok(res, await systemConfigService.layDanhSachThamSo(requestContext(req)))
)));

/** Cập nhật thông số cấu hình hệ thống */
router.post('/guiYeuCauCapNhatThamSo', ...adminOnly, asyncHandler(async (req, res) => (
  ok(res, await systemConfigService.guiYeuCauCapNhatThamSo(requestContext(req)))
)));

// ─── 7. NHẬT KÝ KIỂM TOÁN (AUDIT LOGS) ──────────────────────────────────────

/** Lọc và xem danh sách nhật ký quản trị */
router.get('/layDanhSachNhatKy', ...adminOnly, asyncHandler(async (req, res) => (
  ok(res, await auditLogService.layDanhSachNhatKy(requestContext(req)))
)));

/** Xem chi tiết bản ghi nhật ký */
router.post('/layChiTietNhatKy', ...adminOnly, asyncHandler(async (req, res) => (
  ok(res, await auditLogService.layChiTietNhatKy(requestContext(req)))
)));

module.exports = router;
