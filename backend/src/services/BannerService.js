'use strict';
const BaseService = require('./BaseService');
const BannerDAO = require('../dao/BannerDAO');
const AuditLogService = require('./AuditLogService');
const { randomUUID } = require('node:crypto');
const { NotFoundException, ValidationException } = require('../exceptions');

/**
 * BannerService - tầng Business Logic.
 * Tên phương thức lấy đúng từ sơ đồ sequence; nội dung bên dưới chỉ là khung cần cài đặt.
 */
class BannerService extends BaseService {
  constructor() {
    super();
    this.bannerDAO = new BannerDAO();
    this.auditLogService = new AuditLogService();
  }

  // ---------------------------------------------------------------- Phương thức công khai (Route / Service khác gọi)

  /**
   * UC49. Cấu hình banner trang chủ - sequence #4: UI → BannerService
   * Vai trò gọi: Admin, Manager
   * Luồng theo sơ đồ:
   *   #5 ↻ this.kiemTraKichThuocVaDinhDang()
   *   #6 → StorageClient.luuTepAnhBanner()
   *   #7 ← traVeDuongDanAnh()
   *   #8 → BannerDAO.luuCauHinhBannerVaLichHienThi()
   *   #9 ← xacNhanLuuThanhCong()
   *   #10 ← thongBaoCauHinhThanhCong()
   * @param {object} params
   */
  async guiThongTinBannerMoi(params = {}) {
    const data = this.validateBanner(params);
    const bannerId = randomUUID();
    return this.transaction(async (conn) => {
      const banner = await this.bannerDAO.luuCauHinhBannerVaLichHienThi({
        ...data,
        bannerId,
        createdBy: params.user.accountId,
      }, conn);
      await this.auditLogService.recordLog({
        accountId: params.user.accountId,
        action: 'BANNER_CREATE',
        target: `BANNER:${bannerId}`,
        detail: JSON.stringify(data),
      }, conn);
      return this.toBannerResponse(banner);
    });
  }

  async listBanners() {
    return (await this.bannerDAO.listBanners()).map((banner) => this.toBannerResponse(banner));
  }

  async listActiveBanners() {
    return (await this.bannerDAO.listActiveBanners()).map((banner) => this.toBannerResponse(banner));
  }

  async updateBanner(params = {}) {
    const data = this.validateBanner(params);
    return this.transaction(async (conn) => {
      const current = await this.bannerDAO.layBannerTheoId({ bannerId: params.bannerId }, conn);
      if (!current) throw new NotFoundException('Không tìm thấy banner');
      await this.bannerDAO.capNhatBanner({ ...data, bannerId: params.bannerId }, conn);
      await this.auditLogService.recordLog({
        accountId: params.user.accountId,
        action: 'BANNER_UPDATE',
        target: `BANNER:${params.bannerId}`,
        detail: JSON.stringify(data),
      }, conn);
      return { bannerId: params.bannerId, ...data };
    });
  }

  async deleteBanner(params = {}) {
    return this.transaction(async (conn) => {
      const banner = await this.bannerDAO.layBannerTheoId({ bannerId: params.bannerId }, conn);
      if (!banner) throw new NotFoundException('Không tìm thấy banner');
      await this.bannerDAO.xoaBanner({ bannerId: params.bannerId }, conn);
      await this.auditLogService.recordLog({
        accountId: params.user.accountId,
        action: 'BANNER_DELETE',
        target: `BANNER:${params.bannerId}`,
        detail: JSON.stringify({ title: banner.Title }),
      }, conn);
      return { bannerId: params.bannerId, deleted: true };
    });
  }

  validateBanner(params = {}) {
    const imageUrl = typeof params.imageUrl === 'string' ? params.imageUrl.trim() : '';
    const linkUrl = typeof params.linkUrl === 'string' && params.linkUrl.trim() ? params.linkUrl.trim() : null;
    const title = typeof params.title === 'string' && params.title.trim() ? params.title.trim() : null;
    const startDate = params.startDate;
    const endDate = params.endDate;
    const sortOrder = Number(params.sortOrder ?? 0);
    const isActive = params.isActive === undefined ? true : params.isActive;
    const startAt = new Date(startDate);
    const endAt = new Date(endDate);
    if (!imageUrl || imageUrl.length > 255) throw new ValidationException('Ảnh banner (URL hoặc object key) là bắt buộc');
    if (linkUrl && linkUrl.length > 255) throw new ValidationException('Đường dẫn banner tối đa 255 ký tự');
    if (title && title.length > 150) throw new ValidationException('Tiêu đề banner tối đa 150 ký tự');
    if (!Number.isFinite(startAt.getTime()) || !Number.isFinite(endAt.getTime()) || endAt <= startAt) {
      throw new ValidationException('Thời gian kết thúc phải sau thời gian bắt đầu');
    }
    if (!Number.isInteger(sortOrder) || sortOrder < 0) throw new ValidationException('Thứ tự hiển thị phải là số nguyên không âm');
    if (typeof isActive !== 'boolean') throw new ValidationException('IsActive phải là boolean');
    return { imageUrl, linkUrl, title, startDate, endDate, sortOrder, isActive };
  }

  toBannerResponse(row) {
    return {
      bannerId: row.BannerID,
      imageUrl: row.ImageUrl,
      linkUrl: row.LinkUrl,
      title: row.Title,
      startDate: row.StartDate,
      endDate: row.EndDate,
      sortOrder: Number(row.SortOrder),
      isActive: Boolean(Number(row.IsActive)),
      ...(row.CreatedBy ? { createdBy: row.CreatedBy } : {}),
      ...(row.CreatedAt ? { createdAt: row.CreatedAt } : {}),
    };
  }

  // ---------------------------------------------------------------- Phương thức nội bộ (self-call trong sơ đồ)

  /**
   * UC49. Cấu hình banner trang chủ - sequence #5: nội bộ
   * @param {object} params
   */
  async kiemTraKichThuocVaDinhDang(params = {}) {
    return this.validateBanner(params);
  }
}

module.exports = BannerService;
