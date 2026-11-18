'use strict';
const BaseService = require('./BaseService');
const { NotImplementedException } = require('../exceptions');
const WithdrawalDAO = require('../dao/WithdrawalDAO');

/**
 * WithdrawalService - tầng Business Logic.
 * Tên phương thức lấy đúng từ sơ đồ sequence; nội dung bên dưới chỉ là khung cần cài đặt.
 */
class WithdrawalService extends BaseService {
  constructor() {
    super();
    this.withdrawalDAO = new WithdrawalDAO();
  }

  // ---------------------------------------------------------------- Phương thức công khai (Route / Service khác gọi)

  /**
   * UC33. Rút doanh thu về ngân hàng - sequence #2: UI → WithdrawalService
   * Vai trò gọi: Developer
   * Luồng theo sơ đồ:
   *   #3 → WithdrawalDAO.kiemTraSoTienKhaDung()
   *   #4 ← traVeSoDuDoanhThu()
   *   #5 ↻ this.kiemTraHanMucRutToiThieu()
   *   #6 ← thongBaoThatBai()
   *   #8 → WithdrawalDAO.taoLenhRutTienVaTamGiuSoDu()
   *   #9 ← xacNhanTaoLenhRutThanhCong()
   *   #10 ← thongBaoGuiYeuCauRutThanhCong()
   * @param {object} params
   */
  async guiYeuCauRutDoanhThu(params = {}) {
    throw new NotImplementedException('WithdrawalService.guiYeuCauRutDoanhThu');
  }

  /**
   * UC57. Phê duyệt rút doanh thu - sequence #2: UI → WithdrawalService
   * Vai trò gọi: Admin, Manager
   * Luồng theo sơ đồ:
   *   #3 → WithdrawalDAO.truyVanChiTietLenhRutVaThongTinNganHang()
   *   #4 ← traVeChiTietLenhRut()
   * @param {object} params
   */
  async layChiTietLenhRutTien(params = {}) {
    throw new NotImplementedException('WithdrawalService.layChiTietLenhRutTien');
  }

  /**
   * UC57. Phê duyệt rút doanh thu - sequence #7: UI → WithdrawalService
   * Vai trò gọi: Admin, Manager
   * Luồng theo sơ đồ:
   *   #8 → WithdrawalDAO.hoanLaiSoDuTamGiuVaoViNPH()
   *   #9 ← xacNhanHoanLaiThanhCong()
   *   #10 ← thongBaoTuChoiThanhCong()
   * @param {object} params
   */
  async guiYeuCauTuChoi(params = {}) {
    throw new NotImplementedException('WithdrawalService.guiYeuCauTuChoi');
  }

  /**
   * UC57. Phê duyệt rút doanh thu - sequence #13: UI → WithdrawalService
   * Vai trò gọi: Admin, Manager
   * Luồng theo sơ đồ:
   *   #14 → BankClient.yeuCauChuyenKhoanNganHang()
   *   #15 ← traVeKetQuaGiaoDich()
   *   #16 → WithdrawalDAO.capNhatTrangThaiRutTienThanhCong()
   *   #17 ← xacNhanCapNhatThanhCong()
   *   #18 ← thongBaoPheDuyetThanhCong()
   *   #20 ← thongBaoChuyenKhoanThatBai()
   * @param {object} params
   */
  async guiYeuCauChuyenKhoan(params = {}) {
    throw new NotImplementedException('WithdrawalService.guiYeuCauChuyenKhoan');
  }

  // ---------------------------------------------------------------- Phương thức nội bộ (self-call trong sơ đồ)

  /**
   * UC33. Rút doanh thu về ngân hàng - sequence #5: nội bộ
   * @param {object} params
   */
  async kiemTraHanMucRutToiThieu(params = {}) {
    throw new NotImplementedException('WithdrawalService.kiemTraHanMucRutToiThieu');
  }
}

module.exports = WithdrawalService;
