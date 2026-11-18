'use strict';
const BaseDAO = require('./BaseDAO');
const { NotImplementedException } = require('../exceptions');

class OrderDAO extends BaseDAO {
  /**
   * UC15. Thanh toán (#5)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async truyVanMaGiamGia(params = {}, conn = null) {
    throw new NotImplementedException('OrderDAO.truyVanMaGiamGia');
  }

  /**
   * UC15. Thanh toán (#22)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async xoaGioHang(params = {}, conn = null) {
    throw new NotImplementedException('OrderDAO.xoaGioHang');
  }

  /**
   * UC21. Yêu cầu hoàn tiền (#3)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async kiemTraTokenBanQuyen(params = {}, conn = null) {
    throw new NotImplementedException('OrderDAO.kiemTraTokenBanQuyen');
  }

  /**
   * UC21. Yêu cầu hoàn tiền (#5)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async kiemTraThoiGianThanhToanDuoi24h(params = {}, conn = null) {
    throw new NotImplementedException('OrderDAO.kiemTraThoiGianThanhToanDuoi24h');
  }

  /**
   * UC21. Yêu cầu hoàn tiền (#7)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async thuHoiBanQuyenGame(params = {}, conn = null) {
    throw new NotImplementedException('OrderDAO.thuHoiBanQuyenGame');
  }
}

module.exports = OrderDAO;
