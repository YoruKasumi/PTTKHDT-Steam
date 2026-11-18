'use strict';
const BaseDAO = require('./BaseDAO');
const { NotImplementedException } = require('../exceptions');

class WithdrawalDAO extends BaseDAO {
  /**
   * UC33. Rút doanh thu về ngân hàng (#3)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async kiemTraSoTienKhaDung(params = {}, conn = null) {
    throw new NotImplementedException('WithdrawalDAO.kiemTraSoTienKhaDung');
  }

  /**
   * UC33. Rút doanh thu về ngân hàng (#8)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async taoLenhRutTienVaTamGiuSoDu(params = {}, conn = null) {
    throw new NotImplementedException('WithdrawalDAO.taoLenhRutTienVaTamGiuSoDu');
  }

  /**
   * UC57. Phê duyệt rút doanh thu (#3)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async truyVanChiTietLenhRutVaThongTinNganHang(params = {}, conn = null) {
    throw new NotImplementedException('WithdrawalDAO.truyVanChiTietLenhRutVaThongTinNganHang');
  }

  /**
   * UC57. Phê duyệt rút doanh thu (#8)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async hoanLaiSoDuTamGiuVaoViNPH(params = {}, conn = null) {
    throw new NotImplementedException('WithdrawalDAO.hoanLaiSoDuTamGiuVaoViNPH');
  }

  /**
   * UC57. Phê duyệt rút doanh thu (#16)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async capNhatTrangThaiRutTienThanhCong(params = {}, conn = null) {
    throw new NotImplementedException('WithdrawalDAO.capNhatTrangThaiRutTienThanhCong');
  }
}

module.exports = WithdrawalDAO;
