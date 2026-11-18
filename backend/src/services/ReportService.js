'use strict';
const BaseService = require('./BaseService');
const { NotImplementedException } = require('../exceptions');
const ReportDAO = require('../dao/ReportDAO');

/**
 * ReportService - tầng Business Logic.
 * Tên phương thức lấy đúng từ sơ đồ sequence; nội dung bên dưới chỉ là khung cần cài đặt.
 */
class ReportService extends BaseService {
  constructor() {
    super();
    this.reportDAO = new ReportDAO();
  }

  // ---------------------------------------------------------------- Phương thức công khai (Route / Service khác gọi)

  /**
   * UC30. Báo cáo doanh thu real-time - sequence #2: UI → ReportService
   * Vai trò gọi: Developer
   * Luồng theo sơ đồ:
   *   #3 → ReportDAO.truyVanGiaoDichThanhCong()
   *   #4 ← traVeDuLieuGiaoDich()
   *   #5 ↻ this.tinhTongDoanhThuVaSoLuongBan()
   *   #6 ← traVeSoLieuBaoCao()
   * @param {object} params
   */
  async yeuCauBaoCaoDoanhThuRealTime(params = {}) {
    throw new NotImplementedException('ReportService.yeuCauBaoCaoDoanhThuRealTime');
  }

  /**
   * UC31. Kết xuất bảng kê đối soát - sequence #2: UI → ReportService
   * Vai trò gọi: Developer
   * Luồng theo sơ đồ:
   *   #3 → ReportDAO.truyVanDuLieuDoiSoatKyNay()
   *   #4 ← traVeDuLieuTaiChinh()
   *   #5 ↻ this.tinhDoanhThuPhiSanHoanTienThucNhan()
   *   #6 ↻ this.taoTepBangKeDoiSoat()
   *   #7 ← traVeTepDoiSoat()
   * @param {object} params
   */
  async yeuCauKetXuatBangKe(params = {}) {
    throw new NotImplementedException('ReportService.yeuCauKetXuatBangKe');
  }

  /**
   * UC32. Thống kê Wishlist & Refund - sequence #2: UI → ReportService
   * Vai trò gọi: Developer
   * Luồng theo sơ đồ:
   *   #3 → ReportDAO.truyVanLuotWishlistVaRefund()
   *   #4 ← traVeDuLieuWishlistVaRefund()
   *   #5 ↻ this.tinhTyLeChuyenDoiVaTyLeHoanTien()
   *   #6 ← traVeKetQuaThongKe()
   * @param {object} params
   */
  async yeuCauThongKeTuongTac(params = {}) {
    throw new NotImplementedException('ReportService.yeuCauThongKeTuongTac');
  }

  // ---------------------------------------------------------------- Phương thức nội bộ (self-call trong sơ đồ)

  /**
   * UC30. Báo cáo doanh thu real-time - sequence #5: nội bộ
   * @param {object} params
   */
  async tinhTongDoanhThuVaSoLuongBan(params = {}) {
    throw new NotImplementedException('ReportService.tinhTongDoanhThuVaSoLuongBan');
  }

  /**
   * UC31. Kết xuất bảng kê đối soát - sequence #5: nội bộ
   * @param {object} params
   */
  async tinhDoanhThuPhiSanHoanTienThucNhan(params = {}) {
    throw new NotImplementedException('ReportService.tinhDoanhThuPhiSanHoanTienThucNhan');
  }

  /**
   * UC31. Kết xuất bảng kê đối soát - sequence #6: nội bộ
   * @param {object} params
   */
  async taoTepBangKeDoiSoat(params = {}) {
    throw new NotImplementedException('ReportService.taoTepBangKeDoiSoat');
  }

  /**
   * UC32. Thống kê Wishlist & Refund - sequence #5: nội bộ
   * @param {object} params
   */
  async tinhTyLeChuyenDoiVaTyLeHoanTien(params = {}) {
    throw new NotImplementedException('ReportService.tinhTyLeChuyenDoiVaTyLeHoanTien');
  }
}

module.exports = ReportService;
