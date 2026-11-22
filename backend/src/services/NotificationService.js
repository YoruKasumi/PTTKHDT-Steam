'use strict';
const { randomUUID } = require('node:crypto');
const BaseService = require('./BaseService');
const { ValidationException, NotFoundException } = require('../exceptions');
const NotificationDAO = require('../dao/NotificationDAO');
const AccountDAO = require('../dao/AccountDAO');

/**
 * NotificationService - tầng Business Logic.
 * Tên phương thức lấy đúng từ sơ đồ sequence; quản lý thông báo người dùng.
 */
class NotificationService extends BaseService {
  constructor() {
    super();
    this.notificationDAO = new NotificationDAO();
    this.accountDAO = new AccountDAO();
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

  /**
   * Tạo thông báo cho Developer (chức năng rút tiền/kiểm duyệt game)
   */
  async taoThongBaoChoDeveloper(params = {}, conn = null) {
    const developerId = params.developerId || params.accountId;
    return this.createNotification({
      accountId: developerId,
      type: params.type || 'SYSTEM',
      content: params.content,
    }, conn);
  }

  /**
   * Lấy danh sách thông báo và số lượng chưa đọc của tài khoản hiện tại.
   * GET /api/notifications
   */
  async layDanhSachThongBao(params = {}) {
    const accountId = params.user?.accountId || params.accountId;
    if (!accountId) throw new ValidationException('Tài khoản không hợp lệ.');

    const limit = params.limit ? parseInt(params.limit, 10) : 50;
    const offset = params.offset ? parseInt(params.offset, 10) : 0;

    const [rows, unreadCount] = await Promise.all([
      this.notificationDAO.layDanhSachThongBao({ accountId, limit, offset }),
      this.notificationDAO.demThongBaoChuaDoc({ accountId }),
    ]);

    const items = rows.map((r) => ({
      notificationId: r.NotificationID,
      id: r.NotificationID,
      type: r.Type,
      content: r.Content,
      sentAt: r.SentAt,
      isRead: Boolean(r.IsRead),
    }));

    return {
      items,
      unreadCount,
    };
  }

  /**
   * Đánh dấu 1 thông báo là đã đọc.
   * PATCH /api/notifications/:id/read
   */
  async danhDauDaDoc(params = {}) {
    const accountId = params.user?.accountId || params.accountId;
    const notificationId = params.notificationId || params.id;

    if (!accountId) throw new ValidationException('Tài khoản không hợp lệ.');
    if (!notificationId) throw new ValidationException('ID thông báo không hợp lệ.');

    const updated = await this.notificationDAO.danhDauDaDoc({ notificationId, accountId });
    if (!updated) {
      throw new NotFoundException('Thông báo không tồn tại hoặc đã được xử lý.');
    }

    return { notificationId, isRead: true };
  }

  /**
   * Đánh dấu tất cả thông báo là đã đọc.
   * PATCH /api/notifications/read-all
   */
  async danhDauTatCaDaDoc(params = {}) {
    const accountId = params.user?.accountId || params.accountId;
    if (!accountId) throw new ValidationException('Tài khoản không hợp lệ.');

    const updatedCount = await this.notificationDAO.danhDauTatCaDaDoc({ accountId });
    return { updatedCount, isRead: true };
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
    const accountId = params.user?.accountId;
    if (!accountId) throw new ValidationException('Tài khoản không hợp lệ.');
    await this.accountDAO.capNhatTrangThaiThongBao({ accountId, enabled: true });
    const profile = await this.accountDAO.layHoSoCaNhan({ accountId });
    if (!profile) throw new NotFoundException('Không tìm thấy tài khoản');
    return { notifyEnabled: true };
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
    const accountId = params.user?.accountId;
    if (!accountId) throw new ValidationException('Tài khoản không hợp lệ.');
    await this.accountDAO.capNhatTrangThaiThongBao({ accountId, enabled: false });
    const profile = await this.accountDAO.layHoSoCaNhan({ accountId });
    if (!profile) throw new NotFoundException('Không tìm thấy tài khoản');
    return { notifyEnabled: false };
  }
}

// Hàm dùng chung cho các service khác gọi trực tiếp
async function createNotification(accountId, type, content, conn = null) {
  const service = new NotificationService();
  return service.createNotification({ accountId, type, content }, conn);
}

module.exports = NotificationService;
module.exports.createNotification = createNotification;
