'use strict';
const BaseDAO = require('./BaseDAO');

class WishlistDAO extends BaseDAO {
  /**
   * UC11. Quản lý Wishlist (#4)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async kiemTraTrangThaiSoHuu(params = {}, conn = null) {
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
   * UC11. Quản lý Wishlist (#9)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async themVaoWishlist(params = {}, conn = null) {
    await this.query(
      `INSERT INTO WISHLISTITEM (CustomerID, GameID) VALUES (?, ?)`,
      [params.customerId, params.gameId],
      conn,
    );
    return { customerId: params.customerId, gameId: params.gameId };
  }

  /**
   * UC11. Quản lý Wishlist (#14)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async kiemTraTonTaiTrongWishlist(params = {}, conn = null) {
    return this.one(
      `SELECT GameID FROM WISHLISTITEM WHERE CustomerID = ? AND GameID = ?`,
      [params.customerId, params.gameId],
      conn,
    );
  }

  /**
   * UC11. Quản lý Wishlist (#16)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async xoaKhoiWishlist(params = {}, conn = null) {
    const result = await this.query(
      `DELETE FROM WISHLISTITEM WHERE CustomerID = ? AND GameID = ?`,
      [params.customerId, params.gameId],
      conn,
    );
    return result.affectedRows === 1;
  }

  async layDanhSachWishlist(params = {}, conn = null) {
    return this.query(
      `SELECT item.GameID, item.AddedDate, game.Title, game.CoverImage,
              game.Status AS GameStatus, developer.CompanyName,
              price.BasePrice, price.PercentOff, price.CurrentPrice,
              COALESCE(rating.AverageRating, 0) AS AverageRating,
              COALESCE(rating.RatingCount, 0) AS RatingCount,
              (SELECT GROUP_CONCAT(DISTINCT genre.GenreName ORDER BY genre.GenreName SEPARATOR ',')
               FROM GAME_GENRE AS gameGenre
               INNER JOIN GENRE AS genre ON genre.GenreID = gameGenre.GenreID
               WHERE gameGenre.GameID = game.GameID) AS GenreNames
       FROM WISHLISTITEM AS item
       INNER JOIN GAME AS game ON game.GameID = item.GameID
       INNER JOIN DEVELOPER AS developer ON developer.AccountID = game.DeveloperID
       INNER JOIN V_GAME_PRICE AS price ON price.GameID = game.GameID
       LEFT JOIN (
         SELECT GameID, AVG(Rating) AS AverageRating, COUNT(*) AS RatingCount
         FROM REVIEW WHERE Status = 'Visible' GROUP BY GameID
       ) AS rating ON rating.GameID = game.GameID
       WHERE item.CustomerID = ?
       ORDER BY item.AddedDate DESC, item.GameID`,
      [params.customerId],
      conn,
    );
  }
}

module.exports = WishlistDAO;
