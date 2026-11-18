'use strict';
const BaseDAO = require('./BaseDAO');
const { NotImplementedException } = require('../exceptions');

class ReportDAO extends BaseDAO {
  /**
   * UC30. Báo cáo doanh thu real-time (#3)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async truyVanGiaoDichThanhCong(params = {}, conn = null) {
    throw new NotImplementedException('ReportDAO.truyVanGiaoDichThanhCong');
  }

  /**
   * UC31. Kết xuất bảng kê đối soát (#3)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async truyVanDuLieuDoiSoatKyNay(params = {}, conn = null) {
    throw new NotImplementedException('ReportDAO.truyVanDuLieuDoiSoatKyNay');
  }

  /**
   * UC32. Thống kê Wishlist & Refund (#3)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async truyVanLuotWishlistVaRefund(params = {}, conn = null) {
    throw new NotImplementedException('ReportDAO.truyVanLuotWishlistVaRefund');
  }

  /**
   * UC50. Dashboard tài chính tổng quan (#3)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async truyVanDuLieuTaiChinhRealTime(params = {}, conn = null) {
    throw new NotImplementedException('ReportDAO.truyVanDuLieuTaiChinhRealTime');
  }

  /**
   * UC51. Thống kê doanh số toàn sàn (#5)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async truyVanDonHangThanhCongTheoThoiGian(params = {}, conn = null) {
    throw new NotImplementedException('ReportDAO.truyVanDonHangThanhCongTheoThoiGian');
  }

  /**
   * UC52. Thống kê hoa hồng nền tảng (#3)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async truyVanDoanhThuDonHangVaTyLeChietKhau(params = {}, conn = null) {
    throw new NotImplementedException('ReportDAO.truyVanDoanhThuDonHangVaTyLeChietKhau');
  }

  /**
   * UC53. Xuất báo cáo tài chính định kỳ (#5)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async truyVanDuLieuTaiChinhTheoKy(params = {}, conn = null) {
    throw new NotImplementedException('ReportDAO.truyVanDuLieuTaiChinhTheoKy');
  }

  /**
   * UC54. Theo dõi dòng tiền chờ rút (#3)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async truyVanSoDuDoanhThuCacNhaPhatHanh(params = {}, conn = null) {
    throw new NotImplementedException('ReportDAO.truyVanSoDuDoanhThuCacNhaPhatHanh');
  }

  /**
   * UC55. Thống kê giá trị hoàn tiền (#3)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async truyVanCacDonHangHoanTienThanhCong(params = {}, conn = null) {
    throw new NotImplementedException('ReportDAO.truyVanCacDonHangHoanTienThanhCong');
  }

  /**
   * UC56. Theo dõi biến động số dư ví (#3)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async truyVanNhatKyGiaoDichViToanSan(params = {}, conn = null) {
    throw new NotImplementedException('ReportDAO.truyVanNhatKyGiaoDichViToanSan');
  }
}

module.exports = ReportDAO;
