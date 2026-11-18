'use strict';
const BaseDAO = require('./BaseDAO');
const { NotImplementedException } = require('../exceptions');

class WishlistDAO extends BaseDAO {
  /**
   * UC11. Quản lý Wishlist (#4)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async kiemTraTrangThaiSoHuu(params = {}, conn = null) {
    throw new NotImplementedException('WishlistDAO.kiemTraTrangThaiSoHuu');
  }

  /**
   * UC11. Quản lý Wishlist (#9)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async themVaoWishlist(params = {}, conn = null) {
    throw new NotImplementedException('WishlistDAO.themVaoWishlist');
  }

  /**
   * UC11. Quản lý Wishlist (#14)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async kiemTraTonTaiTrongWishlist(params = {}, conn = null) {
    throw new NotImplementedException('WishlistDAO.kiemTraTonTaiTrongWishlist');
  }

  /**
   * UC11. Quản lý Wishlist (#16)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async xoaKhoiWishlist(params = {}, conn = null) {
    throw new NotImplementedException('WishlistDAO.xoaKhoiWishlist');
  }
}

module.exports = WishlistDAO;
