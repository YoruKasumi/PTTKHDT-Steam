'use strict';
const BaseService = require('./BaseService');
const AuditLogDAO = require('../dao/AuditLogDAO');
const { NotFoundException, ValidationException } = require('../exceptions');

/**
 * AuditLogService - tầng Business Logic.
 * Tên phương thức lấy đúng từ sơ đồ sequence; nội dung bên dưới chỉ là khung cần cài đặt.
 */
class AuditLogService extends BaseService {
  constructor() {
    super();
    this.auditLogDAO = new AuditLogDAO();
  }

  // ---------------------------------------------------------------- Phương thức công khai (Route / Service khác gọi)

  /**
   * UC39. Phê duyệt phát hành game - sequence #9: Service khác → AuditLogService
   * UC40. Từ chối phát hành game - sequence #10: Service khác → AuditLogService
   * UC41. Gỡ bỏ game khẩn cấp - sequence #7: Service khác → AuditLogService
   * UC43. Xử lý đánh giá vi phạm - sequence #7: Service khác → AuditLogService
   * UC44. Tạm khóa tài khoản vi phạm - sequence #7: Service khác → AuditLogService
   * UC45. Khóa vĩnh viễn tài khoản - sequence #7: Service khác → AuditLogService
   * UC58. Cấu hình tham số hệ thống - sequence #15: Service khác → AuditLogService
   * UC59. Phân quyền truy cập (RBAC) - sequence #15: Service khác → AuditLogService
   * UC61. Tạo tài khoản nhân sự mới - sequence #11: Service khác → AuditLogService
   * UC62. Cập nhật thông tin nhân sự - sequence #13: Service khác → AuditLogService
   * @param {object} params
   */
  async ghiNhanNhatKyQuanTri(params = {}) {
    return this.recordLog(params);
  }

  async recordLog(params = {}, conn = null) {
    if (!params.accountId || !params.action || !params.target) {
      throw new ValidationException('Cần có tài khoản, hành động và đối tượng để ghi nhật ký');
    }
    return this.auditLogDAO.recordLog(params, conn);
  }

  /**
   * UC60. Truy xuất nhật ký toàn cục - sequence #2: UI → AuditLogService
   * Vai trò gọi: Admin
   * Luồng theo sơ đồ:
   *   #3 → AuditLogDAO.truyVanNhatKyGanNhat()
   *   #4 ← traVeDanhSachNhatKyGanNhat()
   *   #5 ← traVeDuLieuNhatKyGanNhat()
   * @param {object} params
   */
  async yeuCauLayNhatKyGanNhat(params = {}) {
    return (await this.auditLogDAO.listLogs(this.validateFilters(params))).map((row) => this.toLogResponse(row));
  }

  /**
   * UC60. Truy xuất nhật ký toàn cục - sequence #8: UI → AuditLogService
   * Vai trò gọi: Admin
   * Luồng theo sơ đồ:
   *   #9 → AuditLogDAO.truyVanNhatKyTheoDieuKienLoc()
   *   #10 ← traVeKetQuaLocNhatKy()
   *   #11 ← thongBaoKhongCoBanGhiPhuHop()
   *   #13 ← traVeDanhSachKetQuaLoc()
   * @param {object} params
   */
  async guiYeuCauLocNhatKy(params = {}) {
    return (await this.auditLogDAO.listLogs(this.validateFilters(params))).map((row) => this.toLogResponse(row));
  }

  /**
   * UC60. Truy xuất nhật ký toàn cục - sequence #16: UI → AuditLogService
   * Vai trò gọi: Admin
   * Luồng theo sơ đồ:
   *   #17 → AuditLogDAO.truyVanChiTietBanGhiLog()
   *   #18 ← traVeChiTietBanGhiLog()
   *   #19 ← traVeChiTietBanGhiLog()
   * @param {object} params
   */
  async yeuCauChiTietBanGhiLog(params = {}) {
    const row = await this.auditLogDAO.truyVanChiTietBanGhiLog(params);
    if (!row) throw new NotFoundException('Không tìm thấy nhật ký');
    return this.toLogResponse(row);
  }

  toLogResponse(row) {
    return {
      logId: row.LogID,
      accountId: row.AccountID,
      username: row.Username,
      action: row.Action,
      target: row.Target,
      logAt: row.LogAt,
      detail: row.Detail,
    };
  }

  validateFilters(params = {}) {
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;
    for (const field of ['fromDate', 'toDate']) {
      if (params[field] && (!datePattern.test(params[field]) || Number.isNaN(Date.parse(`${params[field]}T00:00:00Z`)))) {
        throw new ValidationException(`${field} phải theo định dạng YYYY-MM-DD`);
      }
    }
    if (params.fromDate && params.toDate && params.fromDate > params.toDate) {
      throw new ValidationException('fromDate không được sau toDate');
    }
    if (params.action && String(params.action).length > 100) {
      throw new ValidationException('Action tối đa 100 ký tự');
    }
    return params;
  }

  /**
   * UC60. Truy xuất nhật ký toàn cục - sequence #22: UI → AuditLogService
   * Vai trò gọi: Admin
   * Luồng theo sơ đồ:
   *   #23 → AuditLogDAO.truyVanDuLieuXuatNhatKy()
   *   #24 ← traVeDuLieuXuatNhatKy()
   *   #25 ↻ this.chuyenCheDoNenTepNgam()
   *   #26 ← thongBaoDangXuLyNenTep()
   *   #28 ↻ this.taoTepTinBaoCaoNhatKy()
   *   #29 ← traVeTepNhatKySanSang()
   * @param {object} params
   */
  async yeuCauKetXuatTepNhatKy(params = {}) {
    throw new NotImplementedException('AuditLogService.yeuCauKetXuatTepNhatKy');
  }

  // ---------------------------------------------------------------- Phương thức nội bộ (self-call trong sơ đồ)

  /**
   * UC60. Truy xuất nhật ký toàn cục - sequence #25: nội bộ
   * @param {object} params
   */
  async chuyenCheDoNenTepNgam(params = {}) {
    throw new NotImplementedException('AuditLogService.chuyenCheDoNenTepNgam');
  }

  /**
   * UC60. Truy xuất nhật ký toàn cục - sequence #28: nội bộ
   * @param {object} params
   */
  async taoTepTinBaoCaoNhatKy(params = {}) {
    throw new NotImplementedException('AuditLogService.taoTepTinBaoCaoNhatKy');
  }
}

module.exports = AuditLogService;
