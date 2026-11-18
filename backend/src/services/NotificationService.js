'use strict';
const BaseService = require('./BaseService');
const { NotImplementedException } = require('../exceptions');
const NotificationDAO = require('../dao/NotificationDAO');

/**
 * NotificationService - tầng Business Logic.
 * Tên phương thức lấy đúng từ sơ đồ sequence; nội dung bên dưới chỉ là khung cần cài đặt.
 */
class NotificationService extends BaseService {
  constructor() {
    super();
    this.notificationDAO = new NotificationDAO();
  }

  // ---------------------------------------------------------------- Phương thức công khai (Route / Service khác gọi)

  /**
   * UC22. Quản lý thông báo hệ thống - sequence #3: UI → NotificationService
   * Vai trò gọi: Customer
   * Luồng theo sơ đồ:
   *   #4 → NotificationDAO.luuTrangThaiThongBao()
   *   #5 ← xacNhanCapNhatThanhCong()
   *   #6 ← thongBaoBatThanhCong()
   * @param {object} params
   */
  async capNhatTrangThaiBat(params = {}) {
    throw new NotImplementedException('NotificationService.capNhatTrangThaiBat');
  }

  /**
   * UC22. Quản lý thông báo hệ thống - sequence #9: UI → NotificationService
   * Vai trò gọi: Customer
   * Luồng theo sơ đồ:
   *   #10 → NotificationDAO.luuTrangThaiThongBao()
   *   #11 ← xacNhanCapNhatThanhCong()
   *   #12 ← thongBaoTatThanhCong()
   * @param {object} params
   */
  async capNhatTrangThaiTat(params = {}) {
    throw new NotImplementedException('NotificationService.capNhatTrangThaiTat');
  }
}

module.exports = NotificationService;
