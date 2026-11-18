'use strict';
const BaseService = require('./BaseService');
const { NotImplementedException } = require('../exceptions');
const GenreDAO = require('../dao/GenreDAO');

/**
 * GenreService - tầng Business Logic.
 * Tên phương thức lấy đúng từ sơ đồ sequence; nội dung bên dưới chỉ là khung cần cài đặt.
 */
class GenreService extends BaseService {
  constructor() {
    super();
    this.genreDAO = new GenreDAO();
  }

  // ---------------------------------------------------------------- Phương thức công khai (Route / Service khác gọi)

  /**
   * UC48. Quản lý danh mục thể loại - sequence #3: UI → GenreService
   * Vai trò gọi: Admin, Manager
   * Luồng theo sơ đồ:
   *   #4 → GenreDAO.kiemTraTrungLapTenTheLoai()
   *   #5 ← traVeKetQuaKiemTra()
   *   #8 → GenreDAO.taoTheLoaiMoi()
   *   #9 ← xacNhanTaoThanhCong()
   *   #10 ← thongBaoThemThanhCong()
   * @param {object} params
   */
  async yeuCauThemTheLoai(params = {}) {
    throw new NotImplementedException('GenreService.yeuCauThemTheLoai');
  }

  /**
   * UC48. Quản lý danh mục thể loại - sequence #13: UI → GenreService
   * Vai trò gọi: Admin, Manager
   * Luồng theo sơ đồ:
   *   #14 → GenreDAO.kiemTraTrungLapTenMoi()
   *   #15 ← traVeKetQuaKiemTra()
   *   #18 → GenreDAO.capNhatTheLoai()
   *   #19 ← xacNhanCapNhatThanhCong()
   *   #20 ← thongBaoSuaThanhCong()
   * @param {object} params
   */
  async yeuCauSuaTheLoai(params = {}) {
    throw new NotImplementedException('GenreService.yeuCauSuaTheLoai');
  }

  /**
   * UC48. Quản lý danh mục thể loại - sequence #23: UI → GenreService
   * Vai trò gọi: Admin, Manager
   * Luồng theo sơ đồ:
   *   #24 → GenreDAO.kiemTraRangBuocGameDangDung()
   *   #25 ← traVeKetQuaRangBuoc()
   *   #28 → GenreDAO.xoaTheLoai()
   *   #29 ← xacNhanXoaThanhCong()
   *   #30 ← thongBaoXoaThanhCong()
   * @param {object} params
   */
  async yeuCauXoaTheLoai(params = {}) {
    throw new NotImplementedException('GenreService.yeuCauXoaTheLoai');
  }
}

module.exports = GenreService;
