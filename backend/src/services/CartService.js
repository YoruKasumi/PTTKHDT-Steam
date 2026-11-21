'use strict';
const BaseService = require('./BaseService');
const {
  ConflictException,
  NotFoundException,
  ValidationException,
} = require('../exceptions');
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
    const customerId = this.customerId(params);
    const rows = await this.cartDAO.layDanhSachSanPhamTrongGio({ customerId });
    const items = rows.map((row) => ({
      gameId: row.GameID,
      title: row.Title,
      coverImage: row.CoverImage,
      genres: row.GenreNames ? row.GenreNames.split(',') : [],
      gameStatus: row.GameStatus,
      priceAtAdd: Number(row.PriceAtAdd),
      basePrice: Number(row.BasePrice),
      percentOff: Number(row.PercentOff),
      currentPrice: Number(row.CurrentPrice),
      isOwned: Boolean(row.IsOwned),
    }));
    return {
      items,
      subtotal: items.reduce((total, item) => total + item.currentPrice, 0),
    };
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
    const customerId = this.customerId(params);
    const gameId = typeof params.gameId === 'string' ? params.gameId.trim() : '';
    if (!gameId) throw new ValidationException('gameId là bắt buộc');

    try {
      return await this.transaction(async (conn) => {
        const game = await this.cartDAO.layDonGiaTungSanPham({ gameId }, conn);
        if (!game || game.GameStatus !== 'Approved') {
          throw new NotFoundException('Không tìm thấy trò chơi đang được bán');
        }
        if (await this.cartDAO.kiemTraSanPhamTrongGio({ customerId, gameId }, conn)) {
          throw new ConflictException('Trò chơi đã có trong giỏ hàng');
        }
        if (await this.cartDAO.kiemTraDaSoHuu({ customerId, gameId }, conn)) {
          throw new ConflictException('Bạn đã sở hữu trò chơi này');
        }

        await this.cartDAO.themSanPhamVaoGioHang({
          customerId,
          gameId,
          priceAtAdd: Number(game.CurrentPrice),
        }, conn);
        return {
          gameId,
          priceAtAdd: Number(game.CurrentPrice),
          currentPrice: Number(game.CurrentPrice),
        };
      });
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw new ConflictException('Trò chơi đã có trong giỏ hàng');
      }
      throw error;
    }
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
    const customerId = this.customerId(params);
    const gameId = typeof params.gameId === 'string' ? params.gameId.trim() : '';
    if (!gameId) throw new ValidationException('gameId là bắt buộc');
    const removed = await this.cartDAO.xoaSanPhamKhoiGioHang({ customerId, gameId });
    return { gameId, removed };
  }

  // ---------------------------------------------------------------- Phương thức nội bộ (self-call trong sơ đồ)

  /**
   * UC8. Xem giỏ hàng - sequence #7: nội bộ
   * @param {object} params
   */
  async tinhTongTienGioHang(params = {}) {
    const result = await this.yeuCauXemGioHang(params);
    return result.subtotal;
  }

  /**
   * UC10. Xóa game khỏi giỏ hàng - sequence #7: nội bộ
   * @param {object} params
   */
  async tinhLaiTongTien(params = {}) {
    return this.tinhTongTienGioHang(params);
  }

  customerId(params = {}) {
    const customerId = params.user && params.user.accountId;
    if (!customerId) throw new ValidationException('Tài khoản khách hàng không hợp lệ');
    return customerId;
  }
}

module.exports = CartService;
