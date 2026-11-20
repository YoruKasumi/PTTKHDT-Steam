'use strict';
const BaseDAO = require('./BaseDAO');

class AccountDAO extends BaseDAO {
  /**
   * UC1. Đăng ký tài khoản (#5)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async kiemTraTenTaiKhoan(params = {}, conn = null) {
    return this.one(
      `SELECT AccountID
       FROM ACCOUNT
       WHERE Username = ? OR Email = ?
       LIMIT 1`,
      [params.username, params.email],
      conn,
    );
  }

  /**
   * UC1. Đăng ký tài khoản (#12)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async taoTaiKhoanMoi(params = {}, conn = null) {
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
    if (!account) throw new Error('Could not load the newly created account');
    await this.query(
      'INSERT INTO CUSTOMER (AccountID) VALUES (?)',
      [account.AccountID],
      conn,
    );
    return account.AccountID;
  }

  /**
   * UC2. Đăng nhập hệ thống (#3)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async kiemTraTaiKhoan(params = {}, conn = null) {
    return this.one(
      `SELECT
         account.AccountID,
         account.Username,
         account.PasswordHash,
         account.Email,
         account.DisplayName,
         account.Status,
         (customer.AccountID IS NOT NULL) AS IsCustomer,
         (developer.AccountID IS NOT NULL) AS IsDeveloper,
         (manager.AccountID IS NOT NULL) AS IsManager,
         (admin.AccountID IS NOT NULL) AS IsAdmin,
         role.RoleName AS StaffRole
       FROM ACCOUNT AS account
       LEFT JOIN CUSTOMER AS customer ON customer.AccountID = account.AccountID
       LEFT JOIN DEVELOPER AS developer ON developer.AccountID = account.AccountID
       LEFT JOIN MANAGER AS manager ON manager.AccountID = account.AccountID
       LEFT JOIN \`ROLE\` AS role ON role.RoleID = manager.RoleID
       LEFT JOIN ADMIN AS admin ON admin.AccountID = account.AccountID
       WHERE account.Username = ? OR account.Email = ?
       LIMIT 1`,
      [params.account, params.account],
      conn,
    );
  }

  /**
   * UC4. Cập nhật hồ sơ cá nhân (#4)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async capNhatTenHienThi(params = {}, conn = null) {
    throw new NotImplementedException('AccountDAO.capNhatTenHienThi');
  }

  /**
   * UC4. Cập nhật hồ sơ cá nhân (#12)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async capNhatDuongDanAnh(params = {}, conn = null) {
    throw new NotImplementedException('AccountDAO.capNhatDuongDanAnh');
  }

  /**
   * UC5. Thay đổi mật khẩu tài khoản (#3)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async layMatKhauHienTai(params = {}, conn = null) {
    throw new NotImplementedException('AccountDAO.layMatKhauHienTai');
  }

  /**
   * UC5. Thay đổi mật khẩu tài khoản (#10)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async capNhatMatKhauMoi(params = {}, conn = null) {
    throw new NotImplementedException('AccountDAO.capNhatMatKhauMoi');
  }

  /**
   * UC42. Tra cứu lịch sử tài khoản (#3)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async truyVanThongTinVaLichSuTaiKhoan(params = {}, conn = null) {
    throw new NotImplementedException('AccountDAO.truyVanThongTinVaLichSuTaiKhoan');
  }

  /**
   * UC44. Tạm khóa tài khoản vi phạm (#5)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async capNhatTrangThaiTamKhoaTaiKhoan(params = {}, conn = null) {
    throw new NotImplementedException('AccountDAO.capNhatTrangThaiTamKhoaTaiKhoan');
  }

  /**
   * UC45. Khóa vĩnh viễn tài khoản (#5)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async capNhatTrangThaiBanned(params = {}, conn = null) {
    throw new NotImplementedException('AccountDAO.capNhatTrangThaiBanned');
  }
}

module.exports = AccountDAO;
