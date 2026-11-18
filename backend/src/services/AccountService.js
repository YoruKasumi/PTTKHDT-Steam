'use strict';
const BaseService = require('./BaseService');
const { NotImplementedException } = require('../exceptions');
const AccountDAO = require('../dao/AccountDAO');

/**
 * AccountService - tầng Business Logic.
 * Tên phương thức lấy đúng từ sơ đồ sequence; nội dung bên dưới chỉ là khung cần cài đặt.
 */
class AccountService extends BaseService {
  constructor() {
    super();
    this.accountDAO = new AccountDAO();
    this.auditLogService = null; // được gắn trong services/index.js
  }

  // ---------------------------------------------------------------- Phương thức công khai (Route / Service khác gọi)

  /**
   * UC42. Tra cứu lịch sử tài khoản - sequence #2: UI → AccountService
   * Vai trò gọi: Admin, Manager
   * Luồng theo sơ đồ:
   *   #3 → AccountDAO.truyVanThongTinVaLichSuTaiKhoan()
   *   #4 ← traVeThongTinVaLichSu()
   *   #5 ← thongBaoKhongTimThayTaiKhoan()
   *   #7 ← traVeDuLieuLichSuTaiKhoan()
   * @param {object} params
   */
  async guiYeuCauTraCuu(params = {}) {
    throw new NotImplementedException('AccountService.guiYeuCauTraCuu');
  }

  /**
   * UC44. Tạm khóa tài khoản vi phạm - sequence #4: UI → AccountService
   * Vai trò gọi: Admin, Manager
   * Luồng theo sơ đồ:
   *   #5 → AccountDAO.capNhatTrangThaiTamKhoaTaiKhoan()
   *   #6 ← xacNhanCapNhatThanhCong()
   *   #7 → AuditLogService.ghiNhanNhatKyQuanTri
   *   #8 → AuditLogDAO.luuNhatKyTamKhoa()
   *   #9 ← xacNhanLuuNhatKyThanhCong()
   *   #10 ← hoanTatGhiNhatKy()
   *   #11 ← thongBaoTamKhoaThanhCong()
   * @param {object} params
   */
  async yeuCauTamKhoaTaiKhoan(params = {}) {
    throw new NotImplementedException('AccountService.yeuCauTamKhoaTaiKhoan');
  }

  /**
   * UC45. Khóa vĩnh viễn tài khoản - sequence #4: UI → AccountService
   * Vai trò gọi: Admin, Manager
   * Luồng theo sơ đồ:
   *   #5 → AccountDAO.capNhatTrangThaiBanned()
   *   #6 ← xacNhanCapNhatThanhCong()
   *   #7 → AuditLogService.ghiNhanNhatKyQuanTri
   *   #8 → AuditLogDAO.luuNhatKyKhoaVinhVien()
   *   #9 ← xacNhanLuuNhatKyThanhCong()
   *   #10 ← hoanTatGhiNhatKy()
   *   #11 ← thongBaoKhoaVinhVienThanhCong()
   * @param {object} params
   */
  async yeuCauKhoaVinhVien(params = {}) {
    throw new NotImplementedException('AccountService.yeuCauKhoaVinhVien');
  }
}

module.exports = AccountService;
