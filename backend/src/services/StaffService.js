'use strict';
const BaseService = require('./BaseService');
const { NotImplementedException } = require('../exceptions');
const StaffDAO = require('../dao/StaffDAO');

/**
 * StaffService - tầng Business Logic.
 * Tên phương thức lấy đúng từ sơ đồ sequence; nội dung bên dưới chỉ là khung cần cài đặt.
 */
class StaffService extends BaseService {
  constructor() {
    super();
    this.staffDAO = new StaffDAO();
    this.auditLogService = null; // được gắn trong services/index.js
  }

  // ---------------------------------------------------------------- Phương thức công khai (Route / Service khác gọi)

  /**
   * UC61. Tạo tài khoản nhân sự mới - sequence #4: UI → StaffService
   * Vai trò gọi: Admin
   * Luồng theo sơ đồ:
   *   #5 → StaffDAO.kiemTraTrungLapEmailVaUsername()
   *   #6 ← traVeKetQuaKiemTra()
   *   #7 ← thongBaoTrungLapThongTin()
   *   #9 → StaffDAO.luuTaiKhoanNhanSuMoi()
   *   #10 ← xacNhanTaoThanhCong()
   *   #11 → AuditLogService.ghiNhanNhatKyQuanTri
   *   #12 → AuditLogDAO.luuNhatKyTaoTaiKhoan()
   *   #13 ← xacNhanLuuNhatKyThanhCong()
   *   #14 ← hoanTatGhiNhatKy()
   *   #15 ← thongBaoTaoThanhCong()
   * @param {object} params
   */
  async guiYeuCauTaoTaiKhoan(params = {}) {
    throw new NotImplementedException('StaffService.guiYeuCauTaoTaiKhoan');
  }

  /**
   * UC62. Cập nhật thông tin nhân sự - sequence #2: UI → StaffService
   * Vai trò gọi: Admin
   * Luồng theo sơ đồ:
   *   #3 → StaffDAO.truyVanChiTietNhanSu()
   *   #4 ← traVeChiTietNhanSu()
   * @param {object} params
   */
  async layChiTietNhanSu(params = {}) {
    throw new NotImplementedException('StaffService.layChiTietNhanSu');
  }

  /**
   * UC62. Cập nhật thông tin nhân sự - sequence #7: UI → StaffService
   * Vai trò gọi: Admin
   * Luồng theo sơ đồ:
   *   #8 ↻ this.kiemTraDinhDangDuLieu()
   *   #9 ← thongBaoDuLieuKhongHopLe()
   *   #11 → StaffDAO.capNhatThongTinNhanSu()
   *   #12 ← xacNhanCapNhatThanhCong()
   *   #13 → AuditLogService.ghiNhanNhatKyQuanTri
   *   #14 → AuditLogDAO.luuNhatKyCapNhatNhanSu()
   *   #15 ← xacNhanLuuNhatKyThanhCong()
   *   #16 ← hoanTatGhiNhatKy()
   *   #17 ← thongBaoCapNhatThanhCong()
   * @param {object} params
   */
  async guiYeuCauCapNhatThongTin(params = {}) {
    throw new NotImplementedException('StaffService.guiYeuCauCapNhatThongTin');
  }

  // ---------------------------------------------------------------- Phương thức nội bộ (self-call trong sơ đồ)

  /**
   * UC62. Cập nhật thông tin nhân sự - sequence #8: nội bộ
   * @param {object} params
   */
  async kiemTraDinhDangDuLieu(params = {}) {
    throw new NotImplementedException('StaffService.kiemTraDinhDangDuLieu');
  }
}

module.exports = StaffService;
