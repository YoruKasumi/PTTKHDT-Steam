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
