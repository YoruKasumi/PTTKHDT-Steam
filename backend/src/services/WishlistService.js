'use strict';
const BaseService = require('./BaseService');
const {
  ConflictException,
  NotFoundException,
  ValidationException,
} = require('../exceptions');
const WishlistDAO = require('../dao/WishlistDAO');
const CartDAO = require('../dao/CartDAO');

/**
 * WishlistService - tầng Business Logic.
 * Tên phương thức lấy đúng từ sơ đồ sequence; nội dung bên dưới chỉ là khung cần cài đặt.
 */
class WishlistService extends BaseService {
  constructor() {
    super();
    this.wishlistDAO = new WishlistDAO();
    this.cartDAO = new CartDAO();
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
    const customerId = this.customerId(params);
    const gameId = typeof params.gameId === 'string' ? params.gameId.trim() : '';
    if (!gameId) throw new ValidationException('gameId là bắt buộc');

    try {
      return await this.transaction(async (conn) => {
        const game = await this.cartDAO.layDonGiaTungSanPham({ gameId }, conn);
        if (!game || game.GameStatus !== 'Approved') {
          throw new NotFoundException('Không tìm thấy trò chơi đang được bán');
        }
        if (await this.wishlistDAO.kiemTraTrangThaiSoHuu({ customerId, gameId }, conn)) {
          throw new ConflictException('Bạn đã sở hữu trò chơi này');
        }
        if (await this.wishlistDAO.kiemTraTonTaiTrongWishlist({ customerId, gameId }, conn)) {
          throw new ConflictException('Trò chơi đã có trong Wishlist');
        }
        return this.wishlistDAO.themVaoWishlist({ customerId, gameId }, conn);
      });
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw new ConflictException('Trò chơi đã có trong Wishlist');
      }
      throw error;
    }
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
    const customerId = this.customerId(params);
    const gameId = typeof params.gameId === 'string' ? params.gameId.trim() : '';
    if (!gameId) throw new ValidationException('gameId là bắt buộc');
    const removed = await this.wishlistDAO.xoaKhoiWishlist({ customerId, gameId });
    return { gameId, removed };
  }

  async yeuCauXemWishlist(params = {}) {
    const customerId = this.customerId(params);
    const rows = await this.wishlistDAO.layDanhSachWishlist({ customerId });
    return rows.map((row) => ({
      gameId: row.GameID,
      title: row.Title,
      coverImage: row.CoverImage,
      gameStatus: row.GameStatus,
      developer: row.CompanyName,
      genres: row.GenreNames ? row.GenreNames.split(',') : [],
      basePrice: Number(row.BasePrice),
      percentOff: Number(row.PercentOff),
      currentPrice: Number(row.CurrentPrice),
      rating: Number(row.AverageRating),
      ratingCount: Number(row.RatingCount),
      addedDate: row.AddedDate,
    }));
  }

  customerId(params = {}) {
    const customerId = params.user && params.user.accountId;
    if (!customerId) throw new ValidationException('Tài khoản khách hàng không hợp lệ');
    return customerId;
  }
}

module.exports = WishlistService;
