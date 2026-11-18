'use strict';
const BaseService = require('./BaseService');
const { NotImplementedException } = require('../exceptions');
const LicenseDAO = require('../dao/LicenseDAO');

/**
 * LibraryService - tầng Business Logic.
 * Tên phương thức lấy đúng từ sơ đồ sequence; nội dung bên dưới chỉ là khung cần cài đặt.
 */
class LibraryService extends BaseService {
  constructor() {
    super();
    this.licenseDAO = new LicenseDAO();
  }

  // ---------------------------------------------------------------- Phương thức công khai (Route / Service khác gọi)

  /**
   * UC16. Xem thư viện cá nhân - sequence #2: UI → LibraryService
   * Vai trò gọi: Customer
   * Luồng theo sơ đồ:
   *   #3 → LicenseDAO.layDanhSachGameDaSoHuu()
   *   #4 ← traVeDanhSachGame()
   *   #5 → LicenseDAO.kiemTraCapNhatGame()
   *   #6 ← traVeDanhSachCapNhat()
   *   #7 ← traVeThuVienCaNhan()
   * @param {object} params
   */
  async yeuCauXemThuVien(params = {}) {
    throw new NotImplementedException('LibraryService.yeuCauXemThuVien');
  }

  /**
   * UC17. Khởi chạy game - sequence #2: UI → LibraryService
   * Vai trò gọi: Customer
   * Luồng theo sơ đồ:
   *   #3 → LicenseDAO.kiemTraTokenBanQuyen()
   *   #4 ← traVeTrangThaiToken()
   *   #5 ↻ this.kiemTraPhienBanHienTai()
   *   #6 ← traVeTrangThaiPhienBan()
   *   #7 → LicenseDAO.taiBanVaCapNhat()
   *   #8 ← xacNhanCapNhatThanhCong()
   *   #11 ← tuChoiKhoiChay()
   * @param {object} params
   */
  async yeuCauKhoiChay(params = {}) {
    throw new NotImplementedException('LibraryService.yeuCauKhoiChay');
  }

  /**
   * UC18. Tải game - sequence #2: UI → LibraryService
   * Vai trò gọi: Customer
   * Luồng theo sơ đồ:
   *   #3 → LicenseDAO.kiemTraTokenBanQuyen()
   *   #4 ← traVeKetQuaToken()
   *   #5 ↻ this.kiemTraDuongDanLuuTru()
   *   #6 ↻ this.kiemTraDungLuongODia()
   *   #7 → LicenseDAO.layGoiCaiDat()
   *   #8 ← traVeTepCaiDat()
   *   #11 ← thongBaoTaiGameThatBai()
   * @param {object} params
   */
  async yeuCauTaiGame(params = {}) {
    throw new NotImplementedException('LibraryService.yeuCauTaiGame');
  }

  // ---------------------------------------------------------------- Phương thức nội bộ (self-call trong sơ đồ)

  /**
   * UC17. Khởi chạy game - sequence #5: nội bộ
   * @param {object} params
   */
  async kiemTraPhienBanHienTai(params = {}) {
    throw new NotImplementedException('LibraryService.kiemTraPhienBanHienTai');
  }

  /**
   * UC18. Tải game - sequence #5: nội bộ
   * UC19. Gỡ cài đặt game - sequence #3: nội bộ
   * @param {object} params
   */
  async kiemTraDuongDanLuuTru(params = {}) {
    throw new NotImplementedException('LibraryService.kiemTraDuongDanLuuTru');
  }

  /**
   * UC18. Tải game - sequence #6: nội bộ
   * @param {object} params
   */
  async kiemTraDungLuongODia(params = {}) {
    throw new NotImplementedException('LibraryService.kiemTraDungLuongODia');
  }
}

module.exports = LibraryService;
