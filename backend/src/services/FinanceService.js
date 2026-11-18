'use strict';
const BaseService = require('./BaseService');
const { NotImplementedException } = require('../exceptions');
const ReportDAO = require('../dao/ReportDAO');

/**
 * FinanceService - tầng Business Logic.
 * Tên phương thức lấy đúng từ sơ đồ sequence; nội dung bên dưới chỉ là khung cần cài đặt.
 */
class FinanceService extends BaseService {
  constructor() {
    super();
    this.reportDAO = new ReportDAO();
  }

  // ---------------------------------------------------------------- Phương thức công khai (Route / Service khác gọi)

  /**
   * UC50. Dashboard tài chính tổng quan - sequence #2: UI → FinanceService
   * Vai trò gọi: Admin, Manager
   * Luồng theo sơ đồ:
   *   #3 → ReportDAO.truyVanDuLieuTaiChinhRealTime()
   *   #4 ← traVeDuLieuTaiChinh()
   *   #5 ↻ this.tinhToanCacChiSoTaiChinh()
   *   #6 ← traVeDuLieuDashboard()
   * @param {object} params
   */
  async yeuCauLayDuLieuTongQuan(params = {}) {
    throw new NotImplementedException('FinanceService.yeuCauLayDuLieuTongQuan');
  }

  /**
   * UC51. Thống kê doanh số toàn sàn - sequence #4: UI → FinanceService
   * Vai trò gọi: Admin, Manager
   * Luồng theo sơ đồ:
   *   #5 → ReportDAO.truyVanDonHangThanhCongTheoThoiGian()
   *   #6 ← traVeDanhSachDonHang()
   *   #7 ↻ this.tongHopTongDoanhSo()
   *   #8 ← traVeKetQuaThongKeDoanhSo()
   * @param {object} params
   */
  async guiYeuCauThongKeDoanhSo(params = {}) {
    throw new NotImplementedException('FinanceService.guiYeuCauThongKeDoanhSo');
  }

  /**
   * UC52. Thống kê hoa hồng nền tảng - sequence #2: UI → FinanceService
   * Vai trò gọi: Admin, Manager
   * Luồng theo sơ đồ:
   *   #3 → ReportDAO.truyVanDoanhThuDonHangVaTyLeChietKhau()
   *   #4 ← traVeDuLieuDoanhThuVaChietKhau()
   *   #5 ↻ this.tinhTongHoaHongNenTangThuVe()
   *   #6 ← traVeSoLieuHoaHong()
   * @param {object} params
   */
  async yeuCauThongKeHoaHong(params = {}) {
    throw new NotImplementedException('FinanceService.yeuCauThongKeHoaHong');
  }

  /**
   * UC53. Xuất báo cáo tài chính định kỳ - sequence #4: UI → FinanceService
   * Vai trò gọi: Admin, Manager
   * Luồng theo sơ đồ:
   *   #5 → ReportDAO.truyVanDuLieuTaiChinhTheoKy()
   *   #6 ← traVeDuLieuTaiChinhKy()
   *   #7 ↻ this.ketXuatTepBaoCaoTaiChinh()
   *   #8 ← traVeTepBaoCao()
   * @param {object} params
   */
  async yeuCauXuatBaoCaoTaiChinh(params = {}) {
    throw new NotImplementedException('FinanceService.yeuCauXuatBaoCaoTaiChinh');
  }

  /**
   * UC54. Theo dõi dòng tiền chờ rút - sequence #2: UI → FinanceService
   * Vai trò gọi: Admin, Manager
   * Luồng theo sơ đồ:
   *   #3 → ReportDAO.truyVanSoDuDoanhThuCacNhaPhatHanh()
   *   #4 ← traVeSoDuDoanhThuCacNhaPhatHanh()
   *   #5 ↻ this.phanLoaiSoDuKhaDungVaTamGiu()
   *   #6 ← traVeDanhSachDongTienChoRut()
   * @param {object} params
   */
  async yeuCauDuLieuDongTienChoRut(params = {}) {
    throw new NotImplementedException('FinanceService.yeuCauDuLieuDongTienChoRut');
  }

  /**
   * UC55. Thống kê giá trị hoàn tiền - sequence #2: UI → FinanceService
   * Vai trò gọi: Admin, Manager
   * Luồng theo sơ đồ:
   *   #3 → ReportDAO.truyVanCacDonHangHoanTienThanhCong()
   *   #4 ← traVeDanhSachDonHangHoanTien()
   *   #5 ↻ this.tinhTongGiaTriVaTyLeHoanTien()
   *   #6 ← traVeKetQuaThongKeHoanTien()
   * @param {object} params
   */
  async yeuCauThongKeHoanTien(params = {}) {
    throw new NotImplementedException('FinanceService.yeuCauThongKeHoanTien');
  }

  /**
   * UC56. Theo dõi biến động số dư ví - sequence #2: UI → FinanceService
   * Vai trò gọi: Admin, Manager
   * Luồng theo sơ đồ:
   *   #3 → ReportDAO.truyVanNhatKyGiaoDichViToanSan()
   *   #4 ← traVeNhatKyGiaoDichVi()
   *   #5 ↻ this.kiemTraDoiSoatCanBangSoDu()
   *   #6 ← traVeDuLieuNhatKyBienDong()
   * @param {object} params
   */
  async yeuCauNhatKyBienDongSoDu(params = {}) {
    throw new NotImplementedException('FinanceService.yeuCauNhatKyBienDongSoDu');
  }

  // ---------------------------------------------------------------- Phương thức nội bộ (self-call trong sơ đồ)

  /**
   * UC50. Dashboard tài chính tổng quan - sequence #5: nội bộ
   * @param {object} params
   */
  async tinhToanCacChiSoTaiChinh(params = {}) {
    throw new NotImplementedException('FinanceService.tinhToanCacChiSoTaiChinh');
  }

  /**
   * UC51. Thống kê doanh số toàn sàn - sequence #7: nội bộ
   * @param {object} params
   */
  async tongHopTongDoanhSo(params = {}) {
    throw new NotImplementedException('FinanceService.tongHopTongDoanhSo');
  }

  /**
   * UC52. Thống kê hoa hồng nền tảng - sequence #5: nội bộ
   * @param {object} params
   */
  async tinhTongHoaHongNenTangThuVe(params = {}) {
    throw new NotImplementedException('FinanceService.tinhTongHoaHongNenTangThuVe');
  }

  /**
   * UC53. Xuất báo cáo tài chính định kỳ - sequence #7: nội bộ
   * @param {object} params
   */
  async ketXuatTepBaoCaoTaiChinh(params = {}) {
    throw new NotImplementedException('FinanceService.ketXuatTepBaoCaoTaiChinh');
  }

  /**
   * UC54. Theo dõi dòng tiền chờ rút - sequence #5: nội bộ
   * @param {object} params
   */
  async phanLoaiSoDuKhaDungVaTamGiu(params = {}) {
    throw new NotImplementedException('FinanceService.phanLoaiSoDuKhaDungVaTamGiu');
  }

  /**
   * UC55. Thống kê giá trị hoàn tiền - sequence #5: nội bộ
   * @param {object} params
   */
  async tinhTongGiaTriVaTyLeHoanTien(params = {}) {
    throw new NotImplementedException('FinanceService.tinhTongGiaTriVaTyLeHoanTien');
  }

  /**
   * UC56. Theo dõi biến động số dư ví - sequence #5: nội bộ
   * @param {object} params
   */
  async kiemTraDoiSoatCanBangSoDu(params = {}) {
    throw new NotImplementedException('FinanceService.kiemTraDoiSoatCanBangSoDu');
  }
}

module.exports = FinanceService;
