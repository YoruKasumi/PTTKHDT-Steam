'use strict';
const BaseService = require('./BaseService');
const SystemConfigDAO = require('../dao/SystemConfigDAO');
const AuditLogService = require('./AuditLogService');
const { ValidationException } = require('../exceptions');

const PARAMETER_RULES = {
  REFUND_WINDOW_HOURS: { min: 1, max: 720, integer: true, description: 'Thời hạn hoàn tiền (giờ)' },
  MAX_KEYS_PER_BATCH: { min: 1, max: 1000, integer: true, description: 'Số key tối đa mỗi lần sinh' },
  MAX_UNUSED_KEYS_PER_GAME: { min: 1, max: 100000, integer: true, description: 'Số key chưa kích hoạt tối đa mỗi game' },
  DEVELOPER_FEE_VND: { min: 1, integer: true, description: 'Phí Steam Direct (VND)' },
  MIN_DEPOSIT_VND: { min: 1, integer: true, description: 'Số tiền nạp tối thiểu' },
  PLATFORM_COMMISSION_PERCENT: { min: 0, max: 50, description: 'Tỷ lệ hoa hồng sàn (%)' },
  MIN_WITHDRAWAL_VND: { min: 1, integer: true, description: 'Hạn mức rút tiền tối thiểu (VND)' },
  MAX_BUILD_FILE_BYTES: { min: 1, integer: true, description: 'Dung lượng build tối đa (byte)' },
};

/**
 * SystemConfigService - tầng Business Logic.
 * Tên phương thức lấy đúng từ sơ đồ sequence; nội dung bên dưới chỉ là khung cần cài đặt.
 */
class SystemConfigService extends BaseService {
  constructor() {
    super();
    this.systemConfigDAO = new SystemConfigDAO();
    this.auditLogService = new AuditLogService();
  }

  // ---------------------------------------------------------------- Phương thức công khai (Route / Service khác gọi)

  /**
   * UC58. Cấu hình tham số hệ thống - sequence #2: UI → SystemConfigService
   * Vai trò gọi: Admin
   * Luồng theo sơ đồ:
   *   #3 → SystemConfigDAO.truyVanThamSoToanCuc()
   *   #4 ← traVeDanhSachThamSo()
   *   #5 ← traVeDuLieuThamSo()
   * @param {object} params
   */
  async yeuCauLayDanhSachThamSo(params = {}) {
    const rows = await this.systemConfigDAO.truyVanThamSoToanCuc();
    return rows.map((row) => ({
      key: row.ParamKey,
      value: row.ParamValue,
      description: row.Description,
      updatedBy: row.UpdatedBy,
      updatedAt: row.UpdatedAt,
    }));
  }

  /**
   * UC58. Cấu hình tham số hệ thống - sequence #8: UI → SystemConfigService
   * Vai trò gọi: Admin
   * Luồng theo sơ đồ:
   *   #9 ↻ this.kiemTraTinhHopLeCuaThamSo()
   *   #10 ← thongBaoThamSoKhongHopLe()
   *   #12 → SystemConfigDAO.capNhatThamSoMoi()
   *   #13 ← xacNhanCapNhatThanhCong()
   *   #14 ↻ this.xoaBoNhoDemToanCuc()
   *   #15 → AuditLogService.ghiNhanNhatKyQuanTri
   *   #16 → AuditLogDAO.luuNhatKyCapNhatThamSo()
   *   #17 ← xacNhanLuuNhatKyThanhCong()
   *   #18 ← hoanTatGhiNhatKy()
   *   #19 ← thongBaoCapNhatThanhCong()
   * @param {object} params
   */
  async guiYeuCauCapNhatThamSo(params = {}) {
    const parameters = params.parameters;
    if (!Array.isArray(parameters) || !parameters.length) {
      throw new ValidationException('Cần gửi ít nhất một tham số để cập nhật');
    }
    const normalized = parameters.map((item) => this.validateParameter(item));
    if (new Set(normalized.map((item) => item.key)).size !== normalized.length) {
      throw new ValidationException('Không được gửi trùng mã tham số');
    }
    return this.transaction(async (conn) => {
      const saved = [];
      for (const parameter of normalized) {
        const row = await this.systemConfigDAO.capNhatThamSoMoi({
          ...parameter,
          updatedBy: params.user.accountId,
        }, conn);
        saved.push({
          key: row.ParamKey,
          value: row.ParamValue,
          description: row.Description,
          updatedAt: row.UpdatedAt,
        });
        await this.auditLogService.recordLog({
          accountId: params.user.accountId,
          action: 'SYSTEM_CONFIG_UPDATE',
          target: `SYSTEM_PARAMETER:${parameter.key}`,
          detail: JSON.stringify({ value: parameter.value }),
        }, conn);
      }
      return saved;
    });
  }

  // ---------------------------------------------------------------- Phương thức nội bộ (self-call trong sơ đồ)

  /**
   * UC58. Cấu hình tham số hệ thống - sequence #9: nội bộ
   * @param {object} params
   */
  async kiemTraTinhHopLeCuaThamSo(params = {}) {
    return this.validateParameter(params);
  }

  /**
   * UC58. Cấu hình tham số hệ thống - sequence #14: nội bộ
   * @param {object} params
   */
  async xoaBoNhoDemToanCuc(params = {}) {
    return { cacheEnabled: false };
  }

  validateParameter(params = {}) {
    const key = typeof params.key === 'string' ? params.key.trim() : '';
    const rule = PARAMETER_RULES[key];
    if (!rule) throw new ValidationException(`Tham số ${key || '(trống)'} không được hỗ trợ`);
    const numericValue = Number(params.value);
    if (!Number.isFinite(numericValue) || numericValue < rule.min
      || (rule.max !== undefined && numericValue > rule.max)
      || (rule.integer && !Number.isSafeInteger(numericValue))) {
      const upperBound = rule.max === undefined ? '' : ` và không lớn hơn ${rule.max}`;
      throw new ValidationException(`${key} phải là số từ ${rule.min}${upperBound}`);
    }
    return {
      key,
      value: String(numericValue),
      description: params.description || rule.description,
    };
  }
}

module.exports = SystemConfigService;
