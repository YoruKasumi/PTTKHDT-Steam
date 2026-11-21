'use strict';
const BaseDAO = require('./BaseDAO');
const { NotImplementedException } = require('../exceptions');

class NotificationDAO extends BaseDAO {
  async createNotification(params = {}, conn = null) {
    await this.query(
      `INSERT INTO NOTIFICATION (NotificationID, AccountID, Type, Content)
       VALUES (?, ?, ?, ?)`,
      [params.notificationId, params.accountId, params.type, params.content],
      conn,
    );
  }

  /**
   * Lấy danh sách thông báo của tài khoản (mới nhất xếp trước)
   */
  async layDanhSachThongBao(params = {}, conn = null) {
    const limit = Math.max(1, Math.min(100, Number(params.limit) || 50));
    const offset = Math.max(0, Number(params.offset) || 0);

    return this.query(
      `SELECT NotificationID, AccountID, Type, Content, SentAt, IsRead
       FROM NOTIFICATION
       WHERE AccountID = ?
       ORDER BY SentAt DESC
       LIMIT ? OFFSET ?`,
      [params.accountId, limit, offset],
      conn,
    );
  }

  /**
   * Đếm số thông báo chưa đọc của tài khoản
   */
  async demThongBaoChuaDoc(params = {}, conn = null) {
    const rows = await this.query(
      `SELECT COUNT(*) AS total
       FROM NOTIFICATION
       WHERE AccountID = ? AND IsRead = 0`,
      [params.accountId],
      conn,
    );
    return rows[0]?.total ? Number(rows[0].total) : 0;
  }

  /**
   * Đánh dấu 1 thông báo là đã đọc
   */
  async danhDauDaDoc(params = {}, conn = null) {
    const result = await this.query(
      `UPDATE NOTIFICATION
       SET IsRead = 1
       WHERE NotificationID = ? AND AccountID = ?`,
      [params.notificationId, params.accountId],
      conn,
    );
    return (result?.affectedRows || 0) > 0;
  }

  /**
   * Đánh dấu tất cả thông báo của tài khoản là đã đọc
   */
  async danhDauTatCaDaDoc(params = {}, conn = null) {
    const result = await this.query(
      `UPDATE NOTIFICATION
       SET IsRead = 1
       WHERE AccountID = ? AND IsRead = 0`,
      [params.accountId],
      conn,
    );
    return result?.affectedRows || 0;
  }

  /**
   * UC22. Quản lý thông báo hệ thống (#4)
   * UC22. Quản lý thông báo hệ thống (#10)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async luuTrangThaiThongBao(params = {}, conn = null) {
    throw new NotImplementedException('NotificationDAO.luuTrangThaiThongBao');
  }
}

module.exports = NotificationDAO;
