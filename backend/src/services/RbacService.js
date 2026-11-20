'use strict';
const BaseService = require('./BaseService');
const RoleDAO = require('../dao/RoleDAO');
const AuditLogService = require('./AuditLogService');
const { PERMISSIONS, permissionCodes } = require('./permissions');
const {
  ConflictException,
  NotFoundException,
  ValidationException,
} = require('../exceptions');

/**
 * RbacService - tầng Business Logic.
 * Tên phương thức lấy đúng từ sơ đồ sequence; nội dung bên dưới chỉ là khung cần cài đặt.
 */
class RbacService extends BaseService {
  constructor() {
    super();
    this.roleDAO = new RoleDAO();
    this.auditLogService = new AuditLogService();
  }

  // ---------------------------------------------------------------- Phương thức công khai (Route / Service khác gọi)

  /**
   * UC59. Phân quyền truy cập (RBAC) - sequence #2: UI → RbacService
   * Vai trò gọi: Admin
   * Luồng theo sơ đồ:
   *   #3 → RoleDAO.truyVanDanhSachVaiTroVaQuyen()
   *   #4 ← traVeDanhSachVaiTroVaQuyen()
   *   #5 ← traVeMaTranPhanQuyen()
   * @param {object} params
   */
  async yeuCauLayMaTranPhanQuyen(params = {}) {
    return this.listRoles(params);
  }

  /**
   * UC59. Phân quyền truy cập (RBAC) - sequence #8: UI → RbacService
   * Vai trò gọi: Admin
   * Luồng theo sơ đồ:
   *   #9 ↻ this.kiemTraXungDotQuyenHan()
   *   #10 ← thongBaoXungDotQuyenHan()
   *   #12 → RoleDAO.capNhatChinhSachQuyenMoi()
   *   #13 ← xacNhanCapNhatThanhCong()
   *   #14 ↻ this.lamMoiTokenQuyenCacTaiKhoan()
   *   #15 → AuditLogService.ghiNhanNhatKyQuanTri
   *   #16 → AuditLogDAO.luuNhatKyPhanQuyen()
   *   #17 ← xacNhanLuuNhatKyThanhCong()
   *   #18 ← hoanTatGhiNhatKy()
   *   #19 ← thongBaoCapNhatQuyenThanhCong()
   * @param {object} params
   */
  async guiYeuCauCapNhatPhanQuyen(params = {}) {
    return this.updatePermissions(params);
  }

  async listRoles() {
    const rows = await this.roleDAO.truyVanDanhSachVaiTroVaQuyen();
    return rows.map((row) => ({
      roleId: row.RoleID,
      roleName: row.RoleName,
      managedBy: row.ManagedBy,
      memberCount: Number(row.MemberCount),
      permissions: row.PermissionCodes ? row.PermissionCodes.split(',') : [],
    }));
  }

  async listPermissions() {
    return PERMISSIONS;
  }

  async createRole(params = {}) {
    const roleName = String(params.roleName || '').trim();
    if (!roleName || roleName.length > 50) {
      throw new ValidationException('Tên vai trò là bắt buộc và không được vượt quá 50 ký tự');
    }
    if (!params.user || !params.user.accountId) throw new ValidationException('Thiếu tài khoản quản trị');

    return this.transaction(async (conn) => {
      if (await this.roleDAO.kiemTraTrungTenVaiTro({ roleName }, conn)) {
        throw new ConflictException('Tên vai trò đã tồn tại');
      }
      const role = await this.roleDAO.taoVaiTro({
        roleName,
        managedBy: params.user.accountId,
      }, conn);
      await this.auditLogService.recordLog({
        accountId: params.user.accountId,
        action: 'ROLE_CREATE',
        target: `ROLE:${role.RoleID}`,
        detail: JSON.stringify({ roleName }),
      }, conn);
      return { roleId: role.RoleID, roleName: role.RoleName, managedBy: role.ManagedBy, permissions: [] };
    });
  }

  async updateRole(params = {}) {
    const roleId = params.roleId;
    const roleName = String(params.roleName || '').trim();
    if (!roleName || roleName.length > 50) {
      throw new ValidationException('Tên vai trò là bắt buộc và không được vượt quá 50 ký tự');
    }

    return this.transaction(async (conn) => {
      const role = await this.roleDAO.layVaiTroTheoId({ roleId }, conn);
      if (!role) throw new NotFoundException('Không tìm thấy vai trò');
      if (await this.roleDAO.kiemTraTrungTenVaiTro({ roleName, roleId }, conn)) {
        throw new ConflictException('Tên vai trò đã tồn tại');
      }
      await this.roleDAO.capNhatTenVaiTro({ roleName, roleId }, conn);
      await this.auditLogService.recordLog({
        accountId: params.user.accountId,
        action: 'ROLE_UPDATE',
        target: `ROLE:${roleId}`,
        detail: JSON.stringify({ previousName: role.RoleName, roleName }),
      }, conn);
      return { roleId, roleName, managedBy: role.ManagedBy };
    });
  }

  async deleteRole(params = {}) {
    return this.transaction(async (conn) => {
      const role = await this.roleDAO.layVaiTroTheoId({ roleId: params.roleId }, conn);
      if (!role) throw new NotFoundException('Không tìm thấy vai trò');
      if (await this.roleDAO.demNhanSuTheoVaiTro({ roleId: params.roleId }, conn)) {
        throw new ConflictException('Không thể xóa vai trò đang được gán cho nhân sự');
      }
      await this.roleDAO.xoaVaiTro({ roleId: params.roleId }, conn);
      await this.auditLogService.recordLog({
        accountId: params.user.accountId,
        action: 'ROLE_DELETE',
        target: `ROLE:${params.roleId}`,
        detail: JSON.stringify({ roleName: role.RoleName }),
      }, conn);
      return { roleId: params.roleId, deleted: true };
    });
  }

  async updatePermissions(params = {}) {
    const permissions = params.permissions;
    if (!Array.isArray(permissions) || permissions.some((code) => !permissionCodes.has(code))) {
      throw new ValidationException('Danh sách quyền chứa mã không hợp lệ');
    }

    return this.transaction(async (conn) => {
      const role = await this.roleDAO.layVaiTroTheoId({ roleId: params.roleId }, conn);
      if (!role) throw new NotFoundException('Không tìm thấy vai trò');
      await this.kiemTraXungDotQuyenHan({ roleId: params.roleId, permissions }, conn);
      await this.roleDAO.capNhatChinhSachQuyenMoi({
        roleId: params.roleId,
        permissions: [...new Set(permissions)],
      }, conn);
      await this.auditLogService.recordLog({
        accountId: params.user.accountId,
        action: 'ROLE_PERMISSIONS_UPDATE',
        target: `ROLE:${params.roleId}`,
        detail: JSON.stringify({ permissions: [...new Set(permissions)] }),
      }, conn);
      return {
        roleId: params.roleId,
        roleName: role.RoleName,
        permissions: [...new Set(permissions)],
      };
    });
  }

  // ---------------------------------------------------------------- Phương thức nội bộ (self-call trong sơ đồ)

  /**
   * UC59. Phân quyền truy cập (RBAC) - sequence #9: nội bộ
   * @param {object} params
   */
  async kiemTraXungDotQuyenHan(params = {}) {
    const unknownPermissions = (params.permissions || []).filter((code) => !permissionCodes.has(code));
    if (unknownPermissions.length) {
      throw new ValidationException('Danh sách quyền chứa mã không hợp lệ', { unknownPermissions });
    }
    return true;
  }

  /**
   * UC59. Phân quyền truy cập (RBAC) - sequence #14: nội bộ
   * @param {object} params
   */
  async lamMoiTokenQuyenCacTaiKhoan(params = {}) {
    return { refreshed: false, strategy: 'Quyền được nạp lại từ cơ sở dữ liệu ở mỗi request' };
  }
}

module.exports = RbacService;
