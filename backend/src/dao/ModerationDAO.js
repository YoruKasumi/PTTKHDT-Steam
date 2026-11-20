'use strict';
const BaseDAO = require('./BaseDAO');
const { NotImplementedException } = require('../exceptions');

class ModerationDAO extends BaseDAO {
  async listReviews(params = {}, conn = null) {
    return this.query(
      `SELECT review.ReviewID, review.CustomerID, account.Username, review.GameID,
              game.Title AS GameTitle, review.Rating, review.Content, review.ReviewDate, review.Status
       FROM REVIEW AS review
       INNER JOIN ACCOUNT AS account ON account.AccountID = review.CustomerID
       INNER JOIN GAME AS game ON game.GameID = review.GameID
       ORDER BY review.ReviewDate DESC
       LIMIT 500`,
      [],
      conn,
    );
  }

  async layDanhGiaTheoId(params = {}, conn = null) {
    return this.one(
      `SELECT ReviewID, CustomerID, Status FROM REVIEW WHERE ReviewID = ? LIMIT 1`,
      [params.reviewId],
      conn,
    );
  }

  async capNhatTrangThaiDanhGia(params = {}, conn = null) {
    const result = await this.query(
      'UPDATE REVIEW SET Status = ? WHERE ReviewID = ?',
      [params.status, params.reviewId],
      conn,
    );
    return result.affectedRows;
  }

  async taoThongBaoDanhGia(params = {}, conn = null) {
    await this.query(
      'INSERT INTO NOTIFICATION (AccountID, Type, Content) VALUES (?, ?, ?)',
      [params.accountId, params.type, params.content],
      conn,
    );
  }

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
