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

  async kiemTraTrungLapTenTheLoai(params = {}, conn = null) {
    return this.one('SELECT GenreID FROM GENRE WHERE GenreName = ? LIMIT 1', [params.genreName], conn);
  }

  async taoTheLoaiMoi(params = {}, conn = null) {
    await this.query(
      'INSERT INTO GENRE (GenreName, Description) VALUES (?, ?)',
      [params.genreName, params.description || null],
      conn,
    );
    return this.one('SELECT GenreID, GenreName, Description FROM GENRE WHERE GenreName = ? LIMIT 1', [params.genreName], conn);
  }

  async kiemTraTrungLapTenMoi(params = {}, conn = null) {
    return this.one(
      'SELECT GenreID FROM GENRE WHERE GenreName = ? AND GenreID <> ? LIMIT 1',
      [params.genreName, params.genreId],
      conn,
    );
  }

  async capNhatTheLoai(params = {}, conn = null) {
    const result = await this.query(
      'UPDATE GENRE SET GenreName = ?, Description = ? WHERE GenreID = ?',
      [params.genreName, params.description || null, params.genreId],
      conn,
    );
    return result.affectedRows;
  }

  async kiemTraRangBuocGameDangDung(params = {}, conn = null) {
    const row = await this.one(
      'SELECT COUNT(*) AS Count FROM GAME_GENRE WHERE GenreID = ?',
      [params.genreId],
      conn,
    );
    return Number(row.Count);
  }

  async xoaTheLoai(params = {}, conn = null) {
    const result = await this.query('DELETE FROM GENRE WHERE GenreID = ?', [params.genreId], conn);
    return result.affectedRows;
  }
}

module.exports = GenreDAO;
