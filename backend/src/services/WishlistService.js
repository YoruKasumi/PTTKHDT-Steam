'use strict';
const BaseService = require('./BaseService');
const { NotImplementedException } = require('../exceptions');
const WishlistDAO = require('../dao/WishlistDAO');

/**
 * WishlistService - tầng Business Logic.
 * Tên phương thức lấy đúng từ sơ đồ sequence; nội dung bên dưới chỉ là khung cần cài đặt.
 */
class WishlistService extends BaseService {
  constructor() {
    super();
    this.wishlistDAO = new WishlistDAO();
    this.gameService = null; // được gắn trong services/index.js
  }

  // ---------------------------------------------------------------- Phương thức công khai (Route / Service khác gọi)

  /**
   * UC11. Quản lý Wishlist - sequence #2: UI → WishlistService
   * Vai trò gọi: Customer
   * Luồng theo sơ đồ:
   *   #3 → GameService.kiemTraBanQuyenSanPham
   *   #4 → WishlistDAO.kiemTraTrangThaiSoHuu()
   *   #5 ← traVeTrangThaiSoHuu()
   *   #6 ← traVeKetQuaSoHuu()
   *   #7 ← thongBaoDaSoHuu()
   *   #9 → WishlistDAO.themVaoWishlist()
   *   #10 ← xacNhanThemThanhCong()
   *   #11 ← thongBaoThemThanhCong()
   * @param {object} params
   */
  async yeuCauThemWishlist(params = {}) {
    throw new NotImplementedException('WishlistService.yeuCauThemWishlist');
  }

  /**
   * UC11. Quản lý Wishlist - sequence #13: UI → WishlistService
   * Vai trò gọi: Customer
   * Luồng theo sơ đồ:
   *   #14 → WishlistDAO.kiemTraTonTaiTrongWishlist()
   *   #15 ← traVeKetQuaKiemTra()
   *   #16 → WishlistDAO.xoaKhoiWishlist()
   *   #17 ← xacNhanXoaThanhCong()
   *   #18 ← thongBaoXoaThanhCong()
   *   #20 ← thongBaoKhongTonTai()
   * @param {object} params
   */
  async yeuCauXoaWishlist(params = {}) {
    throw new NotImplementedException('WishlistService.yeuCauXoaWishlist');
  }
}

module.exports = WishlistService;
