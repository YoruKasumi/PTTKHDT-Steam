'use strict';
const BaseDAO = require('./BaseDAO');
const { NotImplementedException } = require('../exceptions');

class CartDAO extends BaseDAO {
  /**
   * UC8. Xem giỏ hàng (#3)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async layDanhSachSanPhamTrongGio(params = {}, conn = null) {
    throw new NotImplementedException('CartDAO.layDanhSachSanPhamTrongGio');
  }

  /**
   * UC8. Xem giỏ hàng (#5)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async layDonGiaTungSanPham(params = {}, conn = null) {
    throw new NotImplementedException('CartDAO.layDonGiaTungSanPham');
  }

  /**
   * UC9. Thêm game vào giỏ hàng (#3)
   * UC10. Xóa game khỏi giỏ hàng (#3)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async kiemTraSanPhamTrongGio(params = {}, conn = null) {
    throw new NotImplementedException('CartDAO.kiemTraSanPhamTrongGio');
  }

  /**
   * UC9. Thêm game vào giỏ hàng (#13)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async themSanPhamVaoGioHang(params = {}, conn = null) {
    throw new NotImplementedException('CartDAO.themSanPhamVaoGioHang');
  }

  /**
   * UC10. Xóa game khỏi giỏ hàng (#5)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async xoaSanPhamKhoiGioHang(params = {}, conn = null) {
    throw new NotImplementedException('CartDAO.xoaSanPhamKhoiGioHang');
  }
}

module.exports = CartDAO;
