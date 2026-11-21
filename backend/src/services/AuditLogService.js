'use strict';
const BaseService = require('./BaseService');
const AuditLogDAO = require('../dao/AuditLogDAO');
const { NotFoundException, ValidationException } = require('../exceptions');

class AuditLogService extends BaseService {
  constructor() {
    super();
    this.auditLogDAO = new AuditLogDAO();
  }

  async ghiNhanNhatKyQuanTri(params = {}) {
    return this.recordLog(params);
  }

  async recordLog(params = {}, conn = null) {
    if (!params.accountId || !params.action || !params.target) {
      throw new ValidationException('Cần có tài khoản, hành động và đối tượng để ghi nhật ký');
    }
    return this.auditLogDAO.recordLog(params, conn);
  }

  async yeuCauLayNhatKyGanNhat(params = {}) {
    return (await this.auditLogDAO.listLogs(this.validateFilters(params))).map((row) => this.toLogResponse(row));
  }

  async guiYeuCauLocNhatKy(params = {}) {
    return (await this.auditLogDAO.listLogs(this.validateFilters(params))).map((row) => this.toLogResponse(row));
  }

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

  async yeuCauKetXuatTepNhatKy(params = {}) {
    const logs = await this.auditLogDAO.listLogs(this.validateFilters(params));
    return {
      reportId: 'AUDIT_EXPORT_' + Date.now(),
      exportedAt: new Date().toISOString(),
      totalRecords: logs.length,
      records: logs.map(this.toLogResponse)
    };
  }

  async chuyenCheDoNenTepNgam(params = {}) {
    return { status: 'background_compressed' };
  }

  async taoTepTinBaoCaoNhatKy(params = {}) {
    return { status: 'created', fileName: `audit_log_${Date.now()}.csv` };
  }
}

module.exports = AuditLogService;
