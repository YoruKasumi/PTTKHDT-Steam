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
const { BUILDS_ROOT } = require('../utils/autoDrmPackager');

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
   * UC17. Khởi chạy game — Sinh Launch Token, ghi nhận thiết bị.
   *
   * POST /api/library/:gameId/launch
   * Body: { deviceFingerprint, deviceName }
   */
  async yeuCauKhoiChay(params = {}) {
    const { gameId, user } = params;
    const deviceFingerprint = params.deviceFingerprint || params.body?.deviceFingerprint;
    const deviceName = params.deviceName || params.body?.deviceName || 'Unknown Device';

    if (!gameId) throw new ValidationException('Thiếu gameId.');
    if (!deviceFingerprint || !/^[0-9a-f]{64}$/.test(deviceFingerprint)) {
      throw new ValidationException('deviceFingerprint phải là chuỗi SHA-256 64 ký tự hex.');
    }

    // Kiểm tra LICENSE tồn tại + Active + có phiên bản hiện hành
    const license = await this.licenseDAO.kiemTraTokenBanQuyen({ customerId: user.accountId, gameId });
    if (!license) {
      throw new ForbiddenException('Bạn chưa sở hữu game này hoặc bản quyền đã bị thu hồi.');
    }

    const { LicenseID: licenseId, VersionNumber: versionNumber } = license;

    // Kiểm tra LICENSE_DEVICE
    const existingDevice = await this.licenseDAO.timThietBi({ licenseId, deviceFingerprint });

    if (existingDevice) {
      if (existingDevice.Status === 'Revoked') {
        throw new ForbiddenException('Thiết bị này đã bị thu hồi quyền khởi chạy.');
      }
      // Active → cập nhật LastSeen
      await this.licenseDAO.capNhatLastSeen({ licenseId, deviceFingerprint });
    } else {
      // Thiết bị mới → kiểm tra giới hạn 3 thiết bị
      const activeCount = await this.licenseDAO.demThietBiActive({ licenseId });
      if (activeCount >= 3) {
        throw new NghiepVuException(
          'Đã đạt giới hạn tối đa 3 thiết bị. Vui lòng gỡ bớt thiết bị cũ.',
          422,
          'DEVICE_LIMIT_EXCEEDED',
        );
      }
      await this.licenseDAO.themThietBiMoi({ licenseId, deviceFingerprint, deviceName });
    }

    // Ký Launch Token (10 phút)
    const launchToken = jwt.sign(
      {
        type: 'GAME_LAUNCH',
        licenseId,
        customerId: user.accountId,
        gameId,
        deviceFingerprint,
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
   * Body: { launchToken, gameId, deviceFingerprint }
   */
  async verifyLaunch(params = {}) {
    const { launchToken, gameId, deviceFingerprint } = params;

    if (!launchToken || !gameId || !deviceFingerprint) {
      return { valid: false, reason: 'Thiếu tham số bắt buộc (launchToken, gameId, deviceFingerprint).' };
    }

    // Xác thực chữ ký JWT
    let claims;
    try {
      claims = jwt.verify(launchToken, env.jwtSecret);
    } catch (err) {
      return { valid: false, reason: 'Token không hợp lệ hoặc đã hết hạn.' };
    }

    // Kiểm tra type, gameId, deviceFingerprint khớp
    if (claims.type !== 'GAME_LAUNCH') {
      return { valid: false, reason: 'Token không thuộc loại GAME_LAUNCH.' };
    }
    if (claims.gameId !== gameId) {
      return { valid: false, reason: 'Token không khớp với game này.' };
    }
    if (claims.deviceFingerprint !== deviceFingerprint) {
      return { valid: false, reason: 'Token không khớp với thiết bị này.' };
    }

    // Truy vấn thời gian thực: LICENSE + ACCOUNT + LICENSE_DEVICE
    const check = await this.licenseDAO.kiemTraHopLeTheoThoiGianThuc({
      licenseId: claims.licenseId,
      customerId: claims.customerId,
      deviceFingerprint,
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
    if (!check.DeviceStatus || check.DeviceStatus !== 'Active') {
      return { valid: false, reason: 'Thiết bị này không còn được phép chơi.' };
    }

    return { valid: true, licenseId: claims.licenseId };
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

    // Chống path traversal
    const unpackedDir = path.resolve(BUILDS_ROOT, 'games', gameId, version, 'unpacked');
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

  /**
   * Danh sách thiết bị của một bản quyền.
   * GET /api/library/:gameId/devices
   */
  async layDanhSachThietBi(params = {}) {
    const { gameId, user } = params;
    const license = await this.licenseDAO.layLicenseCuaKhach({ customerId: user.accountId, gameId });
    if (!license) throw new ForbiddenException('Bạn không sở hữu game này.');

    const devices = await this.licenseDAO.layDanhSachThietBi({ licenseId: license.LicenseID });
    return devices.map((d) => ({
      deviceId: d.DeviceID,
      deviceFingerprint: d.DeviceFingerprint.slice(0, 8) + '...',  // ẩn bớt fingerprint
      deviceName: d.DeviceName,
      firstSeen: d.FirstSeen,
      lastSeen: d.LastSeen,
      status: d.Status,
    }));
  }

  /**
   * Thu hồi thiết bị.
   * DELETE /api/library/:gameId/devices/:deviceId
   */
  async thuHoiThietBi(params = {}) {
    const { gameId, deviceId, user } = params;
    if (!deviceId) throw new ValidationException('Thiếu deviceId.');

    const license = await this.licenseDAO.layLicenseCuaKhach({ customerId: user.accountId, gameId });
    if (!license) throw new ForbiddenException('Bạn không sở hữu game này.');

    const affected = await this.licenseDAO.thuHoiThietBi({ deviceId, licenseId: license.LicenseID });
    if (!affected) throw new NotFoundException('Không tìm thấy thiết bị hoặc thiết bị đã bị thu hồi.');

    return { deviceId, message: 'Đã thu hồi quyền khởi chạy của thiết bị.' };
  }

  // ─── Legacy methods (giữ nguyên khung) ──────────────────────────────────

  async yeuCauTaiGame(params = {}) {
    throw new NghiepVuException('Chưa cài đặt: LibraryService.yeuCauTaiGame', 501);
  }

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
