'use strict';
const BaseDAO = require('./BaseDAO');

class StaffDAO extends BaseDAO {
  /**
   * UC61. Tạo tài khoản nhân sự mới (#5)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async kiemTraTrungLapEmailVaUsername(params = {}, conn = null) {
    return this.one(
      `SELECT AccountID FROM ACCOUNT
       WHERE (Username = ? OR Email = ?) AND (? IS NULL OR AccountID <> ?)
       LIMIT 1`,
      [params.username, params.email, params.accountId || null, params.accountId || null],
      conn,
    );
  }

  /**
   * UC61. Tạo tài khoản nhân sự mới (#9)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async luuTaiKhoanNhanSuMoi(params = {}, conn = null) {
    await this.query(
      `INSERT INTO ACCOUNT (Username, PasswordHash, Email, DisplayName, Status, NotifyEnabled)
       VALUES (?, ?, ?, ?, 'Active', 1)`,
      [params.username, params.passwordHash, params.email, params.displayName],
      conn,
    );
    const account = await this.one(
      'SELECT AccountID FROM ACCOUNT WHERE Username = ? LIMIT 1',
      [params.username],
      conn,
    );
    if (!account) throw new Error('Could not load the newly created staff account');
    await this.query(
      'INSERT INTO MANAGER (AccountID, RoleID) VALUES (?, ?)',
      [account.AccountID, params.roleId],
      conn,
    );
    return account.AccountID;
  }

  /**
   * UC62. Cập nhật thông tin nhân sự (#3)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async truyVanChiTietNhanSu(params = {}, conn = null) {
    return this.one(
      `SELECT account.AccountID, account.Username, account.Email, account.DisplayName,
              account.Status, account.CreatedAt, manager.RoleID, staffRole.RoleName
       FROM MANAGER AS manager
       INNER JOIN ACCOUNT AS account ON account.AccountID = manager.AccountID
       INNER JOIN \`ROLE\` AS staffRole ON staffRole.RoleID = manager.RoleID
       WHERE manager.AccountID = ?
       LIMIT 1`,
      [params.accountId],
      conn,
    );
  }

  async truyVanDanhSachNhanSu(params = {}, conn = null) {
    return this.query(
      `SELECT account.AccountID, account.Username, account.Email, account.DisplayName,
              account.Status, account.CreatedAt, manager.RoleID, staffRole.RoleName
       FROM MANAGER AS manager
       INNER JOIN ACCOUNT AS account ON account.AccountID = manager.AccountID
       INNER JOIN \`ROLE\` AS staffRole ON staffRole.RoleID = manager.RoleID
       ORDER BY account.CreatedAt DESC`,
      [],
      conn,
    );
  }

  async kiemTraVaiTroTonTai(params = {}, conn = null) {
    return this.one('SELECT RoleID, RoleName FROM `ROLE` WHERE RoleID = ? LIMIT 1', [params.roleId], conn);
  }

  /**
   * UC62. Cập nhật thông tin nhân sự (#11)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async capNhatThongTinNhanSu(params = {}, conn = null) {
    await this.query(
      'UPDATE ACCOUNT SET Email = ?, DisplayName = ? WHERE AccountID = ?',
      [params.email, params.displayName, params.accountId],
      conn,
    );
    await this.query(
      'UPDATE MANAGER SET RoleID = ? WHERE AccountID = ?',
      [params.roleId, params.accountId],
      conn,
    );
    return this.truyVanChiTietNhanSu({ accountId: params.accountId }, conn);
  }

  async capNhatTrangThai(params = {}, conn = null) {
    const result = await this.query(
      `UPDATE ACCOUNT
       SET Status = ?
       WHERE AccountID = ? AND EXISTS (
         SELECT 1 FROM MANAGER WHERE AccountID = ?
       )`,
      [params.status, params.accountId, params.accountId],
      conn,
    );
    return result.affectedRows;
  }
}

module.exports = StaffDAO;
