'use strict';
const BaseDAO = require('./BaseDAO');
const { NotImplementedException } = require('../exceptions');

class SystemConfigDAO extends BaseDAO {
  /**
   * UC58. Cấu hình tham số hệ thống (#3)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async truyVanThamSoToanCuc(params = {}, conn = null) {
    throw new NotImplementedException('SystemConfigDAO.truyVanThamSoToanCuc');
  }

  /**
   * UC58. Cấu hình tham số hệ thống (#12)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async capNhatThamSoMoi(params = {}, conn = null) {
    throw new NotImplementedException('SystemConfigDAO.capNhatThamSoMoi');
  }
}

module.exports = SystemConfigDAO;
