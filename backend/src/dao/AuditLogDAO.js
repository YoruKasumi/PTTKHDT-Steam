'use strict';
const BaseDAO = require('./BaseDAO');
const { NotImplementedException } = require('../exceptions');

class AuditLogDAO extends BaseDAO {
  /**
   * UC39. Phê duyệt phát hành game (#10)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async luuNhatKyPheDuyet(params = {}, conn = null) {
    throw new NotImplementedException('AuditLogDAO.luuNhatKyPheDuyet');
  }

  /**
   * UC40. Từ chối phát hành game (#11)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async luuNhatKyTuChoi(params = {}, conn = null) {
    throw new NotImplementedException('AuditLogDAO.luuNhatKyTuChoi');
  }

  /**
   * UC41. Gỡ bỏ game khẩn cấp (#8)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async luuNhatKyGoBoKhanCap(params = {}, conn = null) {
    throw new NotImplementedException('AuditLogDAO.luuNhatKyGoBoKhanCap');
  }

  /**
   * UC43. Xử lý đánh giá vi phạm (#8)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async luuNhatKyXuLyDanhGia(params = {}, conn = null) {
    throw new NotImplementedException('AuditLogDAO.luuNhatKyXuLyDanhGia');
  }

  /**
   * UC44. Tạm khóa tài khoản vi phạm (#8)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async luuNhatKyTamKhoa(params = {}, conn = null) {
    throw new NotImplementedException('AuditLogDAO.luuNhatKyTamKhoa');
  }

  /**
   * UC45. Khóa vĩnh viễn tài khoản (#8)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async luuNhatKyKhoaVinhVien(params = {}, conn = null) {
    throw new NotImplementedException('AuditLogDAO.luuNhatKyKhoaVinhVien');
  }

  /**
   * UC58. Cấu hình tham số hệ thống (#16)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async luuNhatKyCapNhatThamSo(params = {}, conn = null) {
    throw new NotImplementedException('AuditLogDAO.luuNhatKyCapNhatThamSo');
  }

  /**
   * UC59. Phân quyền truy cập (RBAC) (#16)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async luuNhatKyPhanQuyen(params = {}, conn = null) {
    throw new NotImplementedException('AuditLogDAO.luuNhatKyPhanQuyen');
  }

  /**
   * UC60. Truy xuất nhật ký toàn cục (#3)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async truyVanNhatKyGanNhat(params = {}, conn = null) {
    throw new NotImplementedException('AuditLogDAO.truyVanNhatKyGanNhat');
  }

  /**
   * UC60. Truy xuất nhật ký toàn cục (#9)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async truyVanNhatKyTheoDieuKienLoc(params = {}, conn = null) {
    throw new NotImplementedException('AuditLogDAO.truyVanNhatKyTheoDieuKienLoc');
  }

  /**
   * UC60. Truy xuất nhật ký toàn cục (#17)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async truyVanChiTietBanGhiLog(params = {}, conn = null) {
    throw new NotImplementedException('AuditLogDAO.truyVanChiTietBanGhiLog');
  }

  /**
   * UC60. Truy xuất nhật ký toàn cục (#23)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async truyVanDuLieuXuatNhatKy(params = {}, conn = null) {
    throw new NotImplementedException('AuditLogDAO.truyVanDuLieuXuatNhatKy');
  }

  /**
   * UC61. Tạo tài khoản nhân sự mới (#12)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async luuNhatKyTaoTaiKhoan(params = {}, conn = null) {
    throw new NotImplementedException('AuditLogDAO.luuNhatKyTaoTaiKhoan');
  }

  /**
   * UC62. Cập nhật thông tin nhân sự (#14)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async luuNhatKyCapNhatNhanSu(params = {}, conn = null) {
    throw new NotImplementedException('AuditLogDAO.luuNhatKyCapNhatNhanSu');
  }
}

module.exports = AuditLogDAO;
