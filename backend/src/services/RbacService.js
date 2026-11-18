'use strict';
const BaseService = require('./BaseService');
const { NotImplementedException } = require('../exceptions');
const RoleDAO = require('../dao/RoleDAO');

/**
 * RbacService - tầng Business Logic.
 * Tên phương thức lấy đúng từ sơ đồ sequence; nội dung bên dưới chỉ là khung cần cài đặt.
 */
class RbacService extends BaseService {
  constructor() {
    super();
    this.roleDAO = new RoleDAO();
    this.auditLogService = null; // được gắn trong services/index.js
  }

  // ---------------------------------------------------------------- Phương thức công khai (Route / Service khác gọi)

  /**
   * UC59. Phân quyền truy cập (RBAC) - sequence #2: UI → RbacService
   * Vai trò gọi: Admin
   * Luồng theo sơ đồ:
   *   #3 → RoleDAO.truyVanDanhSachVaiTroVaQuyen()
   *   #4 ← traVeDanhSachVaiTroVaQuyen()
   *   #5 ← traVeMaTranPhanQuyen()
   * @param {object} params
   */
  async yeuCauLayMaTranPhanQuyen(params = {}) {
    throw new NotImplementedException('RbacService.yeuCauLayMaTranPhanQuyen');
  }

  /**
   * UC59. Phân quyền truy cập (RBAC) - sequence #8: UI → RbacService
   * Vai trò gọi: Admin
   * Luồng theo sơ đồ:
   *   #9 ↻ this.kiemTraXungDotQuyenHan()
   *   #10 ← thongBaoXungDotQuyenHan()
   *   #12 → RoleDAO.capNhatChinhSachQuyenMoi()
   *   #13 ← xacNhanCapNhatThanhCong()
   *   #14 ↻ this.lamMoiTokenQuyenCacTaiKhoan()
   *   #15 → AuditLogService.ghiNhanNhatKyQuanTri
   *   #16 → AuditLogDAO.luuNhatKyPhanQuyen()
   *   #17 ← xacNhanLuuNhatKyThanhCong()
   *   #18 ← hoanTatGhiNhatKy()
   *   #19 ← thongBaoCapNhatQuyenThanhCong()
   * @param {object} params
   */
  async guiYeuCauCapNhatPhanQuyen(params = {}) {
    throw new NotImplementedException('RbacService.guiYeuCauCapNhatPhanQuyen');
  }

  // ---------------------------------------------------------------- Phương thức nội bộ (self-call trong sơ đồ)

  /**
   * UC59. Phân quyền truy cập (RBAC) - sequence #9: nội bộ
   * @param {object} params
   */
  async kiemTraXungDotQuyenHan(params = {}) {
    throw new NotImplementedException('RbacService.kiemTraXungDotQuyenHan');
  }

  /**
   * UC59. Phân quyền truy cập (RBAC) - sequence #14: nội bộ
   * @param {object} params
   */
  async lamMoiTokenQuyenCacTaiKhoan(params = {}) {
    throw new NotImplementedException('RbacService.lamMoiTokenQuyenCacTaiKhoan');
  }
}

module.exports = RbacService;
