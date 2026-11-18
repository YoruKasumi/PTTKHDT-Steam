'use strict';
const BaseService = require('./BaseService');
const { NotImplementedException } = require('../exceptions');
const SystemConfigDAO = require('../dao/SystemConfigDAO');

/**
 * SystemConfigService - tầng Business Logic.
 * Tên phương thức lấy đúng từ sơ đồ sequence; nội dung bên dưới chỉ là khung cần cài đặt.
 */
class SystemConfigService extends BaseService {
  constructor() {
    super();
    this.systemConfigDAO = new SystemConfigDAO();
    this.auditLogService = null; // được gắn trong services/index.js
  }

  // ---------------------------------------------------------------- Phương thức công khai (Route / Service khác gọi)

  /**
   * UC58. Cấu hình tham số hệ thống - sequence #2: UI → SystemConfigService
   * Vai trò gọi: Admin
   * Luồng theo sơ đồ:
   *   #3 → SystemConfigDAO.truyVanThamSoToanCuc()
   *   #4 ← traVeDanhSachThamSo()
   *   #5 ← traVeDuLieuThamSo()
   * @param {object} params
   */
  async yeuCauLayDanhSachThamSo(params = {}) {
    throw new NotImplementedException('SystemConfigService.yeuCauLayDanhSachThamSo');
  }

  /**
   * UC58. Cấu hình tham số hệ thống - sequence #8: UI → SystemConfigService
   * Vai trò gọi: Admin
   * Luồng theo sơ đồ:
   *   #9 ↻ this.kiemTraTinhHopLeCuaThamSo()
   *   #10 ← thongBaoThamSoKhongHopLe()
   *   #12 → SystemConfigDAO.capNhatThamSoMoi()
   *   #13 ← xacNhanCapNhatThanhCong()
   *   #14 ↻ this.xoaBoNhoDemToanCuc()
   *   #15 → AuditLogService.ghiNhanNhatKyQuanTri
   *   #16 → AuditLogDAO.luuNhatKyCapNhatThamSo()
   *   #17 ← xacNhanLuuNhatKyThanhCong()
   *   #18 ← hoanTatGhiNhatKy()
   *   #19 ← thongBaoCapNhatThanhCong()
   * @param {object} params
   */
  async guiYeuCauCapNhatThamSo(params = {}) {
    throw new NotImplementedException('SystemConfigService.guiYeuCauCapNhatThamSo');
  }

  // ---------------------------------------------------------------- Phương thức nội bộ (self-call trong sơ đồ)

  /**
   * UC58. Cấu hình tham số hệ thống - sequence #9: nội bộ
   * @param {object} params
   */
  async kiemTraTinhHopLeCuaThamSo(params = {}) {
    throw new NotImplementedException('SystemConfigService.kiemTraTinhHopLeCuaThamSo');
  }

  /**
   * UC58. Cấu hình tham số hệ thống - sequence #14: nội bộ
   * @param {object} params
   */
  async xoaBoNhoDemToanCuc(params = {}) {
    throw new NotImplementedException('SystemConfigService.xoaBoNhoDemToanCuc');
  }
}

module.exports = SystemConfigService;
