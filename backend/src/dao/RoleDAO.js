'use strict';
const BaseDAO = require('./BaseDAO');
const { NotImplementedException } = require('../exceptions');

class RoleDAO extends BaseDAO {
  /**
   * UC59. Phân quyền truy cập (RBAC) (#3)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async truyVanDanhSachVaiTroVaQuyen(params = {}, conn = null) {
    throw new NotImplementedException('RoleDAO.truyVanDanhSachVaiTroVaQuyen');
  }

  /**
   * UC59. Phân quyền truy cập (RBAC) (#12)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async capNhatChinhSachQuyenMoi(params = {}, conn = null) {
    throw new NotImplementedException('RoleDAO.capNhatChinhSachQuyenMoi');
  }
}

module.exports = RoleDAO;
