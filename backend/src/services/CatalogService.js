'use strict';
const BaseService = require('./BaseService');
const { NotImplementedException } = require('../exceptions');
const GameDAO = require('../dao/GameDAO');

/**
 * CatalogService - tầng Business Logic.
 * Tên phương thức lấy đúng từ sơ đồ sequence; nội dung bên dưới chỉ là khung cần cài đặt.
 */
class CatalogService extends BaseService {
  constructor() {
    super();
    this.gameDAO = new GameDAO();
  }

  // ---------------------------------------------------------------- Phương thức công khai (Route / Service khác gọi)

  /**
   * UC6. Tìm kiếm sản phẩm - sequence #2: UI → CatalogService
   * Luồng theo sơ đồ:
   *   #3 → GameDAO.timKiemSanPhamTheoTuKhoa()
   *   #4 ← traVeDanhSachSanPham()
   *   #5 ← traVeKetQuaTimKiem()
   * @param {object} params
   */
  async guiYeuCauTimKiem(params = {}) {
    throw new NotImplementedException('CatalogService.guiYeuCauTimKiem');
  }

  /**
   * UC6. Tìm kiếm sản phẩm - sequence #8: UI → CatalogService
   * Luồng theo sơ đồ:
   *   #9 → GameDAO.truyVanSanPhamTheoTheLoai()
   *   #10 ← traVeKetQuaLoc()
   * @param {object} params
   */
  async yeuCauLocTheoTheLoai(params = {}) {
    throw new NotImplementedException('CatalogService.yeuCauLocTheoTheLoai');
  }

  /**
   * UC6. Tìm kiếm sản phẩm - sequence #11: UI → CatalogService
   * Luồng theo sơ đồ:
   *   #12 → GameDAO.truyVanSanPhamTheoKhoangGia()
   *   #13 ← traVeKetQuaLoc()
   * @param {object} params
   */
  async yeuCauLocTheoKhoangGia(params = {}) {
    throw new NotImplementedException('CatalogService.yeuCauLocTheoKhoangGia');
  }

  /**
   * UC6. Tìm kiếm sản phẩm - sequence #14: UI → CatalogService
   * Luồng theo sơ đồ:
   *   #15 → GameDAO.truyVanSanPhamTheoTrangThaiSale()
   *   #16 ← traVeKetQuaLoc()
   * @param {object} params
   */
  async yeuCauLocTheoTrangThaiSale(params = {}) {
    throw new NotImplementedException('CatalogService.yeuCauLocTheoTrangThaiSale');
  }

  /**
   * UC6. Tìm kiếm sản phẩm - sequence #20: UI → CatalogService
   * Luồng theo sơ đồ:
   *   #21 → GameDAO.layDanhSachTheoNgayPhatHanh()
   *   #22 ← traVeDanhSachSapXep()
   * @param {object} params
   */
  async sapXepTheoNgayPhatHanh(params = {}) {
    throw new NotImplementedException('CatalogService.sapXepTheoNgayPhatHanh');
  }

  /**
   * UC6. Tìm kiếm sản phẩm - sequence #23: UI → CatalogService
   * Luồng theo sơ đồ:
   *   #24 → GameDAO.layDanhSachTheoDoPhoBien()
   *   #25 ← traVeDanhSachSapXep()
   * @param {object} params
   */
  async sapXepTheoDoPhoBien(params = {}) {
    throw new NotImplementedException('CatalogService.sapXepTheoDoPhoBien');
  }

  /**
   * UC6. Tìm kiếm sản phẩm - sequence #26: UI → CatalogService
   * Luồng theo sơ đồ:
   *   #27 → GameDAO.layDanhSachTheoGia()
   *   #28 ← traVeDanhSachSapXep()
   * @param {object} params
   */
  async sapXepTheoGia(params = {}) {
    throw new NotImplementedException('CatalogService.sapXepTheoGia');
  }

  /**
   * UC7. Xem chi tiết sản phẩm - sequence #2: UI → CatalogService
   * Luồng theo sơ đồ:
   *   #3 → GameDAO.layThongTinSanPham()
   *   #4 ← traVeThongTinSanPham()
   *   #5 → GameDAO.layThongTinCoBan()
   *   #6 ← traVeThongTinCoBan()
   *   #7 ← traVeThongTinCoBan()
   *   #8 → GameDAO.layCauHinhYeuCau()
   *   #9 ← traVeCauHinhYeuCau()
   *   #10 ← traVeCauHinhYeuCau()
   *   #11 → GameDAO.layDanhSachDanhGia()
   *   #12 ← traVeDanhSachDanhGia()
   *   #13 ← traVeDanhSachDanhGia()
   * @param {object} params
   */
  async yeuCauXemChiTietSanPham(params = {}) {
    throw new NotImplementedException('CatalogService.yeuCauXemChiTietSanPham');
  }
}

module.exports = CatalogService;
