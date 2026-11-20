'use strict';
const path = require('path');
const fs = require('fs');
const { NotImplementedException } = require('../exceptions');

const BUILDS_ROOT = path.resolve(__dirname, '../../storage/builds');

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
   * Lưu build.zip tại đường dẫn games/<gameId>/<versionNumber>/build.zip
   * và trả về object key (không phải path tuyệt đối).
   * @param {object} params
   * @param {string} params.tempFilePath  - Đường dẫn tạm (multer)
   * @param {string} params.gameId
   * @param {string} params.versionNumber
   * @returns {Promise<{ buildFileKey: string, localPath: string }>}
   */
  async luuTruBanVa(params = {}) {
    const { tempFilePath, gameId, versionNumber } = params;
    const versionDir = path.join(BUILDS_ROOT, 'games', gameId, versionNumber);
    fs.mkdirSync(versionDir, { recursive: true });
    const dest = path.join(versionDir, 'build.zip');
    fs.copyFileSync(tempFilePath, dest);
    fs.unlinkSync(tempFilePath);
    return {
      buildFileKey: `games/${gameId}/${versionNumber}/build.zip`,
      localPath: dest,
    };
  }

  /**
   * UC25. Khởi tạo dự án game mới (#7)
   * Upload tạm: giữ nguyên tại vị trí multer để BLL xử lý tiếp.
   */
  async taiLenTepCaiDatTam(params = {}) {
    // BLL (GameService) gọi validateAndProcessBuildZip trực tiếp từ tempFilePath
    // nên hàm này chỉ cần pass-through.
    return { tempFilePath: params.tempFilePath };
  }

  /**
   * UC49. Cấu hình banner trang chủ (#6)
   */
  async luuTepAnhBanner(params = {}) {
    throw new NotImplementedException('StorageClient.luuTepAnhBanner');
  }

  /**
   * Lấy đường dẫn vật lý từ object key.
   * @param {string} objectKey  - VD: games/<gameId>/<version>/build.zip
   * @returns {string}
   */
  localPathFromKey(objectKey) {
    return path.join(BUILDS_ROOT, objectKey);
  }
}

module.exports = StorageClient;
