'use strict';
const BaseService = require('./BaseService');
const { NotImplementedException } = require('../exceptions');
const WalletDAO = require('../dao/WalletDAO');

/**
 * WalletService - tầng Business Logic.
 * Tên phương thức lấy đúng từ sơ đồ sequence; nội dung bên dưới chỉ là khung cần cài đặt.
 */
class WalletService extends BaseService {
  constructor() {
    super();
    this.walletDAO = new WalletDAO();
    this.authService = null; // được gắn trong services/index.js
    this.gameService = null; // được gắn trong services/index.js
  }

  // ---------------------------------------------------------------- Phương thức công khai (Route / Service khác gọi)

  /**
   * UC12. Xem số dư ví - sequence #2: UI → WalletService
   * Vai trò gọi: Customer
   * Luồng theo sơ đồ:
   *   #3 → AuthService.xacThucNguoiDung
   *   #5 → WalletDAO.truyVanSoDuVi()
   *   #6 ← traVeSoDuVi()
   *   #7 ← traVeSoDuKhaDung()
   * @param {object} params
   */
  async yeuCauXemSoDu(params = {}) {
    throw new NotImplementedException('WalletService.yeuCauXemSoDu');
  }

  /**
   * UC13. Nạp tiền vào ví - sequence #2: UI → WalletService
   * Vai trò gọi: Customer
   * Luồng theo sơ đồ:
   *   #3 → PaymentGatewayClient.yeuCauXuLyGiaoDich()
   *   #4 ← traVeKetQuaGiaoDich()
   *   #5 → WalletDAO.congTienVaoVi()
   *   #6 ← xacNhanCapNhatViThanhCong()
   *   #7 → WalletDAO.luuLichSuGiaoDich()
   *   #8 ← xacNhanLuuLichSuThanhCong()
   *   #9 ← thongBaoNapTienThanhCong()
   *   #11 ← thongBaoNapTienThatBai()
   * @param {object} params
   */
  async guiYeuCauNapTien(params = {}) {
    throw new NotImplementedException('WalletService.guiYeuCauNapTien');
  }

  /**
   * UC14. Rút tiền - sequence #2: UI → WalletService
   * Vai trò gọi: Customer
   * Luồng theo sơ đồ:
   *   #3 → WalletDAO.truyVanSoDuKhaDung()
   *   #4 ← traVeSoDu()
   *   #5 ← phanHoiSoDuKhongDu()
   *   #7 → BankClient.yeuCauChuyenTien()
   *   #8 ← traVeKetQuaChuyenTien()
   *   #9 → WalletDAO.truTienTrongVi()
   *   #10 ← xacNhanCapNhatThanhCong()
   *   #11 → WalletDAO.luuLichSuGiaoDich()
   *   #12 ← xacNhanLuuLichSuThanhCong()
   *   #13 ← thongBaoRutTienThanhCong()
   *   #15 ← thongBaoRutTienThatBai()
   * @param {object} params
   */
  async guiYeuCauRutTien(params = {}) {
    throw new NotImplementedException('WalletService.guiYeuCauRutTien');
  }

  /**
   * UC15. Thanh toán - sequence #8: Service khác → WalletService
   * @param {object} params
   */
  async kiemTraSoDuKhaDung(params = {}) {
    throw new NotImplementedException('WalletService.kiemTraSoDuKhaDung');
  }

  /**
   * UC15. Thanh toán - sequence #15: UI → WalletService
   * Vai trò gọi: Customer
   * Luồng theo sơ đồ:
   *   #16 → WalletService.truTienVi
   *   #17 → WalletDAO.capNhatSoDuVi()
   *   #18 ← xacNhanTruTienThanhCong()
   *   #19 → GameService.capPhatBanQuyen
   *   #20 → GameDAO.luuBanQuyenGame()
   *   #21 ← xacNhanCapPhatThanhCong()
   *   #22 → OrderDAO.xoaGioHang()
   *   #23 ← xacNhanXoaGioHang()
   *   #24 ← thongBaoThanhToanThanhCong()
   * @param {object} params
   */
  async chuyenHuongNapTien(params = {}) {
    throw new NotImplementedException('WalletService.chuyenHuongNapTien');
  }

  /**
   * UC15. Thanh toán - sequence #16: Service khác → WalletService
   * @param {object} params
   */
  async truTienVi(params = {}) {
    throw new NotImplementedException('WalletService.truTienVi');
  }

  /**
   * UC20. Xem lịch sử giao dịch - sequence #2: UI → WalletService
   * Vai trò gọi: Customer
   * Luồng theo sơ đồ:
   *   #3 → WalletDAO.layDanhSachGiaoDich()
   *   #4 ← traVeDanhSachGiaoDich()
   *   #5 ← traVeLichSuGiaoDich()
   * @param {object} params
   */
  async yeuCauXemLichSuGiaoDich(params = {}) {
    throw new NotImplementedException('WalletService.yeuCauXemLichSuGiaoDich');
  }

  /**
   * UC20. Xem lịch sử giao dịch - sequence #8: UI → WalletService
   * Vai trò gọi: Customer
   * Luồng theo sơ đồ:
   *   #9 → WalletDAO.layChiTietGiaoDich()
   *   #10 ← traVeChiTietGiaoDich()
   *   #11 ← traVeChiTietGiaoDich()
   * @param {object} params
   */
  async yeuCauXemChiTiet(params = {}) {
    throw new NotImplementedException('WalletService.yeuCauXemChiTiet');
  }

  /**
   * UC20. Xem lịch sử giao dịch - sequence #14: UI → WalletService
   * Vai trò gọi: Customer
   * Luồng theo sơ đồ:
   *   #15 → WalletDAO.timGiaoDichTheoTenSanPham()
   *   #16 ← traVeKetQuaTimKiem()
   *   #17 → WalletDAO.timGiaoDichTheoNgay()
   *   #18 ← traVeKetQuaTimKiem()
   *   #19 ← traVeKetQuaTimKiem()
   * @param {object} params
   */
  async guiTieuChiTimKiem(params = {}) {
    throw new NotImplementedException('WalletService.guiTieuChiTimKiem');
  }

  /**
   * UC21. Yêu cầu hoàn tiền - sequence #9: Service khác → WalletService
   * @param {object} params
   */
  async congTienHoanTraVaoVi(params = {}) {
    throw new NotImplementedException('WalletService.congTienHoanTraVaoVi');
  }
}

module.exports = WalletService;
