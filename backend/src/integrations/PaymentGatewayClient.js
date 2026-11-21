'use strict';
const { randomUUID } = require('node:crypto');

/**
 * Cổng thanh toán (giả lập cho đồ án).
 * Tên hàm lấy từ sơ đồ sequence.
 */
class PaymentGatewayClient {
  /**
   * UC13. Nạp tiền vào ví (#3)
   * @param {{ amount: number, customerId?: string, paymentMethod?: string, simulateFailure?: boolean }} params
   */
  async yeuCauXuLyGiaoDich(params = {}) {
    const amount = Number(params.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      return { success: false, message: 'Số tiền nạp không hợp lệ' };
    }
    if (params.simulateFailure || params.paymentMethod === 'FAIL') {
      return {
        success: false,
        message: 'Giao dịch bị từ chối bởi cổng thanh toán hoặc ngân hàng phát hành',
      };
    }
    return {
      success: true,
      transactionReference: randomUUID(),
      message: 'Giao dịch nạp tiền thành công',
    };
  }

  /**
   * UC23. Đăng ký hồ sơ nhà phát hành (#11)
   */
  async xuLyThanhToanPhi(params = {}) {
    return {
      success: true,
      transactionReference: randomUUID(),
      message: 'Thanh toán phí nhà phát hành thành công',
    };
  }
}

module.exports = PaymentGatewayClient;
