'use strict';
const BaseService = require('./BaseService');
const { NotImplementedException } = require('../exceptions');
const DeveloperDAO = require('../dao/DeveloperDAO');

/**
 * DeveloperService - tầng Business Logic.
 * Tên phương thức lấy đúng từ sơ đồ sequence; nội dung bên dưới chỉ là khung cần cài đặt.
 */
class DeveloperService extends BaseService {
  constructor() {
    super();
    this.developerDAO = new DeveloperDAO();
  }

  // ---------------------------------------------------------------- Phương thức công khai (Route / Service khác gọi)

  /**
   * UC23. Đăng ký hồ sơ nhà phát hành - sequence #4: UI → DeveloperService
   * Vai trò gọi: Customer
   * Luồng theo sơ đồ:
   *   #5 → DeveloperDAO.kiemTraThongTinPhapNhan()
   *   #6 ← traVeKetQuaKiemTra()
   *   #7 ← thongBaoThongTinKhongHopLe()
   *   #11 → PaymentGatewayClient.xuLyThanhToanPhi()
   *   #13 ← xacNhanThanhToanThanhCong()
   *   #14 ← thongBaoThanhToanThanhCong()
   * @param {object} params
   */
  async guiThongTinDangKy(params = {}) {
    throw new NotImplementedException('DeveloperService.guiThongTinDangKy');
  }

  /**
   * UC23. Đăng ký hồ sơ nhà phát hành - sequence #15: UI → DeveloperService
   * Vai trò gọi: Customer
   * Luồng theo sơ đồ:
   *   #16 → DeveloperDAO.capNhatVaiTroTaiKhoan()
   *   #17 ← xacNhanNangCapThanhCong()
   * @param {object} params
   */
  async nangCapVaiTroDeveloper(params = {}) {
    throw new NotImplementedException('DeveloperService.nangCapVaiTroDeveloper');
  }
}

module.exports = DeveloperService;
