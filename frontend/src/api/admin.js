import http from './http';

export const adminApi = {
  // ─── 1. PHÂN QUYỀN & VAI TRÒ (RBAC) ──────────────────────────────────────────
  listRoles: () => http.get('/admin/layDanhSachVaiTro'),
  listPermissions: () => http.get('/admin/layDanhSachQuyen'),
  createRole: (body) => http.post('/admin/taoVaiTro', body),
  updateRole: (roleId, body) => http.post('/admin/suaVaiTro', { roleId, ...body }),
  deleteRole: (roleId) => http.post('/admin/xoaVaiTro', { roleId }),
  updateRolePermissions: (roleId, permissions) =>
    http.post('/admin/capNhatQuyenVaiTro', { roleId, permissions }),

  // ─── 2. QUẢN LÝ TÀI KHOẢN (ACCOUNTS) ────────────────────────────────────────
  listAccounts: (params) => http.get('/admin/layDanhSachTaiKhoan', { params }),
  getAccountHistory: (accountId) => http.post('/admin/traCuuLichSuTaiKhoan', { accountId }),
  setAccountStatus: (accountId, status, reason, suspensionHours) => {
    if (status === 'Suspended') {
      return http.post('/admin/tamKhoaTaiKhoan', { accountId, suspensionHours, reason });
    }
    if (status === 'Banned') {
      return http.post('/admin/khoaVinhVienTaiKhoan', { accountId, reason });
    }
    return http.post('/admin/moKhoaTaiKhoan', { accountId, reason });
  },
  changeAccountStatus: (accountId, status, reason) => {
    if (status === 'Suspended') {
      return http.post('/admin/tamKhoaTaiKhoan', { accountId, reason });
    }
    if (status === 'Banned') {
      return http.post('/admin/khoaVinhVienTaiKhoan', { accountId, reason });
    }
    return http.post('/admin/moKhoaTaiKhoan', { accountId, reason });
  },

  // ─── 3. NHÂN SỰ & QUẢN TRỊ VIÊN (STAFF) ──────────────────────────────────────
  listStaff: () => http.get('/admin/layDanhSachNhanSu'),
  createStaff: (body) => http.post('/admin/guiYeuCauTaoTaiKhoan', body),
  updateStaff: (accountId, body) => http.post('/admin/guiYeuCauCapNhatThongTin', { accountId, ...body }),
  setStaffStatus: (accountId, status) =>
    http.post('/admin/capNhatTrangThaiNhanSu', { accountId, status }),
  changeStaffStatus: (accountId, status) =>
    http.post('/admin/capNhatTrangThaiNhanSu', { accountId, status }),

  // ─── 4. KIỂM DUYỆT ĐÁNH GIÁ (REVIEWS) ────────────────────────────────────────
  listReviews: () => http.get('/moderation/layDanhSachDanhGia'),
  moderateReview: (reviewId, status, reason) =>
    http.post('/moderation/xuLyDanhGiaViPham', { reviewId, status, reason }),
  listCommunityReviews: () => http.get('/moderation/yeuCauDanhSachNoiDungGanCo'),
  moderateCommunityReview: (reviewId, status, reason) =>
    http.post('/moderation/capNhatTrangThaiKiemDuyet', { reviewId, status, reason }),

  // ─── 5. KIỂM DUYỆT GAME (GAMES) ──────────────────────────────────────────────
  listPendingGames: (params) => http.get('/moderation/yeuCauLayHoSoGameChoDuyet', { params }),
  getGameDetail: (gameId) => http.post('/moderation/layChiTietHoSoGame', { gameId }),
  reviewGame: (gameId, decision, reason) =>
    http.post('/moderation/pheDuyetHoacTuChoiGame', { gameId, decision, reason }),

  // ─── 6. THỂ LOẠI (GENRES) ───────────────────────────────────────────────────
  listGenres: () => http.get('/admin/layDanhSachTheLoai'),
  createGenre: (body) => http.post('/admin/yeuCauThemTheLoai', body),
  updateGenre: (genreId, body) => http.post('/admin/yeuCauSuaTheLoai', { genreId, ...body }),
  deleteGenre: (genreId) => http.post('/admin/yeuCauXoaTheLoai', { genreId }),

  // ─── 7. BANNER QUẢNG BÁ ──────────────────────────────────────────────────────
  listBanners: () => http.get('/admin/layDanhSachBanner'),
  createBanner: (body) => http.post('/admin/guiThongTinBannerMoi', body),
  updateBanner: (bannerId, body) => http.post('/admin/suaBanner', { bannerId, ...body }),
  deleteBanner: (bannerId) => http.post('/admin/xoaBanner', { bannerId }),

  // ─── 8. CẤU HÌNH HỆ THỐNG (SYSTEM CONFIG) ────────────────────────────────────
  getSystemConfig: () => http.get('/admin/layDanhSachThamSo'),
  updateSystemConfig: (parameters) => http.post('/admin/guiYeuCauCapNhatThamSo', { parameters }),

  // ─── 9. NHẬT KÝ KIỂM TOÁN (AUDIT LOGS) ───────────────────────────────────────
  listAuditLogs: (params) => http.get('/admin/layDanhSachNhatKy', { params }),
  getAuditLogDetail: (logId) => http.post('/admin/layChiTietNhatKy', { logId }),
};
