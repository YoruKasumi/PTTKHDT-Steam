'use strict';
const BaseDAO = require('./BaseDAO');
const { NotImplementedException } = require('../exceptions');

class PromotionDAO extends BaseDAO {
  /**
   * UC27. Lên chiến dịch Sale (#7)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async luuLichTrinhChienDichSale(params = {}, conn = null) {
    throw new NotImplementedException('PromotionDAO.luuLichTrinhChienDichSale');
  }

  /**
   * UC28. Tự sinh mã kích hoạt (Key) (#3)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async kiemTraGameCoThuPhi(params = {}, conn = null) {
    throw new NotImplementedException('PromotionDAO.kiemTraGameCoThuPhi');
  }

  /**
   * UC28. Tự sinh mã kích hoạt (Key) (#6)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async kiemTraTongKeyChuaKichHoatDuoi2000(params = {}, conn = null) {
    throw new NotImplementedException('PromotionDAO.kiemTraTongKeyChuaKichHoatDuoi2000');
  }

  /**
   * UC28. Tự sinh mã kích hoạt (Key) (#11)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async luuDanhSachMaKeyMoi(params = {}, conn = null) {
    throw new NotImplementedException('PromotionDAO.luuDanhSachMaKeyMoi');
  }
}

module.exports = PromotionDAO;
