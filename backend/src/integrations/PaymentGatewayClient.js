'use strict';
const { NotImplementedException } = require('../exceptions');

/**
 * Cổng thanh toán (giả lập cho đồ án).
 * Tên hàm lấy từ sơ đồ sequence.
 */
class PaymentGatewayClient {
  /**
   * UC13. Nạp tiền vào ví (#3)
   */
  async yeuCauXuLyGiaoDich(params = {}) {
    throw new NotImplementedException('PaymentGatewayClient.yeuCauXuLyGiaoDich');
  }

  /**
   * UC23. Đăng ký hồ sơ nhà phát hành (#11)
   */
  async xuLyThanhToanPhi(params = {}) {
    throw new NotImplementedException('PaymentGatewayClient.xuLyThanhToanPhi');
  }
}

module.exports = PaymentGatewayClient;
