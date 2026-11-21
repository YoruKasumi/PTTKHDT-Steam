'use strict';
const BaseDAO = require('./BaseDAO');

class CartDAO extends BaseDAO {
  /**
   * UC8. Xem giỏ hàng (#3)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async layDanhSachSanPhamTrongGio(params = {}, conn = null) {
    return this.query(
      `SELECT item.CustomerID, item.GameID, item.PriceAtAdd,
              game.Title, game.CoverImage, game.Status AS GameStatus,
              game.DeveloperID, price.BasePrice, price.PercentOff,
              price.CurrentPrice,
              EXISTS (
                SELECT 1 FROM LICENSE AS license
                WHERE license.CustomerID = item.CustomerID
                  AND license.GameID = item.GameID
                  AND license.Status = 'Active'
              ) AS IsOwned,
              (SELECT GROUP_CONCAT(DISTINCT genre.GenreName ORDER BY genre.GenreName SEPARATOR ',')
               FROM GAME_GENRE AS gameGenre
               INNER JOIN GENRE AS genre ON genre.GenreID = gameGenre.GenreID
               WHERE gameGenre.GameID = game.GameID) AS GenreNames
       FROM CARTITEM AS item
       INNER JOIN GAME AS game ON game.GameID = item.GameID
       INNER JOIN V_GAME_PRICE AS price ON price.GameID = game.GameID
       WHERE item.CustomerID = ?
       ORDER BY game.Title, item.GameID`,
      [params.customerId],
      conn,
    );
  }

  /**
   * UC8. Xem giỏ hàng (#5)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async layDonGiaTungSanPham(params = {}, conn = null) {
    return this.one(
      `SELECT game.GameID, game.DeveloperID, game.Status AS GameStatus,
              price.BasePrice, price.PercentOff, price.CurrentPrice
       FROM GAME AS game
       INNER JOIN V_GAME_PRICE AS price ON price.GameID = game.GameID
       WHERE game.GameID = ?`,
      [params.gameId],
      conn,
    );
  }

  /**
   * UC9. Thêm game vào giỏ hàng (#3)
   * UC10. Xóa game khỏi giỏ hàng (#3)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async kiemTraSanPhamTrongGio(params = {}, conn = null) {
    return this.one(
      `SELECT GameID FROM CARTITEM WHERE CustomerID = ? AND GameID = ?`,
      [params.customerId, params.gameId],
      conn,
    );
  }

  async kiemTraDaSoHuu(params = {}, conn = null) {
    return this.one(
      `SELECT LicenseID
       FROM LICENSE
       WHERE CustomerID = ? AND GameID = ? AND Status = 'Active'
       LIMIT 1`,
      [params.customerId, params.gameId],
      conn,
    );
  }

  /**
   * UC9. Thêm game vào giỏ hàng (#13)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async themSanPhamVaoGioHang(params = {}, conn = null) {
    await this.query(
      `INSERT IGNORE INTO CART (CustomerID) VALUES (?)`,
      [params.customerId],
      conn,
    );
    const result = await this.query(
      `INSERT INTO CARTITEM (CustomerID, GameID, PriceAtAdd) VALUES (?, ?, ?)`,
      [params.customerId, params.gameId, params.priceAtAdd],
      conn,
    );
    return result.affectedRows === 1;
  }

  /**
   * UC10. Xóa game khỏi giỏ hàng (#5)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async xoaSanPhamKhoiGioHang(params = {}, conn = null) {
    const result = await this.query(
      `DELETE FROM CARTITEM WHERE CustomerID = ? AND GameID = ?`,
      [params.customerId, params.gameId],
      conn,
    );
    return result.affectedRows === 1;
  }
}

module.exports = CartDAO;
