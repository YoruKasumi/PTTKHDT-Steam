'use strict';
const BaseService = require('./BaseService');
const { NotImplementedException } = require('../exceptions');
const AccountDAO = require('../dao/AccountDAO');

/**
 * AuthService - tầng Business Logic.
 * Tên phương thức lấy đúng từ sơ đồ sequence; nội dung bên dưới chỉ là khung cần cài đặt.
 */
class AuthService extends BaseService {
  constructor() {
    super();
    this.accountDAO = new AccountDAO();
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
    throw new NotImplementedException('AuthService.guiThongTinDangKy');
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
    throw new NotImplementedException('AuthService.guiThongTinDangNhap');
  }

  /**
   * UC3. Đăng xuất khỏi hệ thống - sequence #2: UI → AuthService
   * Vai trò gọi: Authenticated
   * Luồng theo sơ đồ:
   *   #4 ← thongBaoDangXuatThanhCong()
   * @param {object} params
   */
  async guiYeuCauDangXuat(params = {}) {
    throw new NotImplementedException('AuthService.guiYeuCauDangXuat');
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
    throw new NotImplementedException('AuthService.guiYeuCauThayDoiMatKhau');
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
