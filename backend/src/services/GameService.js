'use strict';
const path = require('path');
const crypto = require('crypto');
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

    const buildInfo = await validateAndProcessBuildZip({ tempFilePath, gameId, versionNumber });

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

    await this.transaction(async (conn) => {
      await this.gameDAO.resetCurrentVersion({ gameId }, conn);
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

  async guiYeuCauQuetVirus(params = {}) {
    // Mô phỏng: trả về "clean"
    return { result: 'clean', scannedAt: new Date().toISOString() };
  }

  async layDanhSachDuAnCuaToi(params = {}) {
    const developerId = params.user?.accountId;
    if (!developerId) throw new UnauthorizedException();
    return this.gameDAO.layDanhSachGameTheoDeveloper(developerId);
  }

  async luuHoSoDuAnGame(params = {}) {
    const { title, description, price, minSpec, recSpec, genreIds, versionNumber = '1.0.0', changeLog, tempFilePath, user } = params;

    if (!title || !title.trim()) throw new ValidationException('Tên game là bắt buộc.');
    if (!description || !description.trim()) throw new ValidationException('Mô tả game là bắt buộc.');
    if (!tempFilePath) throw new ValidationException('Tệp build .zip là bắt buộc.');
    if (typeof price !== 'number' || price < 0) throw new ValidationException('Giá bán phải là số không âm.');

    const duplicate = await this.gameDAO.kiemTraTenGameTrungLap({ title: title.trim() });
    if (duplicate) throw new ConflictException(`Tên game "${title.trim()}" đã tồn tại trên hệ thống.`);

    const gameId = uuidv4();

    const buildInfo = await validateAndProcessBuildZip({ tempFilePath, gameId, versionNumber });

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

    const { BUILDS_ROOT } = require('../utils/autoDrmPackager');
    const path = require('path');
    const fs = require('fs');
    const buildPath = path.join(BUILDS_ROOT, 'games', gameId, target.VersionNumber, 'build.zip');
    if (!fs.existsSync(buildPath)) {
      throw new NghiepVuException(`Tệp build phiên bản ${target.VersionNumber} không còn tồn tại trên đĩa.`, 422);
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
    throw new NghiepVuException('Chưa cài đặt: GameService.yeuCauCapNhatTrangThaiGame', 501);
  }

  async yeuCauGoGame(params = {}) {
    throw new NghiepVuException('Chưa cài đặt: GameService.yeuCauGoGame', 501);
  }

  async thucHienGoGameKhoiHeThong(params = {}) {
    throw new NghiepVuException('Chưa cài đặt: GameService.thucHienGoGameKhoiHeThong', 501);
  }

  async yeuCauAnGame(params = {}) {
    throw new NghiepVuException('Chưa cài đặt: GameService.yeuCauAnGame', 501);
  }

  async kiemTraGiaBanHopLe(params = {}) {
    throw new NghiepVuException('Chưa cài đặt: GameService.kiemTraGiaBanHopLe', 501);
  }

  async kiemTraChuyenDoiHopLe(params = {}) {
    throw new NghiepVuException('Chưa cài đặt: GameService.kiemTraChuyenDoiHopLe', 501);
  }
}

module.exports = GameService;
