'use strict';
const BaseService = require('./BaseService');
const WithdrawalDAO = require('../dao/WithdrawalDAO');
const crypto = require('crypto');
const { NghiepVuException, ValidationException, NotFoundException, ForbiddenException } = require('../exceptions');

/**
 * WithdrawalService - tầng Business Logic cho Rút doanh thu NPH và Duyệt chi.
 * Triển khai:
 * - UC33 (Chức năng 22): Rút doanh thu về ngân hàng (Developer)
 * - UC57 (Chức năng 24): Phê duyệt rút doanh thu (Admin/Manager)
 */
class WithdrawalService extends BaseService {
  constructor(withdrawalDAO = new WithdrawalDAO()) {
    super();
    this.withdrawalDAO = withdrawalDAO;
  }

  async guiYeuCauRutDoanhThu(params = {}) {
    const developerId = params.user?.accountId || params.developerId;
    const amount = this.kiemTraHanMucRutToiThieu(params);
    const bankInfo = params.bankInfo;

    return this.transaction(async (conn) => {
      const fin = await this.withdrawalDAO.kiemTraSoTienKhaDung({ developerId }, conn);
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
        bankInfo: bankInfo || 'Tài khoản theo hồ sơ NPH'
      }, conn);

      return {
        success: true,
        message: 'Gửi yêu cầu rút doanh thu thành công, lệnh đang chờ bộ phận tài chính xét duyệt',
        data: ticket
      };
    });
  }


  async layChiTietLenhRutTien(params = {}) {
    const { requestId } = params;
    if (!requestId) throw new ValidationException('Thiếu mã yêu cầu rút tiền');
    const detail = await this.withdrawalDAO.truyVanChiTietLenhRutVaThongTinNganHang({ requestId });
    if (!detail) throw new NotFoundException('Không tìm thấy yêu cầu rút tiền');
    return detail;
  }


  async guiYeuCauTuChoi(params = {}) {
    const { requestId, reason } = params;
    if (!requestId) throw new ValidationException('Thiếu requestId');
    if (!reason || reason.trim().length === 0) {
      throw new ValidationException('Vui lòng ghi chú lý do từ chối duyệt chi', 'ERR_MISSING_REJECT_NOTE');
    }

    const updated = await this.withdrawalDAO.hoanLaiSoDuTamGiuVaoViNPH({ requestId });
    if (!updated) {
      throw new NghiepVuException('Không thể từ chối: lệnh không tồn tại hoặc đã được xử lý trước đó', 400);
    }

    return {
      success: true,
      message: `Đã từ chối lệnh rút tiền ${requestId}`,
      requestId,
      reason
    };
  }


  async guiYeuCauChuyenKhoan(params = {}) {
    const { requestId } = params;
    if (!requestId) throw new ValidationException('Thiếu requestId');

    const updated = await this.withdrawalDAO.capNhatTrangThaiRutTienThanhCong({ requestId });
    if (!updated) {
      throw new NghiepVuException('Không thể duyệt: lệnh không tồn tại hoặc đã được xử lý trước đó', 400);
    }

    return {
      success: true,
      message: `Đã phê duyệt chi chuyển khoản thành công cho lệnh rút ${requestId}`,
      requestId,
      status: 'Approved'
    };
  }


  kiemTraHanMucRutToiThieu(params = {}) {
    const amount = Number(params.amount);
    const MIN_PAYOUT = 1000000; // 1.000.000 VND theo tham số hệ thống
    if (isNaN(amount) || amount < MIN_PAYOUT) {
      throw new ValidationException(`Số tiền rút tối thiểu là ${MIN_PAYOUT.toLocaleString()} VND`, 'ERR_BELOW_MIN_PAYOUT');
    }
    return amount;
  }
}

module.exports = WithdrawalService;
