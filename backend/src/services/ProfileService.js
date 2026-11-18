'use strict';
const BaseService = require('./BaseService');
const { NotImplementedException } = require('../exceptions');
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
    throw new NotImplementedException('ProfileService.guiTenHienThiMoi');
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
    throw new NotImplementedException('ProfileService.guiAnhDaiDien');
  }
}

module.exports = ProfileService;
