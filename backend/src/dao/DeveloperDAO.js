'use strict';
const BaseDAO = require('./BaseDAO');
const { NotImplementedException } = require('../exceptions');

class DeveloperDAO extends BaseDAO {
  /**
   * UC23. Đăng ký hồ sơ nhà phát hành (#5)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async kiemTraThongTinPhapNhan(params = {}, conn = null) {
    throw new NotImplementedException('DeveloperDAO.kiemTraThongTinPhapNhan');
  }

  /**
   * UC23. Đăng ký hồ sơ nhà phát hành (#16)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async capNhatVaiTroTaiKhoan(params = {}, conn = null) {
    throw new NotImplementedException('DeveloperDAO.capNhatVaiTroTaiKhoan');
  }
}

module.exports = DeveloperDAO;
