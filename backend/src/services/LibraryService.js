'use strict';
const path = require('path');
const fs = require('fs');
const { randomUUID, randomBytes, createHash } = require('node:crypto');
const jwt = require('jsonwebtoken');
const BaseService = require('./BaseService');
const {
  NghiepVuException,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  ValidationException,
} = require('../exceptions');
const LicenseDAO = require('../dao/LicenseDAO');
const env = require('../config/env');
const {
  getGameVersionDir,
  getLegacyGameVersionDir,
} = require('../utils/storagePaths');

/** Thời gian sống của Launch Token: 10 phút */
const LAUNCH_TOKEN_TTL = '10m';

/**
 * LibraryService — tầng Business Logic cho thư viện, đổi Key & DRM.
 */
class LibraryService extends BaseService {
  constructor() {
    super();
    this.licenseDAO = new LicenseDAO();
  }

  // ─── Phương thức công khai ───────────────────────────────────────────────

  /**
   * UC16. Xem thư viện cá nhân.
   * Lấy danh sách LICENSE.Status = 'Active' JOIN GAME và GAMEVERSION (IsCurrent = 1)
   * Trả về VersionNumber, ChangeLog, FileSize, Sha256.
   */
  async yeuCauXemThuVien(params = {}) {
    const { user } = params;
    const rows = await this.licenseDAO.layDanhSachGameDaSoHuu({ customerId: user.accountId });
    return rows.map((row) => ({
      licenseId: row.LicenseID,
      gameId: row.GameID,
      title: row.Title,
      coverImage: row.CoverImage,
      source: row.Source,
      purchaseDate: row.PurchaseDate,
      licenseStatus: row.LicenseStatus,
      gameStatus: row.GameStatus,
      versionId: row.VersionID,
      versionNumber: row.VersionNumber,
      changeLog: row.ChangeLog,
      versionDate: row.VersionDate,
      fileSize: row.FileSize ? Number(row.FileSize) : null,
      sha256: row.Sha256 || null,
    }));
  }

  /**
   * Đổi mã kích hoạt game (Redeem Key).
   * Trong 1 Transaction:
   *   - Kiểm tra ACTIVATIONKEY.Status = 'Unused'
   *   - Kiểm tra khách chưa sở hữu game
   *   - Cập nhật ACTIVATIONKEY (Status = 'Used', ActivatedDate = NOW(), RedeemedBy = customerId)
   *   - Chèn LICENSE (Source = 'Key', AccessToken SHA-256)
   * @param {object} params
   */
  async kichHoatKey(params = {}) {
    return this.redeemKey(params);
  }

  async redeemKey(params = {}) {
    const { user } = params;
    const customerId = user?.accountId;
    if (!customerId) throw new ValidationException('Tài khoản khách hàng không hợp lệ');

    const rawCode = params.keyCode || params.code || '';
    const keyCode = typeof rawCode === 'string' ? rawCode.trim().toUpperCase() : '';
    if (!keyCode) {
      throw new ValidationException('Vui lòng nhập mã kích hoạt trò chơi (Activation Key).');
    }

    return this.transaction(async (conn) => {
      // 1. Kiểm tra tồn tại và khóa dòng ACTIVATIONKEY
      const keyRow = await this.licenseDAO.timKeyKichHoat({ keyCode }, conn);
      if (!keyRow) {
        throw new NotFoundException('Mã kích hoạt không tồn tại hoặc không hợp lệ.');
      }

      if (keyRow.Status === 'Used') {
        throw new NghiepVuException('Mã kích hoạt này đã được sử dụng trước đó.', 422, 'KEY_ALREADY_USED');
      }

      if (keyRow.Status === 'Revoked') {
        throw new NghiepVuException('Mã kích hoạt này đã bị thu hồi hoặc vô hiệu hóa.', 422, 'KEY_REVOKED');
      }

      // 2. Kiểm tra khách chưa sở hữu game này
      const alreadyOwned = await this.licenseDAO.kiemTraGameDaSoHuu({
        customerId,
        gameId: keyRow.GameID,
      }, conn);

      if (alreadyOwned) {
        throw new ConflictException('Bạn đã sở hữu trò chơi này trong thư viện cá nhân.');
      }

      // 3. Cập nhật ACTIVATIONKEY sang Used
      const updated = await this.licenseDAO.capNhatKeyDaSuDung({
        keyId: keyRow.KeyID,
        customerId,
      }, conn);

      if (!updated) {
        throw new ConflictException('Mã kích hoạt vừa được sử dụng bởi người khác.');
      }

      // 4. Tạo token SHA-256 và chèn LICENSE
      const token = randomBytes(32).toString('hex');
      const accessTokenHash = createHash('sha256').update(token).digest('hex');
      const licenseId = randomUUID();

      await this.licenseDAO.taoBanQuyenTuKey({
        licenseId,
        customerId,
        gameId: keyRow.GameID,
        accessTokenHash,
      }, conn);

      // 5. Lấy thông tin game để trả về
      const game = await this.licenseDAO.layThongTinGameDonGian({ gameId: keyRow.GameID }, conn);

      return {
        success: true,
        licenseId,
        gameId: keyRow.GameID,
        title: game?.Title || 'Trò chơi mới',
        coverImage: game?.CoverImage || null,
        message: `Kích hoạt thành công! "${game?.Title || 'Trò chơi'}" đã được thêm vào thư viện của bạn.`,
      };
    });
  }

  /**
   * UC17. Khởi chạy game — Sinh Launch Token.
   *
   * POST /api/library/:gameId/launch
   */
  async yeuCauKhoiChay(params = {}) {
    const { gameId, user } = params;

    if (!gameId) throw new ValidationException('Thiếu gameId.');

    // Kiểm tra LICENSE tồn tại + Active + có phiên bản hiện hành
    const license = await this.licenseDAO.kiemTraTokenBanQuyen({ customerId: user.accountId, gameId });
    if (!license) {
      throw new ForbiddenException('Bạn chưa sở hữu game này hoặc bản quyền đã bị thu hồi.');
    }

    const {
      LicenseID: licenseId,
      DeveloperID: developerId,
      VersionNumber: versionNumber,
    } = license;

    // Ký Launch Token (10 phút)
    const launchToken = jwt.sign(
      {
        type: 'GAME_LAUNCH',
        licenseId,
        customerId: user.accountId,
        gameId,
        developerId,
      },
      env.jwtSecret,
      { expiresIn: LAUNCH_TOKEN_TTL },
    );

    const playUrl = `/api/library/play/${gameId}/${versionNumber}/index.html?launchToken=${launchToken}&gameId=${gameId}`;

    return {
      allowed: true,
      gameId,
      versionNumber,
      launchToken,
      playUrl,
    };
  }

  /**
   * Xác thực Launch Token theo thời gian thực (gọi từ drm.js trong game).
   * POST /api/library/verify-launch (Public)
   * Body: { launchToken, gameId }
   */
  async xacThucKhoiChay(params = {}) {
    return this.verifyLaunch(params);
  }

  async verifyLaunch(params = {}) {
    const { launchToken, gameId } = params;

    if (!launchToken || !gameId) {
      return { valid: false, reason: 'Thiếu tham số bắt buộc (launchToken, gameId).' };
    }

    // Xác thực chữ ký JWT
    let claims;
    try {
      claims = jwt.verify(launchToken, env.jwtSecret);
    } catch (err) {
      return { valid: false, reason: 'Token không hợp lệ hoặc đã hết hạn.' };
    }

    // Kiểm tra type, gameId khớp
    if (claims.type !== 'GAME_LAUNCH') {
      return { valid: false, reason: 'Token không thuộc loại GAME_LAUNCH.' };
    }
    if (claims.gameId !== gameId) {
      return { valid: false, reason: 'Token không khớp với game này.' };
    }

    // Truy vấn thời gian thực: LICENSE + ACCOUNT
    const check = await this.licenseDAO.kiemTraHopLeTheoThoiGianThuc({
      licenseId: claims.licenseId,
      customerId: claims.customerId,
    });

    if (!check) {
      return { valid: false, reason: 'Bản quyền không tồn tại hoặc thông tin tài khoản không hợp lệ.' };
    }
    if (check.LicenseStatus !== 'Active') {
      return { valid: false, reason: 'Bản quyền đã bị thu hồi (Refund hoặc bị khóa).' };
    }
    if (check.AccountStatus !== 'Active') {
      return { valid: false, reason: 'Tài khoản đã bị tạm khóa hoặc cấm.' };
    }

    return {
      valid: true,
      licenseId: claims.licenseId,
      customerId: claims.customerId,
      gameId: claims.gameId,
    };
  }

  /**
   * UC17. Phục vụ file tĩnh game với bảo vệ DRM.
   * GET /api/library/play/:gameId/:version/*
   *
   * Trả về { filePath, mimeType, setCookie, cookieValue } để Route handler phục vụ file.
   */
  async serveGameFile(params = {}) {
    const { gameId, version, filePath: requestedPath, launchToken, cookieToken } = params;

    // Lấy token từ query hoặc cookie
    const token = launchToken || cookieToken;

    if (!token) {
      throw new ForbiddenException('Truy cập bị từ chối: thiếu Launch Token.');
    }

    // Xác thực token
    let claims;
    try {
      claims = jwt.verify(token, env.jwtSecret);
    } catch (_) {
      throw new ForbiddenException('Launch Token không hợp lệ hoặc đã hết hạn.');
    }

    if (claims.type !== 'GAME_LAUNCH' || claims.gameId !== gameId) {
      throw new ForbiddenException('Launch Token không khớp với game này.');
    }

    const authorization = await this.verifyLaunch({ launchToken: token, gameId });
    if (!authorization.valid) {
      throw new ForbiddenException(authorization.reason || 'Bản quyền không còn hợp lệ.');
    }

    // Chống path traversal
    let versionDir = getGameVersionDir(claims.developerId, gameId, version);
    if (!fs.existsSync(path.join(versionDir, 'unpacked'))) {
      const legacyVersionDir = getLegacyGameVersionDir(gameId, version);
      if (fs.existsSync(path.join(legacyVersionDir, 'unpacked'))) versionDir = legacyVersionDir;
    }
    const unpackedDir = path.resolve(versionDir, 'unpacked');
    const resolvedPath = path.resolve(unpackedDir, requestedPath || 'index.html');

    if (!resolvedPath.startsWith(unpackedDir + path.sep) && resolvedPath !== unpackedDir) {
      throw new ForbiddenException('Truy cập đường dẫn không hợp lệ.');
    }

    if (!fs.existsSync(resolvedPath)) {
      throw new NotFoundException('Không tìm thấy tệp game.');
    }

    return {
      resolvedPath,
      setCookieOnIndexHtml: requestedPath === 'index.html' || requestedPath === '',
      launchToken: token,
      gameId,
    };
  }

  // ─── Tải game về máy (mô phỏng luồng cài đặt thật) ───────────────────────

  /**
   * UC: Yêu cầu tải game — kiểm tra LICENSE Active rồi trả metadata gói build.zip
   * cho Route stream file về máy người chơi (Content-Disposition: attachment).
   *
   * LƯU Ý QUAN TRỌNG:
   *  - Tải file KHÔNG thay đổi trạng thái bản quyền. Người chơi tải lại bao nhiêu lần cũng được.
   *  - Thu hồi bản quyền chỉ xảy ra server-side khi hoàn tiền (OrderService) hoặc
   *    khóa/tạm khóa tài khoản (AccountService) — không bao giờ do yêu cầu "gỡ cài đặt" của khách.
   */
  async yeuCauTaiGame(params = {}) {
    const { gameId, user } = params;
    if (!gameId) throw new ValidationException('Thiếu gameId.');

    // Bản quyền phải Active — câu truy vấn đã lọc l.Status = 'Active' sẵn.
    const license = await this.licenseDAO.kiemTraTokenBanQuyen({
      customerId: user.accountId,
      gameId,
    });
    if (!license) {
      throw new ForbiddenException('Bạn chưa sở hữu game này hoặc bản quyền đã bị thu hồi.');
    }

    // Tìm gói build.zip: thư mục theo developerId (cấu trúc mới), không có thì thử cấu trúc cũ.
    let buildPath = path.join(getGameVersionDir(license.DeveloperID, gameId, license.VersionNumber), 'build.zip');
    if (!fs.existsSync(buildPath)) {
      const legacyPath = path.join(getLegacyGameVersionDir(gameId, license.VersionNumber), 'build.zip');
      if (fs.existsSync(legacyPath)) buildPath = legacyPath;
    }
    if (!fs.existsSync(buildPath)) {
      throw new NotFoundException('Bản build chưa sẵn sàng trên máy chủ. Vui lòng thử lại sau.');
    }

    const stat = fs.statSync(buildPath);

    return {
      allowed: true,
      gameId,
      licenseId: license.LicenseID,
      versionNumber: license.VersionNumber,
      fileName: `game-${gameId}-v${license.VersionNumber}.zip`,
      filePath: buildPath,
      fileSize: stat.size,
      sha256: license.Sha256 || null, // client dùng để xác minh tính toàn vẹn sau khi tải
    };
  }

  // ─── Legacy methods (còn lại chưa cài đặt) ──────────────────────────────

  async kiemTraPhienBanHienTai(params = {}) {
    throw new NghiepVuException('Chưa cài đặt: LibraryService.kiemTraPhienBanHienTai', 501);
  }

  async kiemTraDuongDanLuuTru(params = {}) {
    throw new NghiepVuException('Chưa cài đặt: LibraryService.kiemTraDuongDanLuuTru', 501);
  }

  async kiemTraDungLuongODia(params = {}) {
    throw new NghiepVuException('Chưa cài đặt: LibraryService.kiemTraDungLuongODia', 501);
  }
}

module.exports = LibraryService;
