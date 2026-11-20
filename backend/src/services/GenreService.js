'use strict';
const BaseService = require('./BaseService');
const GenreDAO = require('../dao/GenreDAO');
const AuditLogService = require('./AuditLogService');
const { ConflictException, NotFoundException, ValidationException } = require('../exceptions');

/**
 * GenreService - tầng Business Logic.
 * Tên phương thức lấy đúng từ sơ đồ sequence; nội dung bên dưới chỉ là khung cần cài đặt.
 */
class GenreService extends BaseService {
  constructor() {
    super();
    this.genreDAO = new GenreDAO();
    this.auditLogService = new AuditLogService();
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
    const data = this.validateGenre(params);
    return this.transaction(async (conn) => {
      if (await this.genreDAO.kiemTraTrungLapTenTheLoai({ genreName: data.genreName }, conn)) {
        throw new ConflictException('Tên thể loại đã tồn tại');
      }
      const genre = await this.genreDAO.taoTheLoaiMoi(data, conn);
      await this.auditLogService.recordLog({
        accountId: params.user.accountId,
        action: 'GENRE_CREATE',
        target: `GENRE:${genre.GenreID}`,
        detail: JSON.stringify(data),
      }, conn);
      return genre;
    });
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
    const data = this.validateGenre(params);
    return this.transaction(async (conn) => {
      const current = await this.genreDAO.layTheLoaiTheoId({ genreId: params.genreId }, conn);
      if (!current) throw new NotFoundException('Không tìm thấy thể loại');
      if (await this.genreDAO.kiemTraTrungLapTenMoi({
        genreName: data.genreName,
        genreId: params.genreId,
      }, conn)) {
        throw new ConflictException('Tên thể loại đã tồn tại');
      }
      await this.genreDAO.capNhatTheLoai({ ...data, genreId: params.genreId }, conn);
      await this.auditLogService.recordLog({
        accountId: params.user.accountId,
        action: 'GENRE_UPDATE',
        target: `GENRE:${params.genreId}`,
        detail: JSON.stringify({ previousName: current.GenreName, ...data }),
      }, conn);
      return { genreId: params.genreId, ...data };
    });
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
    return this.transaction(async (conn) => {
      const genre = await this.genreDAO.layTheLoaiTheoId({ genreId: params.genreId }, conn);
      if (!genre) throw new NotFoundException('Không tìm thấy thể loại');
      if (await this.genreDAO.kiemTraRangBuocGameDangDung({ genreId: params.genreId }, conn)) {
        throw new ConflictException('Không thể xóa thể loại đang được gán cho game');
      }
      await this.genreDAO.xoaTheLoai({ genreId: params.genreId }, conn);
      await this.auditLogService.recordLog({
        accountId: params.user.accountId,
        action: 'GENRE_DELETE',
        target: `GENRE:${params.genreId}`,
        detail: JSON.stringify({ genreName: genre.GenreName }),
      }, conn);
      return { genreId: params.genreId, deleted: true };
    });
  }

  async listGenres() {
    return (await this.genreDAO.listGenres()).map((row) => ({
      genreId: row.GenreID,
      genreName: row.GenreName,
      description: row.Description,
    }));
  }

  validateGenre(params = {}) {
    const genreName = typeof params.genreName === 'string' ? params.genreName.trim() : '';
    const description = typeof params.description === 'string' ? params.description.trim() : '';
    if (!genreName || genreName.length > 80) {
      throw new ValidationException('Tên thể loại là bắt buộc và tối đa 80 ký tự');
    }
    if (description.length > 500) throw new ValidationException('Mô tả tối đa 500 ký tự');
    return { genreName, description };
  }
}

module.exports = GenreService;
