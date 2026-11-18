'use strict';
const { NotImplementedException } = require('../exceptions');

/**
 * Kho lưu trữ file (ảnh, gói cài đặt game). Driver local hoặc Cloudflare R2 (S3) - xem config/storage.js.
 * Tên hàm lấy từ sơ đồ sequence.
 */
class StorageClient {
  /**
   * UC4. Cập nhật hồ sơ cá nhân (#10)
   */
  async luuAnhDaiDien(params = {}) {
    throw new NotImplementedException('StorageClient.luuAnhDaiDien');
  }

  /**
   * UC24. Cập nhật Patch & Changelog (#10)
   */
  async luuTruBanVa(params = {}) {
    throw new NotImplementedException('StorageClient.luuTruBanVa');
  }

  /**
   * UC25. Khởi tạo dự án game mới (#7)
   */
  async taiLenTepCaiDatTam(params = {}) {
    throw new NotImplementedException('StorageClient.taiLenTepCaiDatTam');
  }

  /**
   * UC49. Cấu hình banner trang chủ (#6)
   */
  async luuTepAnhBanner(params = {}) {
    throw new NotImplementedException('StorageClient.luuTepAnhBanner');
  }
}

module.exports = StorageClient;
