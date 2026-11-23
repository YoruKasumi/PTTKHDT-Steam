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
   * UC38. Kiểm tra thông tin game mới (#3) — Danh sách game chờ duyệt.
   */
  async truyVanDanhSachGameChoDuyet(params = {}, conn = null) {
    return this.query(
      `SELECT g.GameID, g.Title, g.Status, g.Price, g.ReleaseDate,
              (SELECT COUNT(*) FROM GAMEPLAYSESSION AS activePlayer
               WHERE activePlayer.GameID = g.GameID AND activePlayer.LastSeenAt >= DATE_SUB(NOW(), INTERVAL 3 MINUTE)) AS PlayerCount,
              a.Username AS DeveloperName, a.Email AS DeveloperEmail,
              gv.VersionID, gv.VersionNumber, gv.BuildFile, gv.FileSize, gv.Sha256, gv.UploadDate
       FROM GAME g
       INNER JOIN ACCOUNT a ON a.AccountID = g.DeveloperID
       LEFT JOIN GAMEVERSION gv ON gv.GameID = g.GameID AND gv.IsCurrent = 1
       WHERE g.Status = ?
       ORDER BY gv.UploadDate DESC
       LIMIT 200`,
      [params.status || 'Pending'],
      conn,
    );
  }

  /**
   * UC38. Chi tiết hồ sơ game (#8)
   */
  async truyVanChiTietGame(params = {}, conn = null) {
    return this.one(
      `SELECT g.GameID, g.DeveloperID, g.Title, g.Description, g.Price, g.Status,
              g.CoverImage, g.MinSpec, g.RecSpec, g.ReleaseDate,
              (SELECT COUNT(*) FROM GAMEPLAYSESSION AS activePlayer
               WHERE activePlayer.GameID = g.GameID AND activePlayer.LastSeenAt >= DATE_SUB(NOW(), INTERVAL 3 MINUTE)) AS PlayerCount,
              a.Username AS DeveloperName, a.Email AS DeveloperEmail,
              gv.VersionID, gv.VersionNumber, gv.BuildFile, gv.FileSize, gv.Sha256,
              gv.ChangeLog, gv.UploadDate
       FROM GAME g
       INNER JOIN ACCOUNT a ON a.AccountID = g.DeveloperID
       LEFT JOIN GAMEVERSION gv ON gv.GameID = g.GameID AND gv.IsCurrent = 1
       WHERE g.GameID = ?
       LIMIT 1`,
      [params.gameId],
      conn,
    );
  }

  /**
   * UC39. Kiểm tra trạng thái game và file (#3).
   * @param {{ gameId: string }} params
   */
  async kiemTraTrangThaiGameVaFile(params = {}, conn = null) {
    return this.one(
      `SELECT g.GameID, g.Status AS GameStatus, g.DeveloperID, g.Title,
              gv.VersionID, gv.VersionNumber, gv.BuildFile, gv.FileSize, gv.Sha256
       FROM GAME g
       LEFT JOIN GAMEVERSION gv ON gv.GameID = g.GameID AND gv.IsCurrent = 1
       WHERE g.GameID = ?
       LIMIT 1`,
      [params.gameId],
      conn,
    );
  }

  /**
   * UC39. Cập nhật trạng thái phát hành store (#7) — Ghi GAMEREVIEW + cập nhật GAME.
   * @param {{ gameId, managerId, decision, reason, fileSize, sha256, versionId, autoWrapped }} params
   */
  async capNhatTrangThaiPhatHanhStore(params = {}, conn = null) {
    // Ghi GAMEREVIEW
    await this.query(
      `INSERT INTO GAMEREVIEW (GameID, ManagerID, Decision, Reason)
       VALUES (?, ?, ?, ?)`,
      [params.gameId, params.managerId, params.decision, params.reason || null],
      conn,
    );
  }

  /**
   * UC40. Cập nhật trạng thái Rejected (#8).
   * @param {{ gameId, managerId, reason }} params
   */
  async capNhatTrangThaiRejected(params = {}, conn = null) {
    await this.query(
      `INSERT INTO GAMEREVIEW (GameID, ManagerID, Decision, Reason)
       VALUES (?, ?, 'Rejected', ?)`,
      [params.gameId, params.managerId, params.reason],
      conn,
    );
  }

  /**
   * UC41. Gỡ bỏ game khẩn cấp (#5).
   * @param {{ gameId, managerId, reason }} params
   */
  async capNhatTrangThaiDelisted(params = {}, conn = null) {
    await this.query(
      `INSERT INTO GAMEREVIEW (GameID, ManagerID, Decision, Reason)
       VALUES (?, ?, 'EmergencyDelist', ?)`,
      [params.gameId, params.managerId, params.reason || null],
      conn,
    );
  }

  /**
   * UC43. Xử lý đánh giá vi phạm (#5)
   */
  async capNhatTrangThaiAnHoacXoaDanhGia(params = {}, conn = null) {
    throw new NotImplementedException('ModerationDAO.capNhatTrangThaiAnHoacXoaDanhGia');
  }

  /**
   * UC47. Giám sát nội dung cộng đồng (#3)
   */
  async truyVanNoiDungBiGanCo(params = {}, conn = null) {
    return this.listReviews(params, conn);
  }

  /**
   * UC47. Giám sát nội dung cộng đồng (#8)
   */
  async luuTrangThaiKiemDuyet(params = {}, conn = null) {
    const result = await this.query(
      'UPDATE REVIEW SET Status = ? WHERE ReviewID = ?',
      [params.status, params.reviewId],
      conn,
    );
    return result.affectedRows;
  }

  /**
   * Gửi NOTIFICATION cho Developer.
   * @param {{ accountId, type, content }} params
   */
  async taoThongBaoChoDeveloper(params = {}, conn = null) {
    await this.query(
      'INSERT INTO NOTIFICATION (AccountID, Type, Content) VALUES (?, ?, ?)',
      [params.accountId, params.type, params.content],
      conn,
    );
  }
}

module.exports = ModerationDAO;
