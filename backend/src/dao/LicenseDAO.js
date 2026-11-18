'use strict';
const BaseDAO = require('./BaseDAO');
const { NotImplementedException } = require('../exceptions');

class LicenseDAO extends BaseDAO {
  /**
   * UC16. Xem thư viện cá nhân (#3)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async layDanhSachGameDaSoHuu(params = {}, conn = null) {
    throw new NotImplementedException('LicenseDAO.layDanhSachGameDaSoHuu');
  }

  /**
   * UC16. Xem thư viện cá nhân (#5)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async kiemTraCapNhatGame(params = {}, conn = null) {
    throw new NotImplementedException('LicenseDAO.kiemTraCapNhatGame');
  }

  /**
   * UC17. Khởi chạy game (#3)
   * UC18. Tải game (#3)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async kiemTraTokenBanQuyen(params = {}, conn = null) {
    throw new NotImplementedException('LicenseDAO.kiemTraTokenBanQuyen');
  }

  /**
   * UC17. Khởi chạy game (#7)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async taiBanVaCapNhat(params = {}, conn = null) {
    throw new NotImplementedException('LicenseDAO.taiBanVaCapNhat');
  }

  /**
   * UC18. Tải game (#7)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async layGoiCaiDat(params = {}, conn = null) {
    throw new NotImplementedException('LicenseDAO.layGoiCaiDat');
  }
}

module.exports = LicenseDAO;
