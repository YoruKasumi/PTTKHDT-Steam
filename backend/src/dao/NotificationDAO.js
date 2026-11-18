'use strict';
const BaseDAO = require('./BaseDAO');
const { NotImplementedException } = require('../exceptions');

class NotificationDAO extends BaseDAO {
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
