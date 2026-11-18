'use strict';
const BaseDAO = require('./BaseDAO');
const { NotImplementedException } = require('../exceptions');

class GenreDAO extends BaseDAO {
  /**
   * UC48. Quản lý danh mục thể loại (#4)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async kiemTraTrungLapTenTheLoai(params = {}, conn = null) {
    throw new NotImplementedException('GenreDAO.kiemTraTrungLapTenTheLoai');
  }

  /**
   * UC48. Quản lý danh mục thể loại (#8)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async taoTheLoaiMoi(params = {}, conn = null) {
    throw new NotImplementedException('GenreDAO.taoTheLoaiMoi');
  }

  /**
   * UC48. Quản lý danh mục thể loại (#14)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async kiemTraTrungLapTenMoi(params = {}, conn = null) {
    throw new NotImplementedException('GenreDAO.kiemTraTrungLapTenMoi');
  }

  /**
   * UC48. Quản lý danh mục thể loại (#18)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async capNhatTheLoai(params = {}, conn = null) {
    throw new NotImplementedException('GenreDAO.capNhatTheLoai');
  }

  /**
   * UC48. Quản lý danh mục thể loại (#24)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async kiemTraRangBuocGameDangDung(params = {}, conn = null) {
    throw new NotImplementedException('GenreDAO.kiemTraRangBuocGameDangDung');
  }

  /**
   * UC48. Quản lý danh mục thể loại (#28)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async xoaTheLoai(params = {}, conn = null) {
    throw new NotImplementedException('GenreDAO.xoaTheLoai');
  }
}

module.exports = GenreDAO;
