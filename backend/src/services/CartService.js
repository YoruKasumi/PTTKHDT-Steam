'use strict';
const BaseService = require('./BaseService');
const { NotImplementedException } = require('../exceptions');
const CartDAO = require('../dao/CartDAO');

/**
 * CartService - tầng Business Logic.
 * Tên phương thức lấy đúng từ sơ đồ sequence; nội dung bên dưới chỉ là khung cần cài đặt.
 */
class CartService extends BaseService {
  constructor() {
    super();
    this.cartDAO = new CartDAO();
    this.gameService = null; // được gắn trong services/index.js
  }

  // ---------------------------------------------------------------- Phương thức công khai (Route / Service khác gọi)

  /**
   * UC8. Xem giỏ hàng - sequence #2: UI → CartService
   * Vai trò gọi: Customer
   * Luồng theo sơ đồ:
   *   #3 → CartDAO.layDanhSachSanPhamTrongGio()
   *   #4 ← traVeDanhSachSanPham()
   *   #5 → CartDAO.layDonGiaTungSanPham()
   *   #6 ← traVeDonGia()
   *   #7 ↻ this.tinhTongTienGioHang()
   *   #8 ← traVeDanhSachVaTongTien()
   * @param {object} params
   */
  async yeuCauXemGioHang(params = {}) {
    throw new NotImplementedException('CartService.yeuCauXemGioHang');
  }

  /**
   * UC9. Thêm game vào giỏ hàng - sequence #2: UI → CartService
   * Vai trò gọi: Customer
   * Luồng theo sơ đồ:
   *   #3 → CartDAO.kiemTraSanPhamTrongGio()
   *   #4 ← traVeKetQuaKiemTra()
   *   #5 ← thongBaoSanPhamDaTonTai()
   *   #7 → GameService.kiemTraBanQuyenSanPham
   *   #8 → GameDAO.kiemTraGameDaSoHuu()
   *   #9 ← traVeTrangThaiSoHuu()
   *   #10 ← traVeKetQuaKiemTra()
   *   #11 ← thongBaoDaSoHuuGame()
   *   #13 → CartDAO.themSanPhamVaoGioHang()
   *   #14 ← xacNhanThemThanhCong()
   *   #15 ← thongBaoThemVaoGioThanhCong()
   * @param {object} params
   */
  async yeuCauThemSanPham(params = {}) {
    throw new NotImplementedException('CartService.yeuCauThemSanPham');
  }

  /**
   * UC10. Xóa game khỏi giỏ hàng - sequence #2: UI → CartService
   * Vai trò gọi: Customer
   * Luồng theo sơ đồ:
   *   #3 → CartDAO.kiemTraSanPhamTrongGio()
   *   #4 ← traVeKetQuaKiemTra()
   *   #5 → CartDAO.xoaSanPhamKhoiGioHang()
   *   #6 ← xacNhanXoaThanhCong()
   *   #7 ↻ this.tinhLaiTongTien()
   *   #8 ← thongBaoXoaThanhCong()
   *   #10 ← thongBaoSanPhamKhongTonTai()
   * @param {object} params
   */
  async yeuCauXoaSanPham(params = {}) {
    throw new NotImplementedException('CartService.yeuCauXoaSanPham');
  }

  // ---------------------------------------------------------------- Phương thức nội bộ (self-call trong sơ đồ)

  /**
   * UC8. Xem giỏ hàng - sequence #7: nội bộ
   * @param {object} params
   */
  async tinhTongTienGioHang(params = {}) {
    throw new NotImplementedException('CartService.tinhTongTienGioHang');
  }

  /**
   * UC10. Xóa game khỏi giỏ hàng - sequence #7: nội bộ
   * @param {object} params
   */
  async tinhLaiTongTien(params = {}) {
    throw new NotImplementedException('CartService.tinhLaiTongTien');
  }
}

module.exports = CartService;
