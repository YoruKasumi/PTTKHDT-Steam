'use strict';
const BaseService = require('./BaseService');
const { NotImplementedException } = require('../exceptions');
const BannerDAO = require('../dao/BannerDAO');

/**
 * BannerService - tầng Business Logic.
 * Tên phương thức lấy đúng từ sơ đồ sequence; nội dung bên dưới chỉ là khung cần cài đặt.
 */
class BannerService extends BaseService {
  constructor() {
    super();
    this.bannerDAO = new BannerDAO();
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
    throw new NotImplementedException('BannerService.guiThongTinBannerMoi');
  }

  // ---------------------------------------------------------------- Phương thức nội bộ (self-call trong sơ đồ)

  /**
   * UC49. Cấu hình banner trang chủ - sequence #5: nội bộ
   * @param {object} params
   */
  async kiemTraKichThuocVaDinhDang(params = {}) {
    throw new NotImplementedException('BannerService.kiemTraKichThuocVaDinhDang');
  }
}

module.exports = BannerService;
