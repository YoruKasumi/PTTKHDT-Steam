'use strict';
const { randomUUID } = require('node:crypto');
const BaseService = require('./BaseService');
const {
  ConflictException,
  NotFoundException,
  NotImplementedException,
  ValidationException,
} = require('../exceptions');
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
  /**
   * Deducts a purchase or Steam Direct fee and records it atomically.
   * Pass conn to participate in an existing transaction; Fee records have no OrderID.
   * @param {{ accountId: string, amount: number|string, type?: 'Purchase'|'Fee', orderId?: string }} params
   * @param {object|null} conn
   */
  async truTienVi(params = {}, conn = null) {
    const accountId = typeof params.accountId === 'string' ? params.accountId.trim() : '';
    const amount = Number(params.amount);
    const type = params.type === undefined ? 'Purchase' : params.type;
    if (!accountId) throw new ValidationException('accountId là bắt buộc');
    if (!Number.isFinite(amount) || amount <= 0
      || amount > 9999999999999.99 || Number(amount.toFixed(2)) !== amount) {
      throw new ValidationException('amount phải là số dương, tối đa 2 chữ số thập phân');
    }
    if (!['Purchase', 'Fee'].includes(type)) {
      throw new ValidationException('type chỉ được là Purchase hoặc Fee');
    }

    const operation = async (conn) => {
      const wallet = await this.walletDAO.truyVanSoDuKhaDung({ accountId }, conn);
      if (!wallet) throw new NotFoundException('Không tìm thấy ví của tài khoản');

      const available = Number(wallet.Balance);
      if (available < amount) {
        throw new ValidationException('Số dư ví không đủ để thanh toán', {
          required: amount,
          available,
        });
      }

      const updated = await this.walletDAO.capNhatSoDuVi({
        walletId: wallet.WalletID,
        amount,
        operation: 'debit',
      }, conn);
      if (!updated) {
        throw new ConflictException('Số dư ví đã thay đổi; vui lòng thử lại');
      }

      const transactionId = randomUUID();
      await this.walletDAO.luuLichSuGiaoDich({
        transactionId,
        walletId: wallet.WalletID,
        orderId: params.orderId || null,
        type,
        amount,
      }, conn);

      return {
        transactionId,
        walletId: wallet.WalletID,
        amount,
        type,
        balance: available - amount,
      };
    };

    return conn ? operation(conn) : this.transaction(operation);
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
