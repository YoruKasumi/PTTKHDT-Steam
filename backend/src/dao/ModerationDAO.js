'use strict';
const BaseDAO = require('./BaseDAO');
const { NotImplementedException } = require('../exceptions');

class ModerationDAO extends BaseDAO {
  /**
   * UC38. Kiểm tra thông tin game mới (#3)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async truyVanDanhSachGameChoDuyet(params = {}, conn = null) {
    throw new NotImplementedException('ModerationDAO.truyVanDanhSachGameChoDuyet');
  }

  /**
   * UC38. Kiểm tra thông tin game mới (#8)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async truyVanChiTietGame(params = {}, conn = null) {
    throw new NotImplementedException('ModerationDAO.truyVanChiTietGame');
  }

  /**
   * UC38. Kiểm tra thông tin game mới (#13)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async luuTrangThaiDaKiemTra(params = {}, conn = null) {
    throw new NotImplementedException('ModerationDAO.luuTrangThaiDaKiemTra');
  }

  /**
   * UC39. Phê duyệt phát hành game (#3)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async kiemTraTrangThaiGameVaFile(params = {}, conn = null) {
    throw new NotImplementedException('ModerationDAO.kiemTraTrangThaiGameVaFile');
  }

  /**
   * UC39. Phê duyệt phát hành game (#7)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async capNhatTrangThaiPhatHanhStore(params = {}, conn = null) {
    throw new NotImplementedException('ModerationDAO.capNhatTrangThaiPhatHanhStore');
  }

  /**
   * UC40. Từ chối phát hành game (#8)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async capNhatTrangThaiRejected(params = {}, conn = null) {
    throw new NotImplementedException('ModerationDAO.capNhatTrangThaiRejected');
  }

  /**
   * UC41. Gỡ bỏ game khẩn cấp (#5)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async capNhatTrangThaiDelisted(params = {}, conn = null) {
    throw new NotImplementedException('ModerationDAO.capNhatTrangThaiDelisted');
  }

  /**
   * UC43. Xử lý đánh giá vi phạm (#5)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async capNhatTrangThaiAnHoacXoaDanhGia(params = {}, conn = null) {
    throw new NotImplementedException('ModerationDAO.capNhatTrangThaiAnHoacXoaDanhGia');
  }

  /**
   * UC47. Giám sát nội dung cộng đồng (#3)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async truyVanNoiDungBiGanCo(params = {}, conn = null) {
    throw new NotImplementedException('ModerationDAO.truyVanNoiDungBiGanCo');
  }

  /**
   * UC47. Giám sát nội dung cộng đồng (#8)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async luuTrangThaiKiemDuyet(params = {}, conn = null) {
    throw new NotImplementedException('ModerationDAO.luuTrangThaiKiemDuyet');
  }
}

module.exports = ModerationDAO;
