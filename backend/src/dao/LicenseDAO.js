'use strict';
const BaseDAO = require('./BaseDAO');

class LicenseDAO extends BaseDAO {
  async ghiNhanPhienChoi(params = {}, conn = null) {
    await this.query(
      `INSERT INTO GAMEPLAYSESSION (LicenseID, CustomerID, GameID, StartedAt, LastSeenAt)
       VALUES (?, ?, ?, NOW(), NOW())
       ON DUPLICATE KEY UPDATE CustomerID = VALUES(CustomerID), GameID = VALUES(GameID), LastSeenAt = NOW()`,
      [params.licenseId, params.customerId, params.gameId],
      conn,
    );
  }

  /**
   * UC16. Xem thư viện cá nhân (#3) — Lấy danh sách game đã sở hữu kèm phiên bản hiện hành.
   * @param {{ customerId: string }} params
   */
  async layDanhSachGameDaSoHuu(params = {}, conn = null) {
    return this.query(
      `SELECT l.LicenseID, l.GameID, l.Source, l.PurchaseDate, l.Status AS LicenseStatus,
              g.Title, g.CoverImage, g.Status AS GameStatus,
              gv.VersionID, gv.VersionNumber, gv.ChangeLog, gv.UploadDate AS VersionDate,
              gv.FileSize, gv.Sha256
       FROM LICENSE l
       INNER JOIN GAME g ON g.GameID = l.GameID
       LEFT JOIN GAMEVERSION gv ON gv.GameID = l.GameID AND gv.IsCurrent = 1
       WHERE l.CustomerID = ? AND l.Status = 'Active'
       ORDER BY l.PurchaseDate DESC`,
      [params.customerId],
      conn,
    );
  }

  /**
   * UC16. Xem thư viện cá nhân (#5)
   */
  async kiemTraCapNhatGame(params = {}, conn = null) {
    return this.one(
      `SELECT gv.VersionID, gv.VersionNumber, gv.Sha256, gv.FileSize
       FROM GAMEVERSION gv
       WHERE gv.GameID = ? AND gv.IsCurrent = 1`,
      [params.gameId],
      conn,
    );
  }

  /**
   * UC17. Khởi chạy game (#3) — Kiểm tra LICENSE tồn tại + Active, kèm thông tin phiên bản.
   * @param {{ customerId: string, gameId: string }} params
   */
  async kiemTraTokenBanQuyen(params = {}, conn = null) {
    return this.one(
      `SELECT l.LicenseID, l.CustomerID, l.GameID, l.Status AS LicenseStatus,
              g.DeveloperID,
              gv.VersionID, gv.VersionNumber, gv.BuildFile, gv.FileSize, gv.Sha256
       FROM LICENSE l
       INNER JOIN GAME g ON g.GameID = l.GameID
       INNER JOIN GAMEVERSION gv ON gv.GameID = l.GameID AND gv.IsCurrent = 1
       WHERE l.CustomerID = ? AND l.GameID = ? AND l.Status = 'Active'
       LIMIT 1`,
      [params.customerId, params.gameId],
      conn,
    );
  }

  /**
   * Tìm mã kích hoạt (ACTIVATIONKEY) theo KeyCode và khóa dòng trong transaction.
   * @param {{ keyCode: string }} params
   */
  async timKeyKichHoat(params = {}, conn = null) {
    return this.one(
      `SELECT KeyID, KeyCode, GameID, Status
       FROM ACTIVATIONKEY
       WHERE KeyCode = ?
       FOR UPDATE`,
      [params.keyCode],
      conn,
    );
  }

  /**
   * Cập nhật mã kích hoạt sang trạng thái Used.
   * @param {{ keyId: string, customerId: string }} params
   */
  async capNhatKeyDaSuDung(params = {}, conn = null) {
    const result = await this.query(
      `UPDATE ACTIVATIONKEY
       SET Status = 'Used', ActivatedDate = NOW(), RedeemedBy = ?
       WHERE KeyID = ? AND Status = 'Unused'`,
      [params.customerId, params.keyId],
      conn,
    );
    return result.affectedRows === 1;
  }

  /**
   * Tạo bản quyền từ việc đổi Key.
   * @param {{ licenseId: string, customerId: string, gameId: string, accessTokenHash: string }} params
   */
  async taoBanQuyenTuKey(params = {}, conn = null) {
    await this.query(
      `INSERT INTO LICENSE (LicenseID, CustomerID, GameID, Source, AccessToken, Status)
       VALUES (?, ?, ?, 'Key', ?, 'Active')`,
      [params.licenseId, params.customerId, params.gameId, params.accessTokenHash],
      conn,
    );
  }

  /**
   * Lấy thông tin game đơn giản (Title, CoverImage).
   * @param {{ gameId: string }} params
   */
  async layThongTinGameDonGian(params = {}, conn = null) {
    return this.one(
      `SELECT GameID, Title, CoverImage, Status FROM GAME WHERE GameID = ?`,
      [params.gameId],
      conn,
    );
  }

  /**
   * Kiểm tra xem khách đã có bản quyền Active của game chưa.
   * @param {{ customerId: string, gameId: string }} params
   */
  async kiemTraGameDaSoHuu(params = {}, conn = null) {
    return this.one(
      `SELECT LicenseID
       FROM LICENSE
       WHERE CustomerID = ? AND GameID = ? AND Status = 'Active'
       FOR UPDATE`,
      [params.customerId, params.gameId],
      conn,
    );
  }

  async thuHoiBanQuyenTaiKhoan(params = {}, conn = null) {
    const licenses = await this.query(
      `SELECT LicenseID
         FROM LICENSE
        WHERE CustomerID = ? AND Status = 'Active'
        FOR UPDATE`,
      [params.customerId],
      conn,
    );
    if (!licenses.length) return 0;

    const licenseIds = licenses.map((license) => license.LicenseID);
    const placeholders = licenseIds.map(() => '?').join(', ');
    await this.query(
      `UPDATE LICENSE
          SET Status = 'Revoked', RevokedAt = NOW(), RevokedReason = 'AccountSuspended'
        WHERE LicenseID IN (${placeholders}) AND Status = 'Active'`,
      licenseIds,
      conn,
    );
    return licenses.length;
  }

  async khoiPhucBanQuyenTaiKhoan(params = {}, conn = null) {
    const licenses = await this.query(
      `SELECT LicenseID
         FROM LICENSE
        WHERE CustomerID = ? AND Status = 'Revoked' AND RevokedReason = 'AccountSuspended'
        FOR UPDATE`,
      [params.customerId],
      conn,
    );
    if (!licenses.length) return 0;

    const licenseIds = licenses.map((license) => license.LicenseID);
    const licensePlaceholders = licenseIds.map(() => '?').join(', ');
    await this.query(
      `UPDATE LICENSE
          SET Status = 'Active', RevokedAt = NULL, RevokedReason = NULL
        WHERE LicenseID IN (${licensePlaceholders})
          AND Status = 'Revoked' AND RevokedReason = 'AccountSuspended'`,
      licenseIds,
      conn,
    );

    return licenses.length;
  }

  /**
   * verify-launch: Kiểm tra đồng thời LICENSE + ACCOUNT đều Active.
   * @param {{ licenseId: string, customerId: string }} params
   */
  async kiemTraHopLeTheoThoiGianThuc(params = {}, conn = null) {
    return this.one(
      `SELECT l.LicenseID, l.Status AS LicenseStatus,
              a.Status AS AccountStatus
       FROM LICENSE l
       INNER JOIN ACCOUNT a ON a.AccountID = l.CustomerID
       WHERE l.LicenseID = ? AND l.CustomerID = ?
       LIMIT 1`,
      [params.licenseId, params.customerId],
      conn,
    );
  }

  /**
   * Lấy LICENSE theo CustomerID + GameID.
   * @param {{ customerId: string, gameId: string }} params
   */
  async layLicenseCuaKhach(params = {}, conn = null) {
    return this.one(
      `SELECT LicenseID, CustomerID, GameID, Status
       FROM LICENSE
       WHERE CustomerID = ? AND GameID = ? AND Status = 'Active'
       LIMIT 1`,
      [params.customerId, params.gameId],
      conn,
    );
  }
}

module.exports = LicenseDAO;
