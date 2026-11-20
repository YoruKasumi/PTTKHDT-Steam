'use strict';
const path = require('path');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const BaseService = require('./BaseService');
const { NghiepVuException, NotFoundException, ConflictException, ValidationException } = require('../exceptions');
const GameDAO = require('../dao/GameDAO');
const StorageClient = require('../integrations/StorageClient');
const { validateAndProcessBuildZip } = require('../utils/autoDrmPackager');

/**
 * GameService — tầng Business Logic cho quản lý game.
 */
class GameService extends BaseService {
  constructor() {
    super();
    this.gameDAO = new GameDAO();
    this.storageClient = new StorageClient();
  }

  // ─── Phương thức công khai (Route / Service khác gọi) ───────────────────

  /**
   * UC9 / UC11. Kiểm tra bản quyền sản phẩm.
   */
  async kiemTraBanQuyenSanPham(params = {}) {
    throw new NghiepVuException('Chưa cài đặt: GameService.kiemTraBanQuyenSanPham', 501);
  }

  /**
   * UC15. Cấp phát bản quyền sau thanh toán.
   */
  async capPhatBanQuyen(params = {}) {
    throw new NghiepVuException('Chưa cài đặt: GameService.capPhatBanQuyen', 501);
  }

  /**
   * UC24/25. Kiểm tra thông tin game (upload sơ bộ, chưa commit vào DB).
   * Cho phép Developer đính kèm file .zip và cung cấp metadata.
   */
  async kiemTraThongTinGame(params = {}) {
    throw new NghiepVuException('Chưa cài đặt: GameService.kiemTraThongTinGame', 501);
  }

  /**
   * UC24. Gửi gói cập nhật (uploadPatch) — Tạo phiên bản mới.
   * Nếu game đã Approved, tự động bọc DRM.
   *
   * @param {object} params
   * @param {string} params.gameId
   * @param {string} params.versionNumber   - Phiên bản mới (VD: "1.1.0")
   * @param {string} params.changeLog
   * @param {string} params.tempFilePath    - Đường dẫn tạm từ multer
   * @param {object} params.user            - { accountId }
   */
  async guiGoiCapNhat(params = {}) {
    const { gameId, versionNumber, changeLog, tempFilePath, user } = params;

    if (!gameId || !versionNumber || !tempFilePath) {
      throw new ValidationException('Thiếu gameId, versionNumber hoặc tệp build.');
    }

    // Lấy thông tin game
    const game = await this.gameDAO.truyVanThongTinGame({ gameId, developerId: user.accountId });
    if (!game) throw new NotFoundException('Không tìm thấy game hoặc bạn không phải chủ sở hữu.');

    // Kiểm tra & xử lý file zip
    const buildInfo = await validateAndProcessBuildZip({ tempFilePath, gameId, versionNumber });

    // Auto-DRM nếu game đã Approved
    let finalFileSize = buildInfo.fileSize;
    let finalSha256 = buildInfo.sha256;
    let autoWrapped = false;

    if (game.Status === 'Approved') {
      const { ensureDrmWrappedOnApprove } = require('../utils/autoDrmPackager');
      const drmResult = await ensureDrmWrappedOnApprove({
        gameId, versionId: null, versionNumber, gameTitle: game.Title,
      });
      finalFileSize = drmResult.fileSize;
      finalSha256 = drmResult.sha256;
      autoWrapped = drmResult.autoWrapped;
    }

    // Ghi DB trong transaction
    await this.transaction(async (conn) => {
      // Bắt buộc: reset IsCurrent = 0 trước
      await this.gameDAO.resetCurrentVersion({ gameId }, conn);
      // Insert bản mới
      await this.gameDAO.capNhatPhienBanMoi({
        gameId, versionNumber,
        buildFile: buildInfo.buildFileKey,
        fileSize: finalFileSize,
        sha256: finalSha256,
        changeLog,
      }, conn);
    });

    return {
      gameId,
      versionNumber,
      fileSize: finalFileSize,
      sha256: finalSha256,
      autoWrapped,
      message: `Đã upload phiên bản ${versionNumber} thành công.`,
    };
  }

  /**
   * UC25. Gửi yêu cầu quét virus (mô phỏng).
   */
  async guiYeuCauQuetVirus(params = {}) {
    // Mô phỏng: trả về "clean"
    return { result: 'clean', scannedAt: new Date().toISOString() };
  }

  /**
   * UC25. Lưu hồ sơ dự án game mới (cùng phiên bản 1.0.0).
   *
   * @param {object} params
   * @param {string} params.title
   * @param {string} params.description
   * @param {number} params.price
   * @param {string} params.minSpec
   * @param {string} params.recSpec
   * @param {string[]} params.genreIds
   * @param {string} params.versionNumber
   * @param {string} params.changeLog
   * @param {string} params.tempFilePath
   * @param {object} params.user  - { accountId }
   */
  async luuHoSoDuAnGame(params = {}) {
    const { title, description, price, minSpec, recSpec, genreIds, versionNumber = '1.0.0', changeLog, tempFilePath, user } = params;

    // Validation
    if (!title || !title.trim()) throw new ValidationException('Tên game là bắt buộc.');
    if (!description || !description.trim()) throw new ValidationException('Mô tả game là bắt buộc.');
    if (!tempFilePath) throw new ValidationException('Tệp build .zip là bắt buộc.');
    if (typeof price !== 'number' || price < 0) throw new ValidationException('Giá bán phải là số không âm.');

    // Kiểm tra tên trùng
    const duplicate = await this.gameDAO.kiemTraTenGameTrungLap({ title: title.trim() });
    if (duplicate) throw new ConflictException(`Tên game "${title.trim()}" đã tồn tại trên hệ thống.`);

    // Sinh GameID mới
    const gameId = uuidv4();

    // Kiểm tra & xử lý file zip
    const buildInfo = await validateAndProcessBuildZip({ tempFilePath, gameId, versionNumber });

    // Ghi DB trong transaction
    await this.transaction(async (conn) => {
      await this.gameDAO.taoBanGhiDuAnMoi({
        gameId,
        developerId: user.accountId,
        title: title.trim(),
        description: description.trim(),
        price,
        coverImage: params.coverImage || '',
        trailerUrl: params.trailerUrl || null,
        minSpec: minSpec || '',
        recSpec: recSpec || '',
        genreIds: genreIds || [],
        versionNumber,
        buildFile: buildInfo.buildFileKey,
        fileSize: buildInfo.fileSize,
        sha256: buildInfo.sha256,
        changeLog: changeLog || null,
      }, conn);
    });

    return {
      gameId,
      title: title.trim(),
      versionNumber,
      fileSize: buildInfo.fileSize,
      sha256: buildInfo.sha256,
      hasManifest: buildInfo.hasManifest,
      hasDrmJs: buildInfo.hasDrmJs,
      status: 'Pending',
      message: 'Dự án game đã được khởi tạo. Vui lòng chờ phê duyệt từ Manager.',
    };
  }

  /**
   * UC26. Yêu cầu thiết lập giá bán VND.
   */
  async yeuCauThietLapGia(params = {}) {
    throw new NghiepVuException('Chưa cài đặt: GameService.yeuCauThietLapGia', 501);
  }

  /**
   * UC29. Yêu cầu rollback phiên bản — Lấy danh sách các bản build lưu trữ.
   * @param {{ gameId: string, user: object }} params
   */
  async yeuCauRollbackPhienBan(params = {}) {
    const { gameId, user } = params;
    if (!gameId) throw new ValidationException('Thiếu gameId.');

    const versions = await this.gameDAO.kiemTraDanhSachPhienBanLuuTru({ gameId, developerId: user.accountId });
    if (!versions || versions.length < 2) {
      throw new NghiepVuException('Cần có ít nhất 2 phiên bản build để thực hiện Rollback.', 422);
    }

    return versions.map((v) => ({
      versionId: v.VersionID,
      versionNumber: v.VersionNumber,
      buildFile: v.BuildFile,
      fileSize: Number(v.FileSize),
      sha256: v.Sha256,
      changeLog: v.ChangeLog,
      uploadDate: v.UploadDate,
      isCurrent: Boolean(v.IsCurrent),
    }));
  }

  /**
   * UC29. Xác nhận khôi phục phiên bản cũ.
   * @param {{ gameId: string, versionId: string, user: object }} params
   */
  async xacNhanKhoiPhucPhienBan(params = {}) {
    const { gameId, versionId, user } = params;
    if (!gameId || !versionId) throw new ValidationException('Thiếu gameId hoặc versionId.');

    const versions = await this.gameDAO.kiemTraDanhSachPhienBanLuuTru({ gameId, developerId: user.accountId });
    if (!versions || versions.length < 2) {
      throw new NghiepVuException('Cần có ít nhất 2 phiên bản build để thực hiện Rollback.', 422);
    }

    const target = versions.find((v) => v.VersionID === versionId);
    if (!target) throw new NotFoundException('Không tìm thấy phiên bản cần rollback.');
    if (Boolean(target.IsCurrent)) throw new NghiepVuException('Phiên bản này đã là bản hiện hành.', 422);

    // Kiểm tra file build tồn tại trên đĩa
    const { BUILDS_ROOT } = require('../utils/autoDrmPackager');
    const path = require('path');
    const fs = require('fs');
    const buildPath = path.join(BUILDS_ROOT, 'games', gameId, target.VersionNumber, 'build.zip');
    if (!fs.existsSync(buildPath)) {
      throw new NghiepVuException(`Tệp build phiên bản ${target.VersionNumber} không còn tồn tại trên đĩa.`, 422);
    }

    // Thực hiện rollback trong transaction
    await this.transaction(async (conn) => {
      await this.gameDAO.resetCurrentVersion({ gameId }, conn);
      await this.gameDAO.capNhatPhienBanHienTai({ versionId }, conn);
    });

    return {
      gameId,
      versionId,
      versionNumber: target.VersionNumber,
      message: `Đã rollback về phiên bản ${target.VersionNumber}.`,
    };
  }

  /**
   * UC34. Yêu cầu cập nhật trạng thái game.
   */
  async yeuCauCapNhatTrangThaiGame(params = {}) {
    throw new NghiepVuException('Chưa cài đặt: GameService.yeuCauCapNhatTrangThaiGame', 501);
  }

  /**
   * UC35. Yêu cầu gỡ game.
   */
  async yeuCauGoGame(params = {}) {
    throw new NghiepVuException('Chưa cài đặt: GameService.yeuCauGoGame', 501);
  }

  /**
   * UC35. Thực hiện gỡ game khỏi hệ thống.
   */
  async thucHienGoGameKhoiHeThong(params = {}) {
    throw new NghiepVuException('Chưa cài đặt: GameService.thucHienGoGameKhoiHeThong', 501);
  }

  /**
   * UC36. Ẩn game.
   */
  async yeuCauAnGame(params = {}) {
    throw new NghiepVuException('Chưa cài đặt: GameService.yeuCauAnGame', 501);
  }

  // ─── Phương thức nội bộ ──────────────────────────────────────────────────

  async kiemTraGiaBanHopLe(params = {}) {
    throw new NghiepVuException('Chưa cài đặt: GameService.kiemTraGiaBanHopLe', 501);
  }

  async kiemTraChuyenDoiHopLe(params = {}) {
    throw new NghiepVuException('Chưa cài đặt: GameService.kiemTraChuyenDoiHopLe', 501);
  }
}

module.exports = GameService;
