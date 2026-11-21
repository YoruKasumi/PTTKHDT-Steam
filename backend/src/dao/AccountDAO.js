'use strict';
const BaseDAO = require('./BaseDAO');
const { NotImplementedException } = require('../exceptions');

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
    await this.query(
      'INSERT INTO WALLET (CustomerID, Balance, Currency) VALUES (?, 0, \'VND\')',
      [account.AccountID],
      conn,
    );
    await this.query(
      'INSERT INTO CART (CustomerID) VALUES (?)',
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
         account.AvatarUrl,
         account.NotifyEnabled,
         account.Status,
         (customer.AccountID IS NOT NULL) AS IsCustomer,
         (developer.AccountID IS NOT NULL) AS IsDeveloper,
         (manager.AccountID IS NOT NULL) AS IsManager,
         (admin.AccountID IS NOT NULL) AS IsAdmin,
         staffRole.RoleName AS StaffRole,
         rolePermissions.PermissionCodes
       FROM ACCOUNT AS account
       LEFT JOIN CUSTOMER AS customer ON customer.AccountID = account.AccountID
       LEFT JOIN DEVELOPER AS developer ON developer.AccountID = account.AccountID
       LEFT JOIN MANAGER AS manager ON manager.AccountID = account.AccountID
       LEFT JOIN \`ROLE\` AS staffRole ON staffRole.RoleID = manager.RoleID
       LEFT JOIN (
         SELECT RoleID, GROUP_CONCAT(DISTINCT PermissionCode) AS PermissionCodes
         FROM ROLE_PERMISSION
         GROUP BY RoleID
       ) AS rolePermissions ON rolePermissions.RoleID = manager.RoleID
       LEFT JOIN ADMIN AS admin ON admin.AccountID = account.AccountID
       WHERE account.Username = ? OR account.Email = ?
       LIMIT 1`,
      [params.account, params.account],
      conn,
    );
  }

  async layDanhTinhVaQuyen(params = {}, conn = null) {
    return this.one(
      `SELECT
         account.AccountID,
         account.Username,
         account.Status,
         (customer.AccountID IS NOT NULL) AS IsCustomer,
         (developer.AccountID IS NOT NULL) AS IsDeveloper,
         (manager.AccountID IS NOT NULL) AS IsManager,
         (admin.AccountID IS NOT NULL) AS IsAdmin,
         GROUP_CONCAT(DISTINCT rolePermission.PermissionCode) AS PermissionCodes
       FROM ACCOUNT AS account
       LEFT JOIN CUSTOMER AS customer ON customer.AccountID = account.AccountID
       LEFT JOIN DEVELOPER AS developer ON developer.AccountID = account.AccountID
       LEFT JOIN MANAGER AS manager ON manager.AccountID = account.AccountID
       LEFT JOIN ROLE_PERMISSION AS rolePermission ON rolePermission.RoleID = manager.RoleID
       LEFT JOIN ADMIN AS admin ON admin.AccountID = account.AccountID
       WHERE account.AccountID = ?
       GROUP BY account.AccountID, account.Username, account.Status,
         customer.AccountID, developer.AccountID, manager.AccountID, admin.AccountID
       LIMIT 1`,
      [params.accountId],
      conn,
    );
  }

  /**
   * UC4. Cập nhật hồ sơ cá nhân (#4)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async capNhatTenHienThi(params = {}, conn = null) {
    const result = await this.query(
      'UPDATE ACCOUNT SET DisplayName = ? WHERE AccountID = ?',
      [params.displayName, params.accountId],
      conn,
    );
    return result.affectedRows > 0;
  }

  /**
   * UC4. Cập nhật hồ sơ cá nhân (#12)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async capNhatDuongDanAnh(params = {}, conn = null) {
    const result = await this.query(
      'UPDATE ACCOUNT SET AvatarUrl = ? WHERE AccountID = ?',
      [params.avatarUrl, params.accountId],
      conn,
    );
    return result.affectedRows > 0;
  }

  /**
   * UC5. Thay đổi mật khẩu tài khoản (#3)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async layMatKhauHienTai(params = {}, conn = null) {
    const row = await this.one(
      'SELECT PasswordHash FROM ACCOUNT WHERE AccountID = ? LIMIT 1',
      [params.accountId],
      conn,
    );
    return row ? row.PasswordHash : null;
  }

  /**
   * UC5. Thay đổi mật khẩu tài khoản (#10)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async capNhatMatKhauMoi(params = {}, conn = null) {
    const result = await this.query(
      'UPDATE ACCOUNT SET PasswordHash = ? WHERE AccountID = ?',
      [params.passwordHash, params.accountId],
      conn,
    );
    return result.affectedRows > 0;
  }

  async layHoSoCaNhan(params = {}, conn = null) {
    return this.one(
      `SELECT AccountID, Username, Email, DisplayName, AvatarUrl, NotifyEnabled
       FROM ACCOUNT WHERE AccountID = ? LIMIT 1`,
      [params.accountId],
      conn,
    );
  }

  async capNhatHoSoCaNhan(params = {}, conn = null) {
    const result = await this.query(
      'UPDATE ACCOUNT SET DisplayName = ?, AvatarUrl = ? WHERE AccountID = ?',
      [params.displayName, params.avatarUrl, params.accountId],
      conn,
    );
    return result.affectedRows > 0;
  }

  async capNhatTrangThaiThongBao(params = {}, conn = null) {
    const result = await this.query(
      'UPDATE ACCOUNT SET NotifyEnabled = ? WHERE AccountID = ?',
      [params.enabled, params.accountId],
      conn,
    );
    return result.affectedRows > 0;
  }

  /**
   * UC42. Tra cứu lịch sử tài khoản (#3)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async truyVanThongTinVaLichSuTaiKhoan(params = {}, conn = null) {
    const accountId = params.accountId;
    const account = await this.one(
      `SELECT AccountID, Username, Email, DisplayName, Status, CreatedAt
       FROM ACCOUNT WHERE AccountID = ? LIMIT 1`,
      [accountId],
      conn,
    );
    if (!account) return null;

    const [roles, wallet, orders, licenses, auditLogs] = await Promise.all([
      this.query(
        `SELECT 'Customer' AS RoleName FROM CUSTOMER WHERE AccountID = ?
         UNION ALL SELECT 'Developer' FROM DEVELOPER WHERE AccountID = ?
         UNION ALL SELECT staffRole.RoleName FROM MANAGER AS manager
           INNER JOIN \`ROLE\` AS staffRole ON staffRole.RoleID = manager.RoleID
           WHERE manager.AccountID = ?
         UNION ALL SELECT 'Admin' FROM ADMIN WHERE AccountID = ?`,
        [accountId, accountId, accountId, accountId],
        conn,
      ),
      this.one('SELECT Balance, Currency FROM WALLET WHERE CustomerID = ? LIMIT 1', [accountId], conn),
      this.query(
        `SELECT OrderID, OrderDate, TotalAmount, Status
         FROM ORDERS WHERE CustomerID = ? ORDER BY OrderDate DESC LIMIT 100`,
        [accountId],
        conn,
      ),
      this.query(
        `SELECT license.LicenseID, license.GameID, game.Title, license.Source,
                license.PurchaseDate, license.Status, license.RevokedAt
         FROM LICENSE AS license
         INNER JOIN GAME AS game ON game.GameID = license.GameID
         WHERE license.CustomerID = ?
         ORDER BY license.PurchaseDate DESC LIMIT 100`,
        [accountId],
        conn,
      ),
      this.query(
        `SELECT LogID, Action, Target, LogAt, Detail
         FROM AUDITLOG
         WHERE Target = CONCAT('ACCOUNT:', ?)
         ORDER BY LogAt DESC LIMIT 100`,
        [accountId],
        conn,
      ),
    ]);

    return {
      account,
      roles: roles.map((row) => row.RoleName),
      wallet: wallet ? { balance: Number(wallet.Balance), currency: wallet.Currency } : null,
      orders,
      licenses,
      violations: auditLogs,
    };
  }

  async truyVanDanhSachTaiKhoan(params = {}, conn = null) {
    const conditions = [];
    const values = [];
    if (params.keyword) {
      const keyword = `%${params.keyword}%`;
      conditions.push('(account.AccountID LIKE ? OR account.Username LIKE ? OR account.Email LIKE ?)');
      values.push(keyword, keyword, keyword);
    }
    if (params.status) {
      conditions.push('account.Status = ?');
      values.push(params.status);
    }
    if (params.role === 'Customer') conditions.push('customer.AccountID IS NOT NULL');
    if (params.role === 'Developer') conditions.push('developer.AccountID IS NOT NULL');
    if (params.role === 'Manager') conditions.push('manager.AccountID IS NOT NULL');
    if (params.role === 'Admin') conditions.push('admin.AccountID IS NOT NULL');
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const rows = await this.query(
      `SELECT account.AccountID, account.Username, account.Email, account.DisplayName,
              account.Status, account.CreatedAt,
              GROUP_CONCAT(DISTINCT roleName.RoleName ORDER BY roleName.RoleName) AS RoleNames,
              wallet.Balance AS WalletBalance
       FROM ACCOUNT AS account
       LEFT JOIN CUSTOMER AS customer ON customer.AccountID = account.AccountID
       LEFT JOIN DEVELOPER AS developer ON developer.AccountID = account.AccountID
       LEFT JOIN MANAGER AS manager ON manager.AccountID = account.AccountID
       LEFT JOIN ADMIN AS admin ON admin.AccountID = account.AccountID
       LEFT JOIN WALLET AS wallet ON wallet.CustomerID = account.AccountID
       LEFT JOIN (
         SELECT accountId, roleName FROM (
           SELECT AccountID AS accountId, 'Customer' AS roleName FROM CUSTOMER
           UNION ALL SELECT AccountID, 'Developer' FROM DEVELOPER
           UNION ALL SELECT manager.AccountID, staffRole.RoleName FROM MANAGER AS manager
             INNER JOIN \`ROLE\` AS staffRole ON staffRole.RoleID = manager.RoleID
           UNION ALL SELECT AccountID, 'Admin' FROM ADMIN
         ) AS roleRows
       ) AS roleName ON roleName.accountId = account.AccountID
       ${where}
       GROUP BY account.AccountID, account.Username, account.Email, account.DisplayName,
                account.Status, account.CreatedAt, wallet.Balance
       ORDER BY account.CreatedAt DESC
       LIMIT 500`,
      values,
      conn,
    );
    return rows.map((row) => ({
      accountId: row.AccountID,
      username: row.Username,
      email: row.Email,
      displayName: row.DisplayName,
      status: row.Status,
      createdAt: row.CreatedAt,
      roles: row.RoleNames ? row.RoleNames.split(',') : [],
      walletBalance: row.WalletBalance === null ? null : Number(row.WalletBalance),
    }));
  }

  async kiemTraLaQuanTri(params = {}, conn = null) {
    return this.one('SELECT AccountID FROM ADMIN WHERE AccountID = ? LIMIT 1', [params.accountId], conn);
  }

  async layTaiKhoanTheoId(params = {}, conn = null) {
    return this.one(
      'SELECT AccountID, Status FROM ACCOUNT WHERE AccountID = ? LIMIT 1',
      [params.accountId],
      conn,
    );
  }

  async capNhatTrangThaiTaiKhoan(params = {}, conn = null) {
    const result = await this.query(
      'UPDATE ACCOUNT SET Status = ? WHERE AccountID = ?',
      [params.status, params.accountId],
      conn,
    );
    return result.affectedRows;
  }

  async taoThongBaoTaiKhoan(params = {}, conn = null) {
    await this.query(
      'INSERT INTO NOTIFICATION (AccountID, Type, Content) VALUES (?, ?, ?)',
      [params.accountId, params.type, params.content],
      conn,
    );
  }

  /**
   * UC44. Tạm khóa tài khoản vi phạm (#5)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async capNhatTrangThaiTamKhoaTaiKhoan(params = {}, conn = null) {
    return this.capNhatTrangThaiTaiKhoan({ ...params, status: 'Suspended' }, conn);
  }

  /**
   * UC45. Khóa vĩnh viễn tài khoản (#5)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async capNhatTrangThaiBanned(params = {}, conn = null) {
    return this.capNhatTrangThaiTaiKhoan({ ...params, status: 'Banned' }, conn);
  }

  async capNhatTrangThaiMoKhoa(params = {}, conn = null) {
    return this.capNhatTrangThaiTaiKhoan({ ...params, status: 'Active' }, conn);
  }
}

module.exports = AccountDAO;
