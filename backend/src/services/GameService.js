'use strict';
const path = require('node:path');
const fs = require('node:fs');
const crypto = require('node:crypto');
const { v4: uuidv4 } = require('uuid');
const BaseService = require('./BaseService');
const {
  NghiepVuException,
  NotFoundException,
  ConflictException,
  UnauthorizedException,
  ValidationException,
} = require('../exceptions');
const GameDAO = require('../dao/GameDAO');
const StorageClient = require('../integrations/StorageClient');
const { validateAndProcessBuildZip } = require('../utils/autoDrmPackager');
const { normalizeGameSlug } = require('../utils/gameSlug');
const {
  getGameVersionDir,
  getLegacyGameVersionDir,
} = require('../utils/storagePaths');

function sha256File(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(hash.digest('hex')));
  });
}

class GameService extends BaseService {
  constructor() {
    super();
    this.gameDAO = new GameDAO();
    this.storageClient = new StorageClient();
  }

  async kiemTraBanQuyenSanPham(params = {}) {
    throw new NghiepVuException('Chưa cài đặt: GameService.kiemTraBanQuyenSanPham', 501);
  }

  async capPhatBanQuyen(params = {}) {
    throw new NghiepVuException('Chưa cài đặt: GameService.capPhatBanQuyen', 501);
  }

  async kiemTraThongTinGame(params = {}) {
    throw new NghiepVuException('Chưa cài đặt: GameService.kiemTraThongTinGame', 501);
  }

  async guiGoiCapNhat(params = {}) {
    const { gameId, versionNumber, changeLog, tempFilePath, user } = params;

    if (!gameId || !versionNumber || !tempFilePath) {
      throw new ValidationException('Thiếu gameId, versionNumber hoặc tệp build.');
    }

    const game = await this.gameDAO.truyVanThongTinGame({ gameId, developerId: user.accountId });
    if (!game) throw new NotFoundException('Không tìm thấy game hoặc bạn không phải chủ sở hữu.');

    const duplicateVersion = await this.gameDAO.kiemTraPhienBanGame({ gameId, versionNumber });
    if (duplicateVersion) {
      if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
      throw new ConflictException(`Phiên bản ${versionNumber} đã tồn tại. Hãy chọn số phiên bản mới để giữ an toàn các file build cũ.`);
    }

    const slug = normalizeGameSlug(game.Slug, game.Title);
    const buildInfo = await validateAndProcessBuildZip({
      tempFilePath, developerId: game.DeveloperID, gameId, versionNumber,
    });

    let finalFileSize = buildInfo.fileSize;
    let finalSha256 = buildInfo.sha256;
    let autoWrapped = false;

    if (game.Status === 'Approved') {
      const { ensureDrmWrappedOnApprove } = require('../utils/autoDrmPackager');
      const drmResult = await ensureDrmWrappedOnApprove({
        developerId: game.DeveloperID,
        gameId, versionId: null, versionNumber, gameTitle: game.Title,
      });
      finalFileSize = drmResult.fileSize;
      finalSha256 = drmResult.sha256;
      autoWrapped = drmResult.autoWrapped;
    }

    const assets = await this.saveGameAssets({
      slug,
      title: game.Title,
      coverFile: params.coverFile,
      trailerFile: params.trailerFile,
      replace: true,
    });

    await this.transaction(async (conn) => {
      await this.gameDAO.resetCurrentVersion({ gameId }, conn);
      await this.gameDAO.capNhatPhienBanMoi({
        gameId, versionNumber,
        buildFile: buildInfo.buildFileKey,
        fileSize: finalFileSize,
        sha256: finalSha256,
        changeLog,
      }, conn);
      await this.gameDAO.capNhatMediaGame({
        gameId,
        developerId: game.DeveloperID,
        slug,
        coverImage: assets.coverImage,
        trailerUrl: assets.trailerUrl,
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

  async layDanhSachDuAnCuaToi(params = {}) {
    const developerId = params.user?.accountId;
    if (!developerId) throw new UnauthorizedException();
    return this.gameDAO.layDanhSachGameTheoDeveloper(developerId);
  }

  async luuHoSoDuAnGame(params = {}) {
    const {
      title, description, price, minSpec, recSpec, genreIds,
      versionNumber = '1.0.0', changeLog, tempFilePath, user,
    } = params;

    if (!title || !title.trim()) throw new ValidationException('Tên game là bắt buộc.');
    if (!description || !description.trim()) throw new ValidationException('Mô tả game là bắt buộc.');
    if (!tempFilePath) throw new ValidationException('Tệp build .zip là bắt buộc.');
    if (typeof price !== 'number' || price < 0) throw new ValidationException('Giá bán phải là số không âm.');

    const duplicate = await this.gameDAO.kiemTraTenGameTrungLap({ title: title.trim() });
    if (duplicate) throw new ConflictException(`Tên game "${title.trim()}" đã tồn tại trên hệ thống.`);

    const slug = normalizeGameSlug(params.slug, title);
    const duplicateSlug = await this.gameDAO.kiemTraSlugGameTrungLap({ slug });
    if (duplicateSlug) {
      throw new ConflictException(`Slug "${slug}" đã được sử dụng cho game khác.`);
    }
    const gameId = uuidv4();

    const buildInfo = await validateAndProcessBuildZip({
      tempFilePath, developerId: user.accountId, gameId, versionNumber,
    });
    const assets = await this.saveGameAssets({
      slug,
      title: title.trim(),
      coverFile: params.coverFile,
      trailerFile: params.trailerFile,
    });

    await this.transaction(async (conn) => {
      await this.gameDAO.taoBanGhiDuAnMoi({
        gameId,
        developerId: user.accountId,
        title: title.trim(),
        slug,
        description: description.trim(),
        price,
        coverImage: assets.coverImage || params.coverImage || '',
        trailerUrl: assets.trailerUrl || params.trailerUrl || null,
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

  async saveGameAssets(params = {}) {
    const result = { coverImage: null, trailerUrl: null };
    if (params.coverFile) {
      const saved = await this.storageClient.luuAnhGame({
        tempFilePath: params.coverFile.path,
        originalName: params.coverFile.originalname,
        slug: params.slug,
        title: params.title,
        replace: params.replace,
      });
      result.coverImage = saved.publicUrl;
    }
    if (params.trailerFile) {
      const saved = await this.storageClient.luuTrailerGame({
        tempFilePath: params.trailerFile.path,
        originalName: params.trailerFile.originalname,
        slug: params.slug,
        title: params.title,
        replace: params.replace,
      });
      result.trailerUrl = saved.publicUrl;
    }
    return result;
  }


  async yeuCauThietLapGia(params = {}) {
    const { gameId, newPrice, user } = params;
    const developerId = user?.accountId || params.developerId;
    const price = Number(newPrice);

    if (!gameId) throw new ValidationException('Thiếu gameId.');
    if (isNaN(price) || price < 0 || price > 50000000) {
      throw new ValidationException('Giá bán không hợp lệ (từ 0 đến 50.000.000 VND).');
    }

    return this.transaction(async (conn) => {
      const game = await this.gameDAO.layThongTinSanPham({ gameId }, conn);
      if (!game || game.DeveloperID !== developerId) {
        throw new NotFoundException('Không tìm thấy game hoặc bạn không sở hữu tựa game này.');
      }

      const activeSale = await this.gameDAO.kiemTraSaleDangChay({ gameId }, conn);
      if (activeSale) {
        throw new NghiepVuException(`Không thể đổi giá cơ bản khi game đang trong chiến dịch Sale (${activeSale.PercentOff}%).`, 400);
      }

      await this.gameDAO.capNhatGiaBanVND({ gameId, developerId, newPrice: price }, conn);

      return {
        gameId,
        oldPrice: Number(game.Price),
        newPrice: price,
        message: `Đã cập nhật giá bán thành ${price.toLocaleString()} VND.`,
      };
    });
  }


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

    let buildPath = path.join(getGameVersionDir(user.accountId, gameId, target.VersionNumber), 'build.zip');
    if (!fs.existsSync(buildPath)) {
      buildPath = path.join(getLegacyGameVersionDir(gameId, target.VersionNumber), 'build.zip');
    }
    if (!fs.existsSync(buildPath)) {
      throw new NghiepVuException(`Tệp build phiên bản ${target.VersionNumber} không còn tồn tại trên đĩa.`, 422);
    }

    let rollbackZip;
    try {
      const AdmZip = require('adm-zip');
      rollbackZip = new AdmZip(buildPath);
      if (!rollbackZip.getEntries().some((entry) => !entry.isDirectory)) throw new Error('empty zip');
    } catch (_) {
      throw new NghiepVuException(`Tệp build phiên bản ${target.VersionNumber} bị hỏng hoặc rỗng; không thể rollback.`, 422);
    }
    if (target.Sha256) {
      const hash = await sha256File(buildPath);
      if (hash.toLowerCase() !== String(target.Sha256).toLowerCase()) {
        throw new NghiepVuException(`Tệp build phiên bản ${target.VersionNumber} không khớp mã SHA-256 đã lưu; không thể rollback.`, 422);
      }
    }

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


  async yeuCauCapNhatTrangThaiGame(params = {}) {
    const gameId = String(params.gameId || '').trim();
    const developerId = params.user?.accountId;
    const nextStatus = params.status;
    if (!gameId || !developerId) throw new ValidationException('Thiếu gameId hoặc thông tin nhà phát hành.');
    if (!['Approved', 'Hidden'].includes(nextStatus)) throw new ValidationException('Nhà phát hành chỉ có thể ẩn hoặc mở bán lại game đã được duyệt.');
    const game = await this.gameDAO.truyVanThongTinGame({ gameId, developerId });
    if (!game) throw new NotFoundException('Không tìm thấy game hoặc bạn không phải chủ sở hữu.');
    if (nextStatus === 'Hidden' && game.Status !== 'Approved') {
      throw new NghiepVuException('Chỉ game đang được duyệt và mở bán mới có thể ẩn.', 422);
    }
    if (nextStatus === 'Approved' && game.Status !== 'Hidden') {
      throw new NghiepVuException('Chỉ game đang ẩn mới có thể mở bán lại.', 422);
    }
    await this.gameDAO.capNhatTrangThaiCuaDeveloper({ gameId, developerId, status: nextStatus });
    return { gameId, status: nextStatus, message: nextStatus === 'Hidden' ? 'Đã ẩn game khỏi cửa hàng.' : 'Đã mở bán lại game.' };
  }

  async yeuCauGoGame(params = {}) {
    throw new NghiepVuException('Chưa cài đặt: GameService.yeuCauGoGame', 501);
  }

  async thucHienGoGameKhoiHeThong(params = {}) {
    throw new NghiepVuException('Chưa cài đặt: GameService.thucHienGoGameKhoiHeThong', 501);
  }

  async yeuCauAnGame(params = {}) {
    return this.yeuCauCapNhatTrangThaiGame({ ...params, status: 'Hidden' });
  }

  async capNhatThongTinGame(params = {}) {
    const gameId = String(params.gameId || '').trim();
    const developerId = params.user?.accountId;
    const title = typeof params.title === 'string' ? params.title.trim() : '';
    const description = typeof params.description === 'string' ? params.description.trim() : '';
    const minSpec = typeof params.minSpec === 'string' ? params.minSpec.trim() : '';
    const recSpec = typeof params.recSpec === 'string' ? params.recSpec.trim() : '';
    if (!gameId || !developerId) throw new ValidationException('Thiếu gameId hoặc thông tin nhà phát hành.');
    if (!title || title.length > 150) throw new ValidationException('Tên game bắt buộc và tối đa 150 ký tự.');
    if (!description || description.length > 10000) throw new ValidationException('Mô tả game bắt buộc và tối đa 10.000 ký tự.');
    if (minSpec.length > 2000 || recSpec.length > 2000) throw new ValidationException('Thông tin cấu hình tối đa 2.000 ký tự.');
    const game = await this.gameDAO.truyVanThongTinGame({ gameId, developerId });
    if (!game) throw new NotFoundException('Không tìm thấy game hoặc bạn không phải chủ sở hữu.');
    await this.gameDAO.capNhatThongTinGame({ gameId, developerId, title, description, minSpec, recSpec });
    return { gameId, title, description, minSpec, recSpec, message: 'Đã cập nhật thông tin game.' };
  }

  async kiemTraGiaBanHopLe(params = {}) {
    throw new NghiepVuException('Chưa cài đặt: GameService.kiemTraGiaBanHopLe', 501);
  }

  async kiemTraChuyenDoiHopLe(params = {}) {
    throw new NghiepVuException('Chưa cài đặt: GameService.kiemTraChuyenDoiHopLe', 501);
  }
}

module.exports = GameService;
