'use strict';
const BaseService = require('./BaseService');
const {
  NghiepVuException,
  NotFoundException,
  NotImplementedException,
  UnauthorizedException,
  ValidationException,
} = require('../exceptions');
const AccountDAO = require('../dao/AccountDAO');
const password = require('../utils/password');
const token = require('../utils/token');

/**
 * AuthService - tầng Business Logic cho xác thực tài khoản.
 * Tên phương thức lấy đúng từ sơ đồ sequence; các luồng chưa hỗ trợ vẫn được giữ dưới dạng khung.
 */
class AuthService extends BaseService {
  constructor(accountDAO = new AccountDAO()) {
    super();
    this.accountDAO = accountDAO;
  }

  // ---------------------------------------------------------------- Phương thức công khai (Route / Service khác gọi)

  /**
   * UC1. Đăng ký tài khoản - sequence #4: UI → AuthService
   * Vai trò gọi: Guest
   * Luồng theo sơ đồ:
   *   #5 → AccountDAO.kiemTraTenTaiKhoan()
   *   #6 ← traVeKetQuaKiemTra()
   *   #7 ← thongBaoTaiKhoanDaTonTai()
   *   #9 ↻ this.kiemTraDinhDangMatKhau()
   *   #10 ← thongBaoMatKhauKhongHopLe()
   *   #12 → AccountDAO.taoTaiKhoanMoi()
   *   #13 ← xacNhanTaoTaiKhoanThanhCong()
   *   #14 ← thongBaoDangKyThanhCong()
   * @param {object} params
   */
  async guiThongTinDangKy(params = {}) {
    const username = typeof params.username === 'string' ? params.username.trim() : '';
    const email = typeof params.email === 'string' ? params.email.trim().toLowerCase() : '';
    const displayName = typeof params.displayName === 'string' && params.displayName.trim()
      ? params.displayName.trim()
      : username;
    const plainPassword = typeof params.password === 'string' ? params.password : '';
    const otp = typeof params.otp === 'string' ? params.otp.trim() : '';

    if (process.env.NODE_ENV === 'production') {
      throw new NghiepVuException('Đăng ký OTP chưa được cấu hình trong môi trường production', 503, 'OTP_NOT_CONFIGURED');
    }
    if (!/^\d{4}$/.test(otp) || otp === '0000') {
      throw new NghiepVuException('Mã OTP không hợp lệ', 400, 'OTP_INVALID');
    }
    if (!/^[A-Za-z0-9._-]{3,30}$/.test(username)) {
      throw new NghiepVuException('Tên tài khoản cần từ 3 đến 30 ký tự chữ, số, dấu chấm, gạch dưới hoặc gạch ngang', 400, 'INVALID_USERNAME');
    }
    if (email.length > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new NghiepVuException('Email không hợp lệ', 400, 'INVALID_EMAIL');
    }
    if (displayName.length > 50) {
      throw new NghiepVuException('Tên hiển thị tối đa 50 ký tự', 400, 'INVALID_DISPLAY_NAME');
    }
    if (plainPassword.length < 8 || Buffer.byteLength(plainPassword, 'utf8') > 72) {
      throw new NghiepVuException('Mật khẩu cần ít nhất 8 ký tự và tối đa 72 byte', 400, 'INVALID_PASSWORD');
    }

    const passwordHash = await password.hash(plainPassword);
    return this.transaction(async (conn) => {
      const existing = await this.accountDAO.kiemTraTenTaiKhoan({ username, email }, conn);
      if (existing) {
        throw new NghiepVuException('Tên tài khoản hoặc email đã được sử dụng', 409, 'ACCOUNT_EXISTS');
      }
      const accountId = await this.accountDAO.taoTaiKhoanMoi({
        username,
        email,
        displayName,
        passwordHash,
      }, conn);
      return {
        accountId,
        username,
        email,
        displayName,
        role: 'Customer',
        otpVerified: true,
      };
    });
  }

  /**
   * UC2. Đăng nhập hệ thống - sequence #2: UI → AuthService
   * Vai trò gọi: Guest
   * Luồng theo sơ đồ:
   *   #3 → AccountDAO.kiemTraTaiKhoan()
   *   #4 ← traVeThongTinTaiKhoan()
   * @param {object} params
   */
  async guiThongTinDangNhap(params = {}) {
    const accountName = typeof params.account === 'string' ? params.account.trim() : '';
    const plainPassword = typeof params.password === 'string' ? params.password : '';
    if (!accountName || !plainPassword) {
      throw new NghiepVuException('Vui lòng nhập tên tài khoản/email và mật khẩu', 400, 'MISSING_CREDENTIALS');
    }

    const account = await this.accountDAO.kiemTraTaiKhoan({ account: accountName });
    if (!account || !(await password.compare(plainPassword, account.PasswordHash))) {
      throw new UnauthorizedException('Tên đăng nhập hoặc mật khẩu không chính xác');
    }
    if (account.Status !== 'Active') {
      throw new NghiepVuException('Tài khoản đang bị khóa hoặc tạm ngưng', 403, 'ACCOUNT_INACTIVE');
    }

    const roles = [];
    if (Number(account.IsCustomer) === 1) roles.push('Customer');
    if (Number(account.IsDeveloper) === 1) roles.push('Developer');
    if (Number(account.IsManager) === 1) roles.push('Manager');
    if (Number(account.IsAdmin) === 1) roles.push('Admin');
    if (!roles.length) throw new NghiepVuException('Tài khoản chưa được gán vai trò', 403, 'ROLE_NOT_ASSIGNED');

    const user = {
      accountId: account.AccountID,
      username: account.Username,
      email: account.Email,
      displayName: account.DisplayName,
      avatarUrl: account.AvatarUrl,
      notifyEnabled: Boolean(account.NotifyEnabled),
      roles,
      staffRole: account.StaffRole || null,
      permissions: account.PermissionCodes ? account.PermissionCodes.split(',') : [],
    };
    return {
      token: token.sign({ accountId: user.accountId, username: user.username, roles }),
      user,
    };
  }

  /**
   * UC3. Đăng xuất khỏi hệ thống - sequence #2: UI → AuthService
   * Vai trò gọi: Authenticated
   * Luồng theo sơ đồ:
   *   #4 ← thongBaoDangXuatThanhCong()
   * @param {object} params
   */
  async guiYeuCauDangXuat(params = {}) {
    // JWT hiện tại là stateless; đăng xuất được hoàn tất phía client.
    // Endpoint vẫn xác nhận thành công sau khi authenticate middleware đã xác thực tài khoản.
    return { loggedOut: true };
  }

  /**
   * UC5. Thay đổi mật khẩu tài khoản - sequence #2: UI → AuthService
   * Vai trò gọi: Authenticated
   * Luồng theo sơ đồ:
   *   #3 → AccountDAO.layMatKhauHienTai()
   *   #4 ← traVeMatKhauHienTai()
   *   #5 ↻ this.kiemTraMatKhauHienTai()
   *   #6 ↻ this.kiemTraDinhDangMatKhauMoi()
   *   #7 ↻ this.kiemTraMatKhauMoiKhacMatKhauCu()
   *   #8 ← thongBaoDoiMatKhauThatBai()
   *   #10 → AccountDAO.capNhatMatKhauMoi()
   *   #11 ← xacNhanCapNhatThanhCong()
   *   #12 ← thongBaoThayDoiMatKhauThanhCong()
   * @param {object} params
   */
  async guiYeuCauThayDoiMatKhau(params = {}) {
    const accountId = params.user?.accountId;
    const currentPassword = typeof params.currentPassword === 'string' ? params.currentPassword : '';
    const newPassword = typeof params.newPassword === 'string' ? params.newPassword : '';
    if (!accountId) throw new UnauthorizedException();
    if (!currentPassword || newPassword.length < 8 || Buffer.byteLength(newPassword, 'utf8') > 72) {
      throw new ValidationException('Cần nhập mật khẩu hiện tại và mật khẩu mới từ 8 ký tự (tối đa 72 byte)');
    }

    const currentHash = await this.accountDAO.layMatKhauHienTai({ accountId });
    if (!currentHash) throw new NotFoundException('Không tìm thấy tài khoản');
    if (!(await password.compare(currentPassword, currentHash))) {
      throw new ValidationException('Mật khẩu hiện tại không chính xác');
    }
    if (await password.compare(newPassword, currentHash)) {
      throw new ValidationException('Mật khẩu mới phải khác mật khẩu hiện tại');
    }

    const passwordHash = await password.hash(newPassword);
    await this.accountDAO.capNhatMatKhauMoi({ accountId, passwordHash });
    return { updated: true };
  }

  /**
   * UC12. Xem số dư ví - sequence #3: Service khác → AuthService
   * @param {object} params
   */
  async xacThucNguoiDung(params = {}) {
    throw new NotImplementedException('AuthService.xacThucNguoiDung');
  }

  // ---------------------------------------------------------------- Phương thức nội bộ (self-call trong sơ đồ)

  /**
   * UC1. Đăng ký tài khoản - sequence #9: nội bộ
   * @param {object} params
   */
  async kiemTraDinhDangMatKhau(params = {}) {
    throw new NotImplementedException('AuthService.kiemTraDinhDangMatKhau');
  }

  /**
   * UC5. Thay đổi mật khẩu tài khoản - sequence #5: nội bộ
   * @param {object} params
   */
  async kiemTraMatKhauHienTai(params = {}) {
    throw new NotImplementedException('AuthService.kiemTraMatKhauHienTai');
  }

  /**
   * UC5. Thay đổi mật khẩu tài khoản - sequence #6: nội bộ
   * @param {object} params
   */
  async kiemTraDinhDangMatKhauMoi(params = {}) {
    throw new NotImplementedException('AuthService.kiemTraDinhDangMatKhauMoi');
  }

  /**
   * UC5. Thay đổi mật khẩu tài khoản - sequence #7: nội bộ
   * @param {object} params
   */
  async kiemTraMatKhauMoiKhacMatKhauCu(params = {}) {
    throw new NotImplementedException('AuthService.kiemTraMatKhauMoiKhacMatKhauCu');
  }
}

module.exports = AuthService;
