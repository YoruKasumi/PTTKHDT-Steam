'use strict';
const BaseDAO = require('./BaseDAO');

class GenreDAO extends BaseDAO {
  async listGenres(params = {}, conn = null) {
    return this.query(
      'SELECT GenreID, GenreName, Description FROM GENRE ORDER BY GenreName',
      [],
      conn,
    );
  }

  async layTheLoaiTheoId(params = {}, conn = null) {
    return this.one(
      'SELECT GenreID, GenreName, Description FROM GENRE WHERE GenreID = ? LIMIT 1',
      [params.genreId],
      conn,
    );
  }

  /**
   * UC48. Quản lý danh mục thể loại (#4)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async kiemTraTrungLapTenTheLoai(params = {}, conn = null) {
    return this.one('SELECT GenreID FROM GENRE WHERE GenreName = ? LIMIT 1', [params.genreName], conn);
  }

  /**
   * UC48. Quản lý danh mục thể loại (#8)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async taoTheLoaiMoi(params = {}, conn = null) {
    await this.query(
      'INSERT INTO GENRE (GenreName, Description) VALUES (?, ?)',
      [params.genreName, params.description || null],
      conn,
    );
    return this.one('SELECT GenreID, GenreName, Description FROM GENRE WHERE GenreName = ? LIMIT 1', [params.genreName], conn);
  }

  /**
   * UC48. Quản lý danh mục thể loại (#14)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async kiemTraTrungLapTenMoi(params = {}, conn = null) {
    return this.one(
      'SELECT GenreID FROM GENRE WHERE GenreName = ? AND GenreID <> ? LIMIT 1',
      [params.genreName, params.genreId],
      conn,
    );
  }

  /**
   * UC48. Quản lý danh mục thể loại (#18)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async capNhatTheLoai(params = {}, conn = null) {
    const result = await this.query(
      'UPDATE GENRE SET GenreName = ?, Description = ? WHERE GenreID = ?',
      [params.genreName, params.description || null, params.genreId],
      conn,
    );
    return result.affectedRows;
  }

  /**
   * UC48. Quản lý danh mục thể loại (#24)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async kiemTraRangBuocGameDangDung(params = {}, conn = null) {
    const row = await this.one(
      'SELECT COUNT(*) AS Count FROM GAME_GENRE WHERE GenreID = ?',
      [params.genreId],
      conn,
    );
    return Number(row.Count);
  }

  /**
   * UC48. Quản lý danh mục thể loại (#28)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async xoaTheLoai(params = {}, conn = null) {
    const result = await this.query('DELETE FROM GENRE WHERE GenreID = ?', [params.genreId], conn);
    return result.affectedRows;
  }
}

module.exports = GenreDAO;
