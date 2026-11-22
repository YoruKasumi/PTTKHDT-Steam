'use strict';
const BaseService = require('./BaseService');
const { NotFoundException, UnauthorizedException, ValidationException } = require('../exceptions');
const AccountDAO = require('../dao/AccountDAO');

/**
 * ProfileService - tầng Business Logic.
 * Tên phương thức lấy đúng từ sơ đồ sequence; nội dung bên dưới chỉ là khung cần cài đặt.
 */
class ProfileService extends BaseService {
  constructor() {
    super();
    this.accountDAO = new AccountDAO();
  }

  // ---------------------------------------------------------------- Phương thức công khai (Route / Service khác gọi)

  async getProfile(params = {}) {
    const accountId = params.user?.accountId;
    if (!accountId) throw new UnauthorizedException();
    const profile = await this.accountDAO.layHoSoCaNhan({ accountId });
    if (!profile) throw new NotFoundException('Không tìm thấy tài khoản');
    return this.toProfileResponse(profile);
  }

  /**
   * UC4. Cập nhật hồ sơ cá nhân - sequence #3: UI → ProfileService
   * Vai trò gọi: Authenticated
   * Luồng theo sơ đồ:
   *   #4 → AccountDAO.capNhatTenHienThi()
   *   #5 ← xacNhanCapNhatThanhCong()
   *   #6 ← thongBaoCapNhatThanhCong()
   * @param {object} params
   */
  async guiTenHienThiMoi(params = {}) {
    const displayName = typeof params.displayName === 'string' ? params.displayName.trim() : '';
    if (!displayName || displayName.length > 50) {
      throw new ValidationException('Tên hiển thị là bắt buộc và tối đa 50 ký tự');
    }
    return this.updateProfileFields(params, { displayName });
  }

  async updateProfile(params = {}) {
    const displayName = typeof params.displayName === 'string' ? params.displayName.trim() : '';
    const avatarUrl = params.avatarUrl === null || params.avatarUrl === ''
      ? null
      : typeof params.avatarUrl === 'string' ? params.avatarUrl.trim() : undefined;
    if (!displayName || displayName.length > 50) {
      throw new ValidationException('Tên hiển thị là bắt buộc và tối đa 50 ký tự');
    }
    if (avatarUrl === undefined || (avatarUrl && avatarUrl.length > 255)) {
      throw new ValidationException('AvatarUrl phải là chuỗi tối đa 255 ký tự hoặc null');
    }
    const accountId = params.user?.accountId;
    if (!accountId) throw new UnauthorizedException();
    await this.accountDAO.capNhatHoSoCaNhan({ accountId, displayName, avatarUrl });
    const profile = await this.accountDAO.layHoSoCaNhan({ accountId });
    if (!profile) throw new NotFoundException('Không tìm thấy tài khoản');
    return this.toProfileResponse(profile);
  }

  async updateNotifications(params = {}) {
    const accountId = params.user?.accountId;
    if (!accountId) throw new UnauthorizedException();
    if (typeof params.enabled !== 'boolean') {
      throw new ValidationException('enabled phải là boolean');
    }
    await this.accountDAO.capNhatTrangThaiThongBao({ accountId, enabled: params.enabled });
    const profile = await this.accountDAO.layHoSoCaNhan({ accountId });
    if (!profile) throw new NotFoundException('Không tìm thấy tài khoản');
    return { notifyEnabled: Boolean(profile.NotifyEnabled) };
  }

  async updateProfileFields(params = {}, fields = {}) {
    const accountId = params.user?.accountId;
    if (!accountId) throw new UnauthorizedException();
    if (fields.displayName) await this.accountDAO.capNhatTenHienThi({ accountId, ...fields });
    if (Object.hasOwn(fields, 'avatarUrl')) await this.accountDAO.capNhatDuongDanAnh({ accountId, ...fields });
    const profile = await this.accountDAO.layHoSoCaNhan({ accountId });
    if (!profile) throw new NotFoundException('Không tìm thấy tài khoản');
    return this.toProfileResponse(profile);
  }

  toProfileResponse(profile) {
    return {
      accountId: profile.AccountID,
      username: profile.Username,
      email: profile.Email,
      displayName: profile.DisplayName,
      avatarUrl: profile.AvatarUrl,
      notifyEnabled: Boolean(profile.NotifyEnabled),
      createdAt: profile.CreatedAt,
    };
  }

  /**
   * UC4. Cập nhật hồ sơ cá nhân - sequence #9: UI → ProfileService
   * Vai trò gọi: Authenticated
   * Luồng theo sơ đồ:
   *   #10 → StorageClient.luuAnhDaiDien()
   *   #11 ← traVeDuongDanAnh()
   *   #12 → AccountDAO.capNhatDuongDanAnh()
   *   #13 ← xacNhanCapNhatThanhCong()
   *   #14 ← thongBaoCapNhatThanhCong()
   * @param {object} params
   */
  async guiAnhDaiDien(params = {}) {
    const avatarUrl = params.avatarUrl === null || params.avatarUrl === ''
      ? null
      : typeof params.avatarUrl === 'string' ? params.avatarUrl.trim() : undefined;
    if (avatarUrl === undefined || (avatarUrl && avatarUrl.length > 255)) {
      throw new ValidationException('AvatarUrl phải là chuỗi tối đa 255 ký tự hoặc null');
    }
    return this.updateProfileFields(params, { avatarUrl });
  }
}

module.exports = ProfileService;
