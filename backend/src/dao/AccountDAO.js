'use strict';
const BaseDAO = require('./BaseDAO');
const { NotImplementedException } = require('../exceptions');

class AccountDAO extends BaseDAO {
  /**
   * UC1. Đăng ký tài khoản (#5)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async kiemTraTenTaiKhoan(params = {}, conn = null) {
    throw new NotImplementedException('AccountDAO.kiemTraTenTaiKhoan');
  }

  /**
   * UC1. Đăng ký tài khoản (#12)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async taoTaiKhoanMoi(params = {}, conn = null) {
    throw new NotImplementedException('AccountDAO.taoTaiKhoanMoi');
  }

  /**
   * UC2. Đăng nhập hệ thống (#3)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async kiemTraTaiKhoan(params = {}, conn = null) {
    throw new NotImplementedException('AccountDAO.kiemTraTaiKhoan');
  }

  /**
   * UC4. Cập nhật hồ sơ cá nhân (#4)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async capNhatTenHienThi(params = {}, conn = null) {
    throw new NotImplementedException('AccountDAO.capNhatTenHienThi');
  }

  /**
   * UC4. Cập nhật hồ sơ cá nhân (#12)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async capNhatDuongDanAnh(params = {}, conn = null) {
    throw new NotImplementedException('AccountDAO.capNhatDuongDanAnh');
  }

  /**
   * UC5. Thay đổi mật khẩu tài khoản (#3)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async layMatKhauHienTai(params = {}, conn = null) {
    throw new NotImplementedException('AccountDAO.layMatKhauHienTai');
  }

  /**
   * UC5. Thay đổi mật khẩu tài khoản (#10)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async capNhatMatKhauMoi(params = {}, conn = null) {
    throw new NotImplementedException('AccountDAO.capNhatMatKhauMoi');
  }

  /**
   * UC42. Tra cứu lịch sử tài khoản (#3)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async truyVanThongTinVaLichSuTaiKhoan(params = {}, conn = null) {
    throw new NotImplementedException('AccountDAO.truyVanThongTinVaLichSuTaiKhoan');
  }

  /**
   * UC44. Tạm khóa tài khoản vi phạm (#5)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async capNhatTrangThaiTamKhoaTaiKhoan(params = {}, conn = null) {
    throw new NotImplementedException('AccountDAO.capNhatTrangThaiTamKhoaTaiKhoan');
  }

  /**
   * UC45. Khóa vĩnh viễn tài khoản (#5)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async capNhatTrangThaiBanned(params = {}, conn = null) {
    throw new NotImplementedException('AccountDAO.capNhatTrangThaiBanned');
  }
}

module.exports = AccountDAO;
