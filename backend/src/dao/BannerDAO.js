'use strict';
const BaseDAO = require('./BaseDAO');

class BannerDAO extends BaseDAO {
  /**
   * UC49. Cấu hình banner trang chủ (#8)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async luuCauHinhBannerVaLichHienThi(params = {}, conn = null) {
    await this.query(
      `INSERT INTO BANNER (BannerID, ImageUrl, LinkUrl, Title, StartDate, EndDate, SortOrder, IsActive, CreatedBy)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        params.bannerId,
        params.imageUrl,
        params.linkUrl,
        params.title,
        params.startDate,
        params.endDate,
        params.sortOrder,
        params.isActive ? 1 : 0,
        params.createdBy,
      ],
      conn,
    );
    return this.one(
      `SELECT BannerID, ImageUrl, LinkUrl, Title, StartDate, EndDate, SortOrder, IsActive, CreatedBy, CreatedAt
       FROM BANNER WHERE BannerID = ? LIMIT 1`,
      [params.bannerId],
      conn,
    );
  }

  async listBanners(params = {}, conn = null) {
    return this.query(
      `SELECT BannerID, ImageUrl, LinkUrl, Title, StartDate, EndDate, SortOrder, IsActive, CreatedBy, CreatedAt
       FROM BANNER ORDER BY SortOrder, CreatedAt DESC`,
      [],
      conn,
    );
  }

  async listActiveBanners(params = {}, conn = null) {
    return this.query(
      `SELECT BannerID, ImageUrl, LinkUrl, Title, StartDate, EndDate, SortOrder, IsActive
       FROM BANNER
       WHERE IsActive = 1 AND NOW() BETWEEN StartDate AND EndDate
       ORDER BY SortOrder, CreatedAt DESC`,
      [],
      conn,
    );
  }

  async layBannerTheoId(params = {}, conn = null) {
    return this.one(
      `SELECT BannerID, ImageUrl, LinkUrl, Title, StartDate, EndDate, SortOrder, IsActive, CreatedBy, CreatedAt
       FROM BANNER WHERE BannerID = ? LIMIT 1`,
      [params.bannerId],
      conn,
    );
  }

  async capNhatBanner(params = {}, conn = null) {
    const result = await this.query(
      `UPDATE BANNER
       SET ImageUrl = ?, LinkUrl = ?, Title = ?, StartDate = ?, EndDate = ?, SortOrder = ?, IsActive = ?
       WHERE BannerID = ?`,
      [
        params.imageUrl,
        params.linkUrl,
        params.title,
        params.startDate,
        params.endDate,
        params.sortOrder,
        params.isActive ? 1 : 0,
        params.bannerId,
      ],
      conn,
    );
    return result.affectedRows;
  }

  async xoaBanner(params = {}, conn = null) {
    const result = await this.query('DELETE FROM BANNER WHERE BannerID = ?', [params.bannerId], conn);
    return result.affectedRows;
  }
}

module.exports = BannerDAO;
