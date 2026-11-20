'use strict';
const { randomUUID } = require('node:crypto');
const BaseService = require('./BaseService');
const { NotImplementedException, ValidationException } = require('../exceptions');
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

  /**
   * Create a notification; pass the caller's connection to include it in a transaction.
   */
  async createNotification(params = {}, conn = null) {
    const accountId = typeof params.accountId === 'string' ? params.accountId.trim() : '';
    const type = typeof params.type === 'string' ? params.type.trim() : '';
    const content = typeof params.content === 'string' ? params.content.trim() : '';

    if (!accountId) throw new ValidationException('accountId là bắt buộc');
    if (!type || type.length > 30) {
      throw new ValidationException('type là bắt buộc và tối đa 30 ký tự');
    }
    if (!content || content.length > 1000) {
      throw new ValidationException('content là bắt buộc và tối đa 1000 ký tự');
    }

    const notification = {
      notificationId: randomUUID(),
      accountId,
      type,
      content,
      isRead: false,
    };
    await this.notificationDAO.createNotification(notification, conn);
    return notification;
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
