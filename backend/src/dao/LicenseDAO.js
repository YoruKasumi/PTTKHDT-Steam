'use strict';
const BaseDAO = require('./BaseDAO');
const { NotImplementedException } = require('../exceptions');

class LicenseDAO extends BaseDAO {
  /**
   * UC16. Xem thư viện cá nhân (#3) — Lấy danh sách game đã sở hữu kèm phiên bản hiện hành.
   * @param {{ customerId: string }} params
   */
  async layDanhSachGameDaSoHuu(params = {}, conn = null) {
    return this.query(
      `SELECT l.LicenseID, l.GameID, l.Source, l.PurchaseDate, l.Status AS LicenseStatus,
              g.Title, g.CoverImage, g.Status AS GameStatus,
              gv.VersionID, gv.VersionNumber, gv.ChangeLog, gv.UploadDate AS VersionDate, gv.FileSize
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
    throw new NotImplementedException('LicenseDAO.kiemTraCapNhatGame');
  }

  /**
   * UC17. Khởi chạy game (#3) — Kiểm tra LICENSE tồn tại + Active, kèm thông tin phiên bản.
   * @param {{ customerId: string, gameId: string }} params
   */
  async kiemTraTokenBanQuyen(params = {}, conn = null) {
    return this.one(
      `SELECT l.LicenseID, l.CustomerID, l.GameID, l.Status AS LicenseStatus,
              gv.VersionID, gv.VersionNumber, gv.BuildFile
       FROM LICENSE l
       INNER JOIN GAMEVERSION gv ON gv.GameID = l.GameID AND gv.IsCurrent = 1
       WHERE l.CustomerID = ? AND l.GameID = ? AND l.Status = 'Active'
       LIMIT 1`,
      [params.customerId, params.gameId],
      conn,
    );
  }

  /**
   * UC17. Khởi chạy game (#7) — Kiểm tra & ghi nhận thiết bị.
   * Trả về { action: 'found'|'new'|'revoked', deviceRow }
   */
  async taiBanVaCapNhat(params = {}, conn = null) {
    throw new NotImplementedException('LicenseDAO.taiBanVaCapNhat');
  }

  /**
   * UC18. Tải game (#7)
   */
  async layGoiCaiDat(params = {}, conn = null) {
    throw new NotImplementedException('LicenseDAO.layGoiCaiDat');
  }

  // ─── LICENSE_DEVICE operations ───

  /**
   * Tìm thiết bị theo LicenseID + DeviceFingerprint.
   * @param {{ licenseId: string, deviceFingerprint: string }} params
   */
  async timThietBi(params = {}, conn = null) {
    return this.one(
      `SELECT DeviceID, LicenseID, DeviceFingerprint, DeviceName, Status
       FROM LICENSE_DEVICE
       WHERE LicenseID = ? AND DeviceFingerprint = ?
       LIMIT 1`,
      [params.licenseId, params.deviceFingerprint],
      conn,
    );
  }

  /**
   * Cập nhật LastSeen cho thiết bị đang Active.
   * @param {{ licenseId: string, deviceFingerprint: string }} params
   */
  async capNhatLastSeen(params = {}, conn = null) {
    await this.query(
      `UPDATE LICENSE_DEVICE SET LastSeen = NOW()
       WHERE LicenseID = ? AND DeviceFingerprint = ?`,
      [params.licenseId, params.deviceFingerprint],
      conn,
    );
  }

  /**
   * Đếm số thiết bị Active của một LicenseID.
   * @param {{ licenseId: string }} params
   */
  async demThietBiActive(params = {}, conn = null) {
    const row = await this.one(
      `SELECT COUNT(*) AS cnt FROM LICENSE_DEVICE WHERE LicenseID = ? AND Status = 'Active'`,
      [params.licenseId],
      conn,
    );
    return row ? Number(row.cnt) : 0;
  }

  /**
   * Thêm thiết bị mới vào LICENSE_DEVICE.
   * @param {{ licenseId: string, deviceFingerprint: string, deviceName: string }} params
   */
  async themThietBiMoi(params = {}, conn = null) {
    await this.query(
      `INSERT INTO LICENSE_DEVICE (LicenseID, DeviceFingerprint, DeviceName)
       VALUES (?, ?, ?)`,
      [params.licenseId, params.deviceFingerprint, params.deviceName || null],
      conn,
    );
  }

  /**
   * Lấy danh sách thiết bị của một bản quyền (để hiển thị trong UI).
   * @param {{ licenseId: string }} params
   */
  async layDanhSachThietBi(params = {}, conn = null) {
    return this.query(
      `SELECT DeviceID, DeviceFingerprint, DeviceName, FirstSeen, LastSeen, Status
       FROM LICENSE_DEVICE
       WHERE LicenseID = ?
       ORDER BY LastSeen DESC`,
      [params.licenseId],
      conn,
    );
  }

  /**
   * Thu hồi một thiết bị.
   * @param {{ deviceId: string, licenseId: string }} params
   */
  async thuHoiThietBi(params = {}, conn = null) {
    const result = await this.query(
      `UPDATE LICENSE_DEVICE SET Status = 'Revoked'
       WHERE DeviceID = ? AND LicenseID = ?`,
      [params.deviceId, params.licenseId],
      conn,
    );
    return result.affectedRows;
  }

  /**
   * verify-launch: Kiểm tra đồng thời LICENSE + ACCOUNT + LICENSE_DEVICE đều Active.
   * @param {{ licenseId: string, customerId: string, deviceFingerprint: string }} params
   */
  async kiemTraHopLeTheoThoiGianThuc(params = {}, conn = null) {
    return this.one(
      `SELECT l.LicenseID, l.Status AS LicenseStatus,
              a.Status AS AccountStatus,
              ld.Status AS DeviceStatus
       FROM LICENSE l
       INNER JOIN ACCOUNT a ON a.AccountID = l.CustomerID
       LEFT JOIN LICENSE_DEVICE ld
         ON ld.LicenseID = l.LicenseID AND ld.DeviceFingerprint = ?
       WHERE l.LicenseID = ? AND l.CustomerID = ?
       LIMIT 1`,
      [params.deviceFingerprint, params.licenseId, params.customerId],
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
