'use strict';
const { NotImplementedException } = require('../exceptions');

/**
 * Hệ thống ngân hàng nhận lệnh chuyển khoản (giả lập cho đồ án).
 * Tên hàm lấy từ sơ đồ sequence.
 */
class BankClient {
  /**
   * UC14. Rút tiền (#7)
   */
  async yeuCauChuyenTien(params = {}) {
    throw new NotImplementedException('BankClient.yeuCauChuyenTien');
  }

  /**
   * UC57. Phê duyệt rút doanh thu (#14)
   */
  async yeuCauChuyenKhoanNganHang(params = {}) {
    throw new NotImplementedException('BankClient.yeuCauChuyenKhoanNganHang');
  }
}

module.exports = BankClient;
