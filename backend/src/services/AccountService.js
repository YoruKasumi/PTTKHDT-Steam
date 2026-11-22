'use strict';
const BaseService = require('./BaseService');
const AccountDAO = require('../dao/AccountDAO');
const LicenseDAO = require('../dao/LicenseDAO');
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
    this.licenseDAO = new LicenseDAO();
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
        suspendUntil: result.account.SuspendUntil,
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
        revokedReason: license.RevokedReason,
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
    const suspensionHours = Number(params.suspensionHours);
    if (status === 'Suspended' && (!Number.isSafeInteger(suspensionHours) || suspensionHours < 1 || suspensionHours > 87600)) {
      throw new ValidationException('Thời hạn tạm khóa phải là số giờ nguyên từ 1 đến 87600');
    }
    return this.transaction(async (conn) => {
      const account = await this.accountDAO.layTaiKhoanTheoId({ accountId: params.accountId }, conn);
      if (!account) throw new NotFoundException('Không tìm thấy tài khoản');
      if (await this.accountDAO.kiemTraLaQuanTri({ accountId: params.accountId }, conn)) {
        throw new ConflictException('Không thể thay đổi trạng thái tài khoản thuộc ADMIN');
      }

      let revokedLicenses = 0;
      let restoredLicenses = 0;
      let accountWasEverBanned = account.Status === 'Banned';
      if (status === 'Active' && account.Status === 'Suspended') {
        accountWasEverBanned = Boolean(await this.accountDAO.kiemTraTaiKhoanTungBiKhoaVinhVien({
          accountId: params.accountId,
        }, conn));
      }

      await this.accountDAO.capNhatTrangThaiTaiKhoan({
        accountId: params.accountId,
        status,
        suspensionHours: status === 'Suspended' ? suspensionHours : null,
      }, conn);

      if (status === 'Suspended' || status === 'Banned') {
        revokedLicenses = await this.licenseDAO.thuHoiBanQuyenTaiKhoan({
          customerId: params.accountId,
        }, conn);
      } else if (status === 'Active' && account.Status === 'Suspended' && !accountWasEverBanned) {
        restoredLicenses = await this.licenseDAO.khoiPhucBanQuyenTaiKhoan({
          customerId: params.accountId,
        }, conn);
      }

      const updatedAccount = status === 'Suspended'
        ? await this.accountDAO.layTaiKhoanTheoId({ accountId: params.accountId }, conn)
        : null;
      const detail = {
        previousStatus: account.Status,
        status,
        reason,
        suspensionHours: status === 'Suspended' ? suspensionHours : undefined,
        suspendUntil: updatedAccount?.SuspendUntil,
        revokedLicenses,
        restoredLicenses,
        restorationSkippedBecausePreviouslyBanned: status === 'Active' && accountWasEverBanned,
      };
      await this.auditLogService.recordLog({
        accountId: params.user.accountId,
        action,
        target: `ACCOUNT:${params.accountId}`,
        detail: JSON.stringify(detail),
      }, conn);

      let notification = `Tài khoản của bạn đã được ${label}. Lý do: ${reason}`;
      if (status === 'Active') {
        notification = accountWasEverBanned
          ? `Tài khoản của bạn đã được mở khóa. Bản quyền game không được tự động khôi phục đối với tài khoản từng bị khóa vĩnh viễn. Vui lòng liên hệ hỗ trợ để được xem xét. Lý do: ${reason}`
          : `Tài khoản của bạn đã được mở khóa. Hệ thống đã khôi phục ${restoredLicenses} bản quyền bị thu hồi do tạm khóa; bản quyền đã hoàn tiền không được khôi phục. Lý do: ${reason}`;
      }
      await this.accountDAO.taoThongBaoTaiKhoan({
        accountId: params.accountId,
        type: 'AccountStatus',
        content: notification,
      }, conn);
      return { accountId: params.accountId, status, reason, revokedLicenses, restoredLicenses };
    });
  }

  async expireSuspendedAccounts() {
    return this.transaction(async (conn) => {
      const expiredAccounts = await this.accountDAO.layTaiKhoanTamKhoaDaHetHan(conn);
      let expiredCount = 0;

      for (const expiredAccount of expiredAccounts) {
        const account = await this.accountDAO.layTaiKhoanTheoId({
          accountId: expiredAccount.AccountID,
        }, conn);
        if (!account || account.Status !== 'Suspended') continue;

        const accountWasEverBanned = Boolean(await this.accountDAO.kiemTraTaiKhoanTungBiKhoaVinhVien({
          accountId: expiredAccount.AccountID,
        }, conn));
        await this.accountDAO.capNhatTrangThaiTaiKhoan({
          accountId: expiredAccount.AccountID,
          status: 'Active',
        }, conn);
        const restoredLicenses = accountWasEverBanned
          ? 0
          : await this.licenseDAO.khoiPhucBanQuyenTaiKhoan({
            customerId: expiredAccount.AccountID,
          }, conn);

        await this.auditLogService.recordLog({
          accountId: null,
          system: true,
          action: 'ACCOUNT_SUSPENSION_EXPIRED',
          target: `ACCOUNT:${expiredAccount.AccountID}`,
          detail: JSON.stringify({
            previousStatus: 'Suspended',
            status: 'Active',
            suspendUntil: expiredAccount.SuspendUntil,
            restoredLicenses,
            restorationSkippedBecausePreviouslyBanned: accountWasEverBanned,
          }),
        }, conn);
        await this.accountDAO.taoThongBaoTaiKhoan({
          accountId: expiredAccount.AccountID,
          type: 'AccountStatus',
          content: accountWasEverBanned
            ? 'Thời hạn tạm khóa đã kết thúc và tài khoản đã được mở lại. Bản quyền game không được tự động khôi phục vì tài khoản từng bị khóa vĩnh viễn; vui lòng liên hệ hỗ trợ.'
            : `Thời hạn tạm khóa đã kết thúc. Tài khoản đã được mở lại và hệ thống khôi phục ${restoredLicenses} bản quyền bị thu hồi do tạm khóa.`,
        }, conn);
        expiredCount += 1;
      }

      return expiredCount;
    });
  }
}

module.exports = AccountService;
