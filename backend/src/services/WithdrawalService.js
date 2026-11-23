'use strict';
const BaseService = require('./BaseService');
const WithdrawalDAO = require('../dao/WithdrawalDAO');
const SystemConfigDAO = require('../dao/SystemConfigDAO');
const BankClient = require('../integrations/BankClient');
const { getPlatformCommissionRate } = require('../utils/platformCommission');
const crypto = require('crypto');
const {
  NghiepVuException,
  ValidationException,
  NotFoundException,
  UnauthorizedException,
} = require('../exceptions');

/**
 * WithdrawalService - tầng Business Logic cho Rút doanh thu NPH và Duyệt chi.
 * Triển khai:
 * - UC33 (Chức năng 22): Rút doanh thu về ngân hàng (Developer)
 * - UC57 (Chức năng 24): Phê duyệt rút doanh thu (Admin/Manager)
 */
class WithdrawalService extends BaseService {
  constructor(
    withdrawalDAO = new WithdrawalDAO(),
    systemConfigDAO = new SystemConfigDAO(),
    bankClient = new BankClient(),
  ) {
    super();
    this.withdrawalDAO = withdrawalDAO;
    this.systemConfigDAO = systemConfigDAO;
    this.bankClient = bankClient;
    this.auditLogService = null;
    this.notificationService = null;
    this.systemConfigService = null;
  }

  /**
   * Lấy hạn mức rút tiền tối thiểu động từ cấu hình hệ thống
   */
  async layHanMucRutToiThieu() {
    try {
      const parameters = await this.systemConfigDAO.truyVanThamSoToanCuc();
      const p = parameters.find((item) => item.ParamKey === 'MIN_WITHDRAWAL_VND');
      const val = Number(p?.ParamValue);
      return Number.isFinite(val) && val > 0 ? val : 1000000;
    } catch {
      return 1000000;
    }
  }

  /**
   * Lấy tỷ lệ hoa hồng sàn động từ cấu hình hệ thống
   */
  async layTyLeHoaHongSan() {
    try {
      return await getPlatformCommissionRate(this.systemConfigDAO);
    } catch {
      return 0.3;
    }
  }

  /**
   * UC33. Gửi yêu cầu rút doanh thu (Developer)
   * Sử dụng Pessimistic Locking [M5] trên dòng DEVELOPER để chống race condition
   */
  async guiYeuCauRutDoanhThu(params = {}) {
    const bankInfo = typeof params.bankInfo === 'string' ? params.bankInfo.trim() : '';
    if (!bankInfo) throw new ValidationException('Vui lòng cung cấp thông tin tài khoản nhận tiền.');
    if (bankInfo.length > 100) throw new ValidationException('Thông tin tài khoản nhận tiền không được vượt quá 100 ký tự.');

    const minWithdrawal = await this.layHanMucRutToiThieu();
    const amount = Number(params.amount);
    if (isNaN(amount) || amount < minWithdrawal) {
      throw new ValidationException(`Số tiền rút tối thiểu là ${minWithdrawal.toLocaleString()} VND`, 'ERR_BELOW_MIN_PAYOUT');
    }

    const developerId = params.user?.accountId || params.developerId;
    if (!developerId) throw new UnauthorizedException();

    const commissionRate = await this.layTyLeHoaHongSan();

    return this.transaction(async (conn) => {
      // [M5] Khóa bi quan hàng DEVELOPER để tuần tự hóa các yêu cầu rút tiền song song
      const dev = await this.withdrawalDAO.khoaDeveloper({ developerId }, conn);
      if (!dev) {
        throw new NotFoundException('Không tìm thấy thông tin nhà phát triển');
      }

      const fin = await this.withdrawalDAO.kiemTraSoTienKhaDung({ developerId, commissionRate }, conn);
      if (amount > fin.availableRevenue) {
        throw new NghiepVuException(
          `Số tiền yêu cầu rút (${amount.toLocaleString()} VND) vượt quá doanh thu khả dụng hiện tại (${fin.availableRevenue.toLocaleString()} VND)`,
          400,
          'ERR_EXCEEDS_AVAILABLE_REVENUE'
        );
      }

      const requestId = crypto.randomUUID();
      const ticket = await this.withdrawalDAO.taoLenhRutTienVaTamGiuSoDu({
        requestId,
        developerId,
        amount,
        bankInfo,
      }, conn);

      return {
        success: true,
        message: 'Gửi yêu cầu rút doanh thu thành công, lệnh đang chờ bộ phận tài chính xét duyệt',
        data: ticket,
      };
    });
  }

  async layChiTietLenhRutTien(params = {}) {
    const { requestId } = params;
    if (!requestId) {
      const status = params.status || 'Pending';
      if (!['Pending', 'Approved', 'Rejected', 'all'].includes(status)) {
        throw new ValidationException('Trạng thái lệnh rút tiền không hợp lệ.');
      }
      return this.withdrawalDAO.layDanhSachLenhRutTien({ status });
    }
    const detail = await this.withdrawalDAO.truyVanChiTietLenhRutVaThongTinNganHang({ requestId });
    if (!detail) throw new NotFoundException('Không tìm thấy yêu cầu rút tiền');
    return detail;
  }

  async layDanhSachYeuCauRutTien(params = {}) {
    return this.yeuCauXemLichSuRutTien(params);
  }

  async yeuCauXemLichSuRutTien(params = {}) {
    const developerId = params.user?.accountId;
    if (!developerId) throw new UnauthorizedException();

    const commissionRate = await this.layTyLeHoaHongSan();
    const [finances, withdrawals] = await Promise.all([
      this.withdrawalDAO.kiemTraSoTienKhaDung({ developerId, commissionRate }),
      this.withdrawalDAO.layLichSuRutTien(developerId),
    ]);
    return {
      availableRevenue: finances.availableRevenue,
      withdrawals: withdrawals.map((row) => ({
        requestId: row.RequestID,
        amount: Number(row.Amount),
        bankInfo: row.BankInfo,
        status: row.Status,
        requestDate: row.RequestDate,
      })),
    };
  }

  /**
   * UC57. Từ chối yêu cầu rút doanh thu (Staff/Admin)
   * Trong 1 Transaction: Khóa lệnh rút, cập nhật Rejected, ghi AuditLog, gửi Notification
   */
  async guiYeuCauTuChoi(params = {}) {
    const { requestId, reason } = params;
    const actorId = params.user?.accountId || null;
    if (!requestId) throw new ValidationException('Thiếu requestId');
    if (!reason || reason.trim().length === 0) {
      throw new ValidationException('Vui lòng ghi chú lý do từ chối duyệt chi', 'ERR_MISSING_REJECT_NOTE');
    }

    return this.transaction(async (conn) => {
      // 1. Khóa lệnh rút FOR UPDATE
      const request = await this.withdrawalDAO.khoaLenhRutTien({ requestId }, conn);
      if (!request) {
        throw new NotFoundException('Không tìm thấy yêu cầu rút tiền');
      }
      if (request.Status !== 'Pending') {
        throw new NghiepVuException('Không thể từ chối: lệnh không tồn tại hoặc đã được xử lý trước đó', 400);
      }

      // 2. Cập nhật Status = 'Rejected'
      await this.withdrawalDAO.hoanLaiSoDuTamGiuVaoViNPH({ requestId }, conn);

      // 3. Ghi AuditLog
      if (this.auditLogService) {
        await this.auditLogService.recordLog({
          accountId: actorId,
          action: 'withdrawal.reject',
          targetType: 'WithdrawalRequest',
          targetId: requestId,
          detail: `Từ chối lệnh rút tiền ${requestId} của developer ${request.DeveloperID}. Lý do: ${reason.trim()}`,
        }, conn);
      }

      // 4. Gửi thông báo cho Developer
      if (this.notificationService) {
        const notifContent = `Yêu cầu rút doanh thu ${Number(request.Amount).toLocaleString()} VND của bạn đã bị từ chối. Lý do: ${reason.trim()}`;
        if (typeof this.notificationService.taoThongBaoChoDeveloper === 'function') {
          await this.notificationService.taoThongBaoChoDeveloper({
            developerId: request.DeveloperID,
            type: 'WARNING',
            content: notifContent,
          }, conn);
        } else if (typeof this.notificationService.createNotification === 'function') {
          await this.notificationService.createNotification({
            accountId: request.DeveloperID,
            type: 'WARNING',
            content: notifContent,
          }, conn);
        }
      }

      return {
        success: true,
        message: `Đã từ chối lệnh rút tiền ${requestId}`,
        requestId,
        reason: reason.trim(),
        status: 'Rejected',
      };
    });
  }

  /**
   * UC57. Phê duyệt chi chuyển khoản doanh thu (Staff/Admin)
   * Trong 1 Transaction: Khóa lệnh rút, gọi BankClient, cập nhật Approved, ghi Transaction nếu có, AuditLog, Notification
   */
  async guiYeuCauChuyenKhoan(params = {}) {
    const { requestId } = params;
    const actorId = params.user?.accountId || null;
    if (!requestId) throw new ValidationException('Thiếu requestId');

    return this.transaction(async (conn) => {
      // 1. Khóa lệnh rút FOR UPDATE
      const request = await this.withdrawalDAO.khoaLenhRutTien({ requestId }, conn);
      if (!request) {
        throw new NotFoundException('Không tìm thấy yêu cầu rút tiền');
      }
      if (request.Status !== 'Pending') {
        throw new NghiepVuException('Không thể duyệt: lệnh không tồn tại hoặc đã được xử lý trước đó', 400);
      }

      const amount = Number(request.Amount);

      // 2. Gọi BankClient thực hiện giải ngân ngân hàng mô phỏng
      const bankResult = await this.bankClient.yeuCauChuyenKhoanNganHang({
        amount,
        bankInfo: request.BankInfo,
        requestId,
      });

      if (!bankResult || bankResult.success === false) {
        throw new NghiepVuException(
          bankResult?.message || 'Giao dịch chuyển khoản qua ngân hàng thất bại',
          400,
          'BANK_TRANSFER_FAILED'
        );
      }

      // 3. Cập nhật Status = 'Approved'
      await this.withdrawalDAO.capNhatTrangThaiRutTienThanhCong({ requestId }, conn);

      // 4. Ghi nhận giao dịch chi vào TRANSACTION nếu Developer có ví WALLET
      const devWallet = await this.withdrawalDAO.timViCustomer(request.DeveloperID, conn);
      if (devWallet) {
        await this.withdrawalDAO.ghiNhanGiaoDichVi({
          walletId: devWallet.WalletID,
          amount,
          detail: `Giải ngân doanh thu NPH mã lệnh ${requestId}`,
        }, conn);
      }

      // 5. Ghi AuditLog
      if (this.auditLogService) {
        await this.auditLogService.recordLog({
          accountId: actorId,
          action: 'withdrawal.approve',
          targetType: 'WithdrawalRequest',
          targetId: requestId,
          detail: `Phê duyệt giải ngân ${amount.toLocaleString()} VND cho developer ${request.DeveloperID}. Ref: ${bankResult.referenceCode || ''}`,
        }, conn);
      }

      // 6. Gửi thông báo cho Developer
      if (this.notificationService) {
        const notifContent = `Lệnh rút doanh thu ${amount.toLocaleString()} VND về tài khoản "${request.BankInfo}" đã được phê duyệt và giải ngân thành công.`;
        if (typeof this.notificationService.taoThongBaoChoDeveloper === 'function') {
          await this.notificationService.taoThongBaoChoDeveloper({
            developerId: request.DeveloperID,
            type: 'WALLET',
            content: notifContent,
          }, conn);
        } else if (typeof this.notificationService.createNotification === 'function') {
          await this.notificationService.createNotification({
            accountId: request.DeveloperID,
            type: 'WALLET',
            content: notifContent,
          }, conn);
        }
      }

      return {
        success: true,
        message: `Đã phê duyệt chi chuyển khoản thành công cho lệnh rút ${requestId}`,
        requestId,
        status: 'Approved',
        referenceCode: bankResult.referenceCode || null,
      };
    });
  }

  kiemTraHanMucRutToiThieu(params = {}, minPayout = 1000000) {
    const amount = Number(params.amount);
    if (isNaN(amount) || amount < minPayout) {
      throw new ValidationException(`Số tiền rút tối thiểu là ${minPayout.toLocaleString()} VND`, 'ERR_BELOW_MIN_PAYOUT');
    }
    return amount;
  }
}

module.exports = WithdrawalService;
