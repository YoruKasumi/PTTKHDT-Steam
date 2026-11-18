'use strict';
const BaseService = require('./BaseService');
const { NotImplementedException } = require('../exceptions');
const OrderDAO = require('../dao/OrderDAO');

/**
 * OrderService - tầng Business Logic.
 * Tên phương thức lấy đúng từ sơ đồ sequence; nội dung bên dưới chỉ là khung cần cài đặt.
 */
class OrderService extends BaseService {
  constructor() {
    super();
    this.orderDAO = new OrderDAO();
    this.walletService = null; // được gắn trong services/index.js
  }

  // ---------------------------------------------------------------- Phương thức công khai (Route / Service khác gọi)

  /**
   * UC15. Thanh toán - sequence #2: UI → OrderService
   * Vai trò gọi: Customer
   * @param {object} params
   */
  async yeuCauThanhToan(params = {}) {
    throw new NotImplementedException('OrderService.yeuCauThanhToan');
  }

  /**
   * UC15. Thanh toán - sequence #4: UI → OrderService
   * Vai trò gọi: Customer
   * Luồng theo sơ đồ:
   *   #5 → OrderDAO.truyVanMaGiamGia()
   *   #6 ← traVeThongTinGiamGia()
   *   #8 → WalletService.kiemTraSoDuKhaDung
   *   #9 → WalletDAO.truyVanSoDu()
   *   #10 ← traVeSoDu()
   *   #11 ← traVeKetQuaSoDu()
   *   #12 ← thongBaoSoDuKhongDu()
   * @param {object} params
   */
  async kiemTraMaGiamGia(params = {}) {
    throw new NotImplementedException('OrderService.kiemTraMaGiamGia');
  }

  /**
   * UC21. Yêu cầu hoàn tiền - sequence #2: UI → OrderService
   * Vai trò gọi: Customer
   * Luồng theo sơ đồ:
   *   #3 → OrderDAO.kiemTraTokenBanQuyen()
   *   #4 ← traVeThongTinBanQuyen()
   *   #5 → OrderDAO.kiemTraThoiGianThanhToanDuoi24h()
   *   #6 ← traVeKetQuaKiemTraThoiGian()
   *   #7 → OrderDAO.thuHoiBanQuyenGame()
   *   #8 ← xacNhanThuHoiThanhCong()
   *   #9 → WalletService.congTienHoanTraVaoVi
   *   #10 → WalletDAO.capNhatSoDuVi()
   *   #11 ← xacNhanHoanTien()
   *   #12 ← thongBaoHoanTienThanhCong()
   *   #14 ← thongBaoHoanTienThatBai()
   * @param {object} params
   */
  async guiYeuCauHoanTien(params = {}) {
    throw new NotImplementedException('OrderService.guiYeuCauHoanTien');
  }
}

module.exports = OrderService;
