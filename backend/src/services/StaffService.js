'use strict';
const BaseService = require('./BaseService');
const StaffDAO = require('../dao/StaffDAO');
const AuditLogService = require('./AuditLogService');
const password = require('../utils/password');
const { ConflictException, NotFoundException, ValidationException } = require('../exceptions');

/**
 * StaffService - tầng Business Logic.
 * Tên phương thức lấy đúng từ sơ đồ sequence; nội dung bên dưới chỉ là khung cần cài đặt.
 */
class StaffService extends BaseService {
  constructor() {
    super();
    this.staffDAO = new StaffDAO();
    this.auditLogService = new AuditLogService();
  }

  // ---------------------------------------------------------------- Phương thức công khai (Route / Service khác gọi)

  /**
   * UC61. Tạo tài khoản nhân sự mới - sequence #4: UI → StaffService
   * Vai trò gọi: Admin
   * Luồng theo sơ đồ:
   *   #5 → StaffDAO.kiemTraTrungLapEmailVaUsername()
   *   #6 ← traVeKetQuaKiemTra()
   *   #7 ← thongBaoTrungLapThongTin()
   *   #9 → StaffDAO.luuTaiKhoanNhanSuMoi()
   *   #10 ← xacNhanTaoThanhCong()
   *   #11 → AuditLogService.ghiNhanNhatKyQuanTri
   *   #12 → AuditLogDAO.luuNhatKyTaoTaiKhoan()
   *   #13 ← xacNhanLuuNhatKyThanhCong()
   *   #14 ← hoanTatGhiNhatKy()
   *   #15 ← thongBaoTaoThanhCong()
   * @param {object} params
   */
  async guiYeuCauTaoTaiKhoan(params = {}) {
    const data = this.validateStaffData(params, true);
    const passwordHash = await password.hash(params.password);
    return this.transaction(async (conn) => {
      if (await this.staffDAO.kiemTraTrungLapEmailVaUsername(data, conn)) {
        throw new ConflictException('Tên tài khoản hoặc email đã được sử dụng');
      }
      const role = await this.staffDAO.kiemTraVaiTroTonTai({ roleId: data.roleId }, conn);
      if (!role) throw new NotFoundException('Không tìm thấy vai trò được chọn');
      const accountId = await this.staffDAO.luuTaiKhoanNhanSuMoi({
        ...data,
        passwordHash,
      }, conn);
      await this.auditLogService.recordLog({
        accountId: params.user.accountId,
        action: 'STAFF_CREATE',
        target: `ACCOUNT:${accountId}`,
        detail: JSON.stringify({ username: data.username, roleId: data.roleId }),
      }, conn);
      return {
        accountId,
        username: data.username,
        email: data.email,
        displayName: data.displayName,
        status: 'Active',
        roleId: data.roleId,
        roleName: role.RoleName,
      };
    });
  }

  /**
   * UC62. Cập nhật thông tin nhân sự - sequence #2: UI → StaffService
   * Vai trò gọi: Admin
   * Luồng theo sơ đồ:
   *   #3 → StaffDAO.truyVanChiTietNhanSu()
   *   #4 ← traVeChiTietNhanSu()
   * @param {object} params
   */
  async layChiTietNhanSu(params = {}) {
    const staff = await this.staffDAO.truyVanChiTietNhanSu({ accountId: params.accountId });
    if (!staff) throw new NotFoundException('Không tìm thấy nhân sự');
    return this.toStaffResponse(staff);
  }

  /**
   * UC62. Cập nhật thông tin nhân sự - sequence #7: UI → StaffService
   * Vai trò gọi: Admin
   * Luồng theo sơ đồ:
   *   #8 ↻ this.kiemTraDinhDangDuLieu()
   *   #9 ← thongBaoDuLieuKhongHopLe()
   *   #11 → StaffDAO.capNhatThongTinNhanSu()
   *   #12 ← xacNhanCapNhatThanhCong()
   *   #13 → AuditLogService.ghiNhanNhatKyQuanTri
   *   #14 → AuditLogDAO.luuNhatKyCapNhatNhanSu()
   *   #15 ← xacNhanLuuNhatKyThanhCong()
   *   #16 ← hoanTatGhiNhatKy()
   *   #17 ← thongBaoCapNhatThanhCong()
   * @param {object} params
   */
  async guiYeuCauCapNhatThongTin(params = {}) {
    const data = this.validateStaffData(params, false);
    return this.transaction(async (conn) => {
      const current = await this.staffDAO.truyVanChiTietNhanSu({ accountId: params.accountId }, conn);
      if (!current) throw new NotFoundException('Không tìm thấy nhân sự');
      if (await this.staffDAO.kiemTraTrungLapEmailVaUsername({
        username: current.Username,
        email: data.email,
        accountId: params.accountId,
      }, conn)) {
        throw new ConflictException('Email đã được sử dụng');
      }
      const role = await this.staffDAO.kiemTraVaiTroTonTai({ roleId: data.roleId }, conn);
      if (!role) throw new NotFoundException('Không tìm thấy vai trò được chọn');
      const updated = await this.staffDAO.capNhatThongTinNhanSu({
        ...data,
        accountId: params.accountId,
      }, conn);
      await this.auditLogService.recordLog({
        accountId: params.user.accountId,
        action: 'STAFF_UPDATE',
        target: `ACCOUNT:${params.accountId}`,
        detail: JSON.stringify({
          email: data.email,
          displayName: data.displayName,
          previousRoleId: current.RoleID,
          roleId: data.roleId,
        }),
      }, conn);
      return this.toStaffResponse(updated);
    });
  }

  async layDanhSachNhanSu() {
    return (await this.staffDAO.truyVanDanhSachNhanSu()).map((staff) => this.toStaffResponse(staff));
  }

  toStaffResponse(staff) {
    return {
      accountId: staff.AccountID,
      username: staff.Username,
      email: staff.Email,
      displayName: staff.DisplayName,
      status: staff.Status,
      createdAt: staff.CreatedAt,
      roleId: staff.RoleID,
      roleName: staff.RoleName,
    };
  }

  async capNhatTrangThaiNhanSu(params = {}) {
    return this.capNhatTrangThai(params);
  }

  async capNhatTrangThai(params = {}) {
    const status = params.status;
    if (!['Active', 'Suspended'].includes(status)) {
      throw new ValidationException('Trạng thái nhân sự chỉ có thể là Active hoặc Suspended');
    }
    if (status === 'Suspended' && params.user.accountId === params.accountId) {
      throw new ConflictException('Không thể tự khóa tài khoản đang đăng nhập');
    }
    return this.transaction(async (conn) => {
      const staff = await this.staffDAO.truyVanChiTietNhanSu({ accountId: params.accountId }, conn);
      if (!staff) throw new NotFoundException('Không tìm thấy nhân sự');
      await this.staffDAO.capNhatTrangThai({ accountId: params.accountId, status }, conn);
      await this.auditLogService.recordLog({
        accountId: params.user.accountId,
        action: status === 'Suspended' ? 'STAFF_SUSPEND' : 'STAFF_ACTIVATE',
        target: `ACCOUNT:${params.accountId}`,
        detail: JSON.stringify({ previousStatus: staff.Status, status }),
      }, conn);
      return { accountId: params.accountId, status };
    });
  }

  validateStaffData(params = {}, includeUsername) {
    const username = typeof params.username === 'string' ? params.username.trim() : '';
    const email = typeof params.email === 'string' ? params.email.trim().toLowerCase() : '';
    const displayName = typeof params.displayName === 'string' ? params.displayName.trim() : '';
    const passwordValue = typeof params.password === 'string' ? params.password : '';
    const roleId = typeof params.roleId === 'string' ? params.roleId.trim() : '';
    if (includeUsername && !/^[A-Za-z0-9._-]{3,30}$/.test(username)) {
      throw new ValidationException('Tên tài khoản cần từ 3 đến 30 ký tự hợp lệ');
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 100) {
      throw new ValidationException('Email không hợp lệ');
    }
    if (!displayName || displayName.length > 50) {
      throw new ValidationException('Tên hiển thị là bắt buộc và tối đa 50 ký tự');
    }
    if (includeUsername && (passwordValue.length < 8 || Buffer.byteLength(passwordValue, 'utf8') > 72)) {
      throw new ValidationException('Mật khẩu cần ít nhất 8 ký tự và tối đa 72 byte');
    }
    if (!roleId) throw new ValidationException('RoleID là bắt buộc');
    return { username, email, displayName, roleId };
  }

  // ---------------------------------------------------------------- Phương thức nội bộ (self-call trong sơ đồ)

  /**
   * UC62. Cập nhật thông tin nhân sự - sequence #8: nội bộ
   * @param {object} params
   */
  async kiemTraDinhDangDuLieu(params = {}) {
    return this.validateStaffData(params, Boolean(params.username));
  }
}

module.exports = StaffService;
