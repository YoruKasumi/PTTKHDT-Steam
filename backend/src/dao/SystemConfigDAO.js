'use strict';
const BaseDAO = require('./BaseDAO');

class SystemConfigDAO extends BaseDAO {
  /**
   * UC58. Cấu hình tham số hệ thống (#3)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async truyVanThamSoToanCuc(params = {}, conn = null) {
    return this.query(
      'SELECT ParamKey, ParamValue, Description, UpdatedBy, UpdatedAt FROM SYSTEM_PARAMETER ORDER BY ParamKey',
      [],
      conn,
    );
  }

  /**
   * UC58. Cấu hình tham số hệ thống (#12)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async capNhatThamSoMoi(params = {}, conn = null) {
    await this.query(
      `INSERT INTO SYSTEM_PARAMETER (ParamKey, ParamValue, Description, UpdatedBy)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         ParamValue = VALUES(ParamValue),
         Description = VALUES(Description),
         UpdatedBy = VALUES(UpdatedBy)`,
      [params.key, String(params.value), params.description || null, params.updatedBy],
      conn,
    );
    return this.one(
      'SELECT ParamKey, ParamValue, Description, UpdatedBy, UpdatedAt FROM SYSTEM_PARAMETER WHERE ParamKey = ?',
      [params.key],
      conn,
    );
  }
}

module.exports = SystemConfigDAO;
