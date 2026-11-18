'use strict';
const BaseService = require('./BaseService');
const { NotImplementedException } = require('../exceptions');
const PromotionDAO = require('../dao/PromotionDAO');

/**
 * PromotionService - tầng Business Logic.
 * Tên phương thức lấy đúng từ sơ đồ sequence; nội dung bên dưới chỉ là khung cần cài đặt.
 */
class PromotionService extends BaseService {
  constructor() {
    super();
    this.promotionDAO = new PromotionDAO();
  }

  // ---------------------------------------------------------------- Phương thức công khai (Route / Service khác gọi)

  /**
   * UC27. Lên chiến dịch Sale - sequence #2: UI → PromotionService
   * Vai trò gọi: Developer
   * Luồng theo sơ đồ:
   *   #3 ↻ this.kiemTraPhanTramGiaSale()
   *   #4 ↻ this.kiemTraKhungThoiGianSale()
   *   #7 → PromotionDAO.luuLichTrinhChienDichSale()
   *   #8 ← xacNhanLuuChienDichThanhCong()
   *   #9 ← thongBaoLenChienDichThanhCong()
   * @param {object} params
   */
  async yeuCauLenChienDichSale(params = {}) {
    throw new NotImplementedException('PromotionService.yeuCauLenChienDichSale');
  }

  /**
   * UC28. Tự sinh mã kích hoạt (Key) - sequence #2: UI → PromotionService
   * Vai trò gọi: Developer
   * Luồng theo sơ đồ:
   *   #3 → PromotionDAO.kiemTraGameCoThuPhi()
   *   #4 ← traVeTrangThaiThuPhi()
   *   #5 ↻ this.kiemTraSoLuongKeyYeuCauDuoi200()
   *   #6 → PromotionDAO.kiemTraTongKeyChuaKichHoatDuoi2000()
   *   #7 ← traVeKetQuaKiemTraTongKey()
   *   #8 ← thongBaoYeuCauKhongHopLe()
   *   #10 ↻ this.sinhDanhSachMaKeyNgauNhien()
   *   #11 → PromotionDAO.luuDanhSachMaKeyMoi()
   *   #12 ← xacNhanLuuKeyThanhCong()
   *   #13 ← traVeDanhSachMaKey()
   * @param {object} params
   */
  async yeuCauSinhMaKichHoat(params = {}) {
    throw new NotImplementedException('PromotionService.yeuCauSinhMaKichHoat');
  }

  // ---------------------------------------------------------------- Phương thức nội bộ (self-call trong sơ đồ)

  /**
   * UC27. Lên chiến dịch Sale - sequence #3: nội bộ
   * @param {object} params
   */
  async kiemTraPhanTramGiaSale(params = {}) {
    throw new NotImplementedException('PromotionService.kiemTraPhanTramGiaSale');
  }

  /**
   * UC27. Lên chiến dịch Sale - sequence #4: nội bộ
   * @param {object} params
   */
  async kiemTraKhungThoiGianSale(params = {}) {
    throw new NotImplementedException('PromotionService.kiemTraKhungThoiGianSale');
  }

  /**
   * UC28. Tự sinh mã kích hoạt (Key) - sequence #5: nội bộ
   * @param {object} params
   */
  async kiemTraSoLuongKeyYeuCauDuoi200(params = {}) {
    throw new NotImplementedException('PromotionService.kiemTraSoLuongKeyYeuCauDuoi200');
  }

  /**
   * UC28. Tự sinh mã kích hoạt (Key) - sequence #10: nội bộ
   * @param {object} params
   */
  async sinhDanhSachMaKeyNgauNhien(params = {}) {
    throw new NotImplementedException('PromotionService.sinhDanhSachMaKeyNgauNhien');
  }
}

module.exports = PromotionService;
