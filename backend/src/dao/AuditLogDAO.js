'use strict';
const BaseDAO = require('./BaseDAO');

class AuditLogDAO extends BaseDAO {
  async recordLog(params = {}, conn = null) {
    await this.query(
      'INSERT INTO AUDITLOG (AccountID, Action, Target, Detail) VALUES (?, ?, ?, ?)',
      [params.accountId, params.action, params.target, params.detail || null],
      conn,
    );
  }

  async listLogs(params = {}, conn = null) {
    const conditions = [];
    const values = [];
    if (params.accountId) {
      conditions.push('log.AccountID = ?');
      values.push(params.accountId);
    }
    if (params.action) {
      conditions.push('log.Action = ?');
      values.push(params.action);
    }
    if (params.fromDate) {
      conditions.push('log.LogAt >= ?');
      values.push(params.fromDate);
    }
    if (params.toDate) {
      conditions.push('log.LogAt < DATE_ADD(?, INTERVAL 1 DAY)');
      values.push(params.toDate);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const limit = Math.min(Math.max(Number(params.limit) || 100, 1), 500);
    return this.query(
      `SELECT log.LogID, log.AccountID, COALESCE(account.Username, 'System') AS Username,
              log.Action, log.Target, log.LogAt, log.Detail
       FROM AUDITLOG AS log
       LEFT JOIN ACCOUNT AS account ON account.AccountID = log.AccountID
       ${where}
       ORDER BY log.LogAt DESC
       LIMIT ?`,
      [...values, limit],
      conn,
    );
  }

  async truyVanChiTietBanGhiLog(params = {}, conn = null) {
    return this.one(
      `SELECT log.LogID, log.AccountID, COALESCE(account.Username, 'System') AS Username,
              log.Action, log.Target, log.LogAt, log.Detail
       FROM AUDITLOG AS log
       LEFT JOIN ACCOUNT AS account ON account.AccountID = log.AccountID
       WHERE log.LogID = ?
       LIMIT 1`,
      [params.logId],
      conn,
    );
  }

  async luuNhatKyPheDuyet(params = {}, conn = null) {
    return this.recordLog({
      accountId: params.staffId || params.accountId,
      action: 'APPROVE_GAME',
      target: `GAME:${params.gameId}`,
      detail: params.detail || null
    }, conn);
  }

  async luuNhatKyTuChoi(params = {}, conn = null) {
    return this.recordLog({
      accountId: params.staffId || params.accountId,
      action: 'REJECT_GAME',
      target: `GAME:${params.gameId}`,
      detail: params.reason || params.detail || null
    }, conn);
  }

  async luuNhatKyGoBoKhanCap(params = {}, conn = null) {
    return this.recordLog({
      accountId: params.staffId || params.accountId,
      action: 'EMERGENCY_DELIST',
      target: `GAME:${params.gameId}`,
      detail: params.reason || null
    }, conn);
  }

  async luuNhatKyXuLyDanhGia(params = {}, conn = null) {
    return this.recordLog({
      accountId: params.staffId || params.accountId,
      action: 'MODERATE_REVIEW',
      target: `REVIEW:${params.reviewId}`,
      detail: params.actionType || null
    }, conn);
  }

  async luuNhatKyTamKhoa(params = {}, conn = null) {
    return this.recordLog({
      accountId: params.staffId || params.accountId,
      action: 'SUSPEND_ACCOUNT',
      target: `ACCOUNT:${params.targetAccountId}`,
      detail: params.reason || null
    }, conn);
  }

  async luuNhatKyKhoaVinhVien(params = {}, conn = null) {
    return this.recordLog({
      accountId: params.staffId || params.accountId,
      action: 'BAN_ACCOUNT',
      target: `ACCOUNT:${params.targetAccountId}`,
      detail: params.reason || null
    }, conn);
  }

  async luuNhatKyCapNhatThamSo(params = {}, conn = null) {
    return this.recordLog({
      accountId: params.staffId || params.accountId,
      action: 'UPDATE_SYSTEM_PARAM',
      target: `PARAM:${params.paramKey}`,
      detail: params.paramValue || null
    }, conn);
  }

  async luuNhatKyPhanQuyen(params = {}, conn = null) {
    return this.recordLog({
      accountId: params.staffId || params.accountId,
      action: 'UPDATE_RBAC',
      target: `ROLE:${params.roleId}`,
      detail: JSON.stringify(params.permissions || {})
    }, conn);
  }

  async truyVanNhatKyGanNhat(params = {}, conn = null) {
    return this.listLogs(params, conn);
  }

  async truyVanNhatKyTheoDieuKienLoc(params = {}, conn = null) {
    return this.listLogs(params, conn);
  }

  async truyVanDuLieuXuatNhatKy(params = {}, conn = null) {
    return this.listLogs(params, conn);
  }

  async luuNhatKyTaoTaiKhoan(params = {}, conn = null) {
    return this.recordLog({
      accountId: params.staffId || params.accountId,
      action: 'CREATE_STAFF_ACCOUNT',
      target: `ACCOUNT:${params.createdAccountId}`,
      detail: params.role || null
    }, conn);
  }

  async luuNhatKyCapNhatNhanSu(params = {}, conn = null) {
    return this.recordLog({
      accountId: params.staffId || params.accountId,
      action: 'UPDATE_STAFF_ACCOUNT',
      target: `ACCOUNT:${params.targetAccountId}`,
      detail: JSON.stringify(params.data || {})
    }, conn);
  }
}

module.exports = AuditLogDAO;
