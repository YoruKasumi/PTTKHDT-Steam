'use strict';
const BaseService = require('./BaseService');
const AccountDAO = require('../dao/AccountDAO');
const AuditLogService = require('./AuditLogService');
const {
  ConflictException,
  NotFoundException,
  ValidationException,
} = require('../exceptions');

/**
 * AccountService - tầng Business Logic.
 * Tên phương thức lấy đúng từ sơ đồ sequence; nội dung bên dưới chỉ là khung cần cài đặt.
 */
class AccountService extends BaseService {
  constructor() {
    super();
    this.accountDAO = new AccountDAO();
    this.auditLogService = new AuditLogService();
  }

  // ---------------------------------------------------------------- Phương thức công khai (Route / Service khác gọi)

  /**
   * UC42. Tra cứu lịch sử tài khoản - sequence #2: UI → AccountService
   * Vai trò gọi: Admin, Manager
   * Luồng theo sơ đồ:
   *   #3 → AccountDAO.truyVanThongTinVaLichSuTaiKhoan()
   *   #4 ← traVeThongTinVaLichSu()
   *   #5 ← thongBaoKhongTimThayTaiKhoan()
   *   #7 ← traVeDuLieuLichSuTaiKhoan()
   * @param {object} params
   */
  async guiYeuCauTraCuu(params = {}) {
    if (params.accountId) return this.layLichSuTaiKhoan(params);
    return this.layDanhSachTaiKhoan(params);
  }

  async layDanhSachTaiKhoan(params = {}) {
    const role = params.role || undefined;
    const status = params.status || undefined;
    if (role && !['Customer', 'Developer', 'Manager', 'Admin'].includes(role)) {
      throw new ValidationException('Vai trò lọc không hợp lệ');
    }
    if (status && !['Active', 'Suspended', 'Banned'].includes(status)) {
      throw new ValidationException('Trạng thái lọc không hợp lệ');
    }
    return this.accountDAO.truyVanDanhSachTaiKhoan({
      keyword: typeof params.keyword === 'string' ? params.keyword.trim() : '',
      role,
      status,
    });
  }

  async layLichSuTaiKhoan(params = {}) {
    const result = await this.accountDAO.truyVanThongTinVaLichSuTaiKhoan({
      accountId: params.accountId,
    });
    if (!result) throw new NotFoundException('Không tìm thấy tài khoản');
    return {
      account: {
        accountId: result.account.AccountID,
        username: result.account.Username,
        email: result.account.Email,
        displayName: result.account.DisplayName,
        status: result.account.Status,
        createdAt: result.account.CreatedAt,
      },
      roles: result.roles,
      wallet: result.wallet,
      orders: result.orders.map((order) => ({
        orderId: order.OrderID,
        orderDate: order.OrderDate,
        totalAmount: Number(order.TotalAmount),
        status: order.Status,
      })),
      licenses: result.licenses.map((license) => ({
        licenseId: license.LicenseID,
        gameId: license.GameID,
        gameTitle: license.Title,
        source: license.Source,
        purchaseDate: license.PurchaseDate,
        status: license.Status,
        revokedAt: license.RevokedAt,
      })),
      violations: result.violations.map((log) => ({
        logId: log.LogID,
        action: log.Action,
        target: log.Target,
        logAt: log.LogAt,
        detail: log.Detail,
      })),
    };
  }

  /**
   * UC44. Tạm khóa tài khoản vi phạm - sequence #4: UI → AccountService
   * Vai trò gọi: Admin, Manager
   * Luồng theo sơ đồ:
   *   #5 → AccountDAO.capNhatTrangThaiTamKhoaTaiKhoan()
   *   #6 ← xacNhanCapNhatThanhCong()
   *   #7 → AuditLogService.ghiNhanNhatKyQuanTri
   *   #8 → AuditLogDAO.luuNhatKyTamKhoa()
   *   #9 ← xacNhanLuuNhatKyThanhCong()
   *   #10 ← hoanTatGhiNhatKy()
   *   #11 ← thongBaoTamKhoaThanhCong()
   * @param {object} params
   */
  async yeuCauTamKhoaTaiKhoan(params = {}) {
    return this.capNhatTrangThai(params, 'Suspended', 'ACCOUNT_SUSPEND', 'Tạm khóa');
  }

  /**
   * UC45. Khóa vĩnh viễn tài khoản - sequence #4: UI → AccountService
   * Vai trò gọi: Admin, Manager
   * Luồng theo sơ đồ:
   *   #5 → AccountDAO.capNhatTrangThaiBanned()
   *   #6 ← xacNhanCapNhatThanhCong()
   *   #7 → AuditLogService.ghiNhanNhatKyQuanTri
   *   #8 → AuditLogDAO.luuNhatKyKhoaVinhVien()
   *   #9 ← xacNhanLuuNhatKyThanhCong()
   *   #10 ← hoanTatGhiNhatKy()
   *   #11 ← thongBaoKhoaVinhVienThanhCong()
   * @param {object} params
   */
  async yeuCauKhoaVinhVien(params = {}) {
    return this.capNhatTrangThai(params, 'Banned', 'ACCOUNT_BAN', 'Khóa vĩnh viễn');
  }

  async yeuCauMoKhoaTaiKhoan(params = {}) {
    return this.capNhatTrangThai(params, 'Active', 'ACCOUNT_UNBAN', 'Mở khóa');
  }

  async capNhatTrangThai(params, status, action, label) {
    const reason = typeof params.reason === 'string' ? params.reason.trim() : '';
    if (!reason || reason.length > 500) {
      throw new ValidationException('Lý do là bắt buộc và tối đa 500 ký tự');
    }
    return this.transaction(async (conn) => {
      const account = await this.accountDAO.layTaiKhoanTheoId({ accountId: params.accountId }, conn);
      if (!account) throw new NotFoundException('Không tìm thấy tài khoản');
      if (await this.accountDAO.kiemTraLaQuanTri({ accountId: params.accountId }, conn)) {
        throw new ConflictException('Không thể thay đổi trạng thái tài khoản thuộc ADMIN');
      }

      await this.accountDAO.capNhatTrangThaiTaiKhoan({
        accountId: params.accountId,
        status,
      }, conn);
      await this.auditLogService.recordLog({
        accountId: params.user.accountId,
        action,
        target: `ACCOUNT:${params.accountId}`,
        detail: JSON.stringify({ previousStatus: account.Status, status, reason }),
      }, conn);
      await this.accountDAO.taoThongBaoTaiKhoan({
        accountId: params.accountId,
        type: 'AccountStatus',
        content: `Tài khoản của bạn đã được ${label}. Lý do: ${reason}`,
      }, conn);
      return { accountId: params.accountId, status, reason };
    });
  }
}

module.exports = AccountService;
