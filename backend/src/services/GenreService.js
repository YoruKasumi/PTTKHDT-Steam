'use strict';
const BaseService = require('./BaseService');
const GenreDAO = require('../dao/GenreDAO');
const AuditLogService = require('./AuditLogService');
const { ConflictException, NotFoundException, ValidationException } = require('../exceptions');

class GenreService extends BaseService {
  constructor() {
    super();
    this.genreDAO = new GenreDAO();
    this.auditLogService = new AuditLogService();
  }

  async yeuCauThemTheLoai(params = {}) {
    const data = this.validateGenre(params);
    return this.transaction(async (conn) => {
      if (await this.genreDAO.kiemTraTrungLapTenTheLoai({ genreName: data.genreName }, conn)) {
        throw new ConflictException('Tên thể loại đã tồn tại');
      }
      const genre = await this.genreDAO.taoTheLoaiMoi(data, conn);
      await this.auditLogService.recordLog({
        accountId: params.user?.accountId || params.accountId,
        action: 'GENRE_CREATE',
        target: `GENRE:${genre.GenreID}`,
        detail: JSON.stringify(data),
      }, conn);
      return genre;
    });
  }

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
        accountId: params.user?.accountId || params.accountId,
        action: 'GENRE_UPDATE',
        target: `GENRE:${params.genreId}`,
        detail: JSON.stringify({ previousName: current.GenreName, ...data }),
      }, conn);
      return { genreId: params.genreId, ...data };
    });
  }

  async yeuCauXoaTheLoai(params = {}) {
    return this.transaction(async (conn) => {
      const genre = await this.genreDAO.layTheLoaiTheoId({ genreId: params.genreId }, conn);
      if (!genre) throw new NotFoundException('Không tìm thấy thể loại');
      if (await this.genreDAO.kiemTraRangBuocGameDangDung({ genreId: params.genreId }, conn)) {
        throw new ConflictException('Không thể xóa thể loại đang được gán cho game');
      }
      await this.genreDAO.xoaTheLoai({ genreId: params.genreId }, conn);
      await this.auditLogService.recordLog({
        accountId: params.user?.accountId || params.accountId,
        action: 'GENRE_DELETE',
        target: `GENRE:${params.genreId}`,
        detail: JSON.stringify({ genreName: genre.GenreName }),
      }, conn);
      return { genreId: params.genreId, deleted: true };
    });
  }

  async layDanhSachTheLoai(params = {}) {
    return this.listGenres(params);
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
