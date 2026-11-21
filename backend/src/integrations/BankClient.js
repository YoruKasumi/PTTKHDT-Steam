'use strict';
const { randomUUID } = require('node:crypto');

/**
 * Hệ thống ngân hàng nhận lệnh chuyển khoản (giả lập cho đồ án).
 * Tên hàm lấy từ sơ đồ sequence.
 */
class BankClient {
  /**
   * UC14. Rút tiền (#7)
   * @param {{ amount: number, bankInfo?: string, customerId?: string, simulateFailure?: boolean }} params
   */
  async yeuCauChuyenTien(params = {}) {
    const amount = Number(params.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      return { success: false, message: 'Số tiền rút không hợp lệ' };
    }
    if (params.simulateFailure || params.bankInfo === 'FAIL') {
      return {
        success: false,
        message: 'Lệnh chuyển khoản bị từ chối từ hệ thống ngân hàng liên kết',
      };
    }
    return {
      success: true,
      referenceCode: randomUUID(),
      message: 'Chuyển khoản thành công về tài khoản ngân hàng',
    };
  }

  /**
   * UC57. Phê duyệt rút doanh thu (#14)
   */
  async yeuCauChuyenKhoanNganHang(params = {}) {
    return {
      success: true,
      referenceCode: randomUUID(),
      message: 'Chuyển khoản doanh thu thành công',
    };
  }
}

module.exports = BankClient;
