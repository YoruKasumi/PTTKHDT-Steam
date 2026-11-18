'use strict';
const BaseDAO = require('./BaseDAO');
const { NotImplementedException } = require('../exceptions');

class StaffDAO extends BaseDAO {
  /**
   * UC61. Tạo tài khoản nhân sự mới (#5)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async kiemTraTrungLapEmailVaUsername(params = {}, conn = null) {
    throw new NotImplementedException('StaffDAO.kiemTraTrungLapEmailVaUsername');
  }

  /**
   * UC61. Tạo tài khoản nhân sự mới (#9)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async luuTaiKhoanNhanSuMoi(params = {}, conn = null) {
    throw new NotImplementedException('StaffDAO.luuTaiKhoanNhanSuMoi');
  }

  /**
   * UC62. Cập nhật thông tin nhân sự (#3)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async truyVanChiTietNhanSu(params = {}, conn = null) {
    throw new NotImplementedException('StaffDAO.truyVanChiTietNhanSu');
  }

  /**
   * UC62. Cập nhật thông tin nhân sự (#11)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async capNhatThongTinNhanSu(params = {}, conn = null) {
    throw new NotImplementedException('StaffDAO.capNhatThongTinNhanSu');
  }
}

module.exports = StaffDAO;
