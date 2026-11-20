'use strict';
const BaseDAO = require('./BaseDAO');

class RoleDAO extends BaseDAO {
  /**
   * UC59. Phân quyền truy cập (RBAC) (#3)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async truyVanDanhSachVaiTroVaQuyen(params = {}, conn = null) {
    return this.query(
      `SELECT r.RoleID, r.RoleName, r.ManagedBy,
              COUNT(DISTINCT manager.AccountID) AS MemberCount,
              GROUP_CONCAT(DISTINCT rp.PermissionCode ORDER BY rp.PermissionCode) AS PermissionCodes
       FROM \`ROLE\` AS r
       LEFT JOIN MANAGER AS manager ON manager.RoleID = r.RoleID
       LEFT JOIN ROLE_PERMISSION AS rp ON rp.RoleID = r.RoleID
       GROUP BY r.RoleID, r.RoleName, r.ManagedBy
       ORDER BY r.RoleName`,
      [],
      conn,
    );
  }

  /**
   * UC59. Phân quyền truy cập (RBAC) (#12)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async capNhatChinhSachQuyenMoi(params = {}, conn = null) {
    await this.query('DELETE FROM ROLE_PERMISSION WHERE RoleID = ?', [params.roleId], conn);
    for (const permissionCode of params.permissions) {
      await this.query(
        'INSERT INTO ROLE_PERMISSION (RoleID, PermissionCode) VALUES (?, ?)',
        [params.roleId, permissionCode],
        conn,
      );
    }
    return this.one(
      'SELECT RoleID, RoleName, ManagedBy FROM `ROLE` WHERE RoleID = ?',
      [params.roleId],
      conn,
    );
  }

  async layVaiTroTheoId(params = {}, conn = null) {
    return this.one(
      'SELECT RoleID, RoleName, ManagedBy FROM `ROLE` WHERE RoleID = ?',
      [params.roleId],
      conn,
    );
  }

  async kiemTraTrungTenVaiTro(params = {}, conn = null) {
    return this.one(
      'SELECT RoleID FROM `ROLE` WHERE RoleName = ? AND (? IS NULL OR RoleID <> ?) LIMIT 1',
      [params.roleName, params.roleId || null, params.roleId || null],
      conn,
    );
  }

  async taoVaiTro(params = {}, conn = null) {
    await this.query(
      'INSERT INTO `ROLE` (RoleName, ManagedBy) VALUES (?, ?)',
      [params.roleName, params.managedBy],
      conn,
    );
    return this.one(
      'SELECT RoleID, RoleName, ManagedBy FROM `ROLE` WHERE RoleName = ?',
      [params.roleName],
      conn,
    );
  }

  async capNhatTenVaiTro(params = {}, conn = null) {
    const result = await this.query(
      'UPDATE `ROLE` SET RoleName = ? WHERE RoleID = ?',
      [params.roleName, params.roleId],
      conn,
    );
    return result.affectedRows;
  }

  async demNhanSuTheoVaiTro(params = {}, conn = null) {
    const row = await this.one(
      'SELECT COUNT(*) AS Count FROM MANAGER WHERE RoleID = ?',
      [params.roleId],
      conn,
    );
    return Number(row.Count);
  }

  async xoaVaiTro(params = {}, conn = null) {
    const result = await this.query('DELETE FROM `ROLE` WHERE RoleID = ?', [params.roleId], conn);
    return result.affectedRows;
  }

  async truyVanDanhSachQuyen(params = {}, conn = null) {
    return this.query(
      'SELECT DISTINCT PermissionCode FROM ROLE_PERMISSION ORDER BY PermissionCode',
      [],
      conn,
    );
  }
}

module.exports = RoleDAO;
