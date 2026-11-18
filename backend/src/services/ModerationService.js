'use strict';
const BaseService = require('./BaseService');
const { NotImplementedException } = require('../exceptions');
const ModerationDAO = require('../dao/ModerationDAO');

/**
 * ModerationService - tầng Business Logic.
 * Tên phương thức lấy đúng từ sơ đồ sequence; nội dung bên dưới chỉ là khung cần cài đặt.
 */
class ModerationService extends BaseService {
  constructor() {
    super();
    this.moderationDAO = new ModerationDAO();
    this.auditLogService = null; // được gắn trong services/index.js
  }

  // ---------------------------------------------------------------- Phương thức công khai (Route / Service khác gọi)

  /**
   * UC38. Kiểm tra thông tin game mới - sequence #2: UI → ModerationService
   * Vai trò gọi: Admin, Manager
   * Luồng theo sơ đồ:
   *   #3 → ModerationDAO.truyVanDanhSachGameChoDuyet()
   *   #4 ← traVeDanhSachGameChoDuyet()
   * @param {object} params
   */
  async yeuCauLayHoSoGameChoDuyet(params = {}) {
    throw new NotImplementedException('ModerationService.yeuCauLayHoSoGameChoDuyet');
  }

  /**
   * UC38. Kiểm tra thông tin game mới - sequence #7: UI → ModerationService
   * Vai trò gọi: Admin, Manager
   * Luồng theo sơ đồ:
   *   #8 → ModerationDAO.truyVanChiTietGame()
   *   #9 ← traVeChiTietGame()
   * @param {object} params
   */
  async layChiTietHoSoGame(params = {}) {
    throw new NotImplementedException('ModerationService.layChiTietHoSoGame');
  }

  /**
   * UC38. Kiểm tra thông tin game mới - sequence #12: UI → ModerationService
   * Vai trò gọi: Admin, Manager
   * Luồng theo sơ đồ:
   *   #13 → ModerationDAO.luuTrangThaiDaKiemTra()
   *   #14 ← xacNhanLuuThanhCong()
   *   #15 ← thongBaoKiemTraHoanTat()
   * @param {object} params
   */
  async capNhatTrangThaiDaKiemTra(params = {}) {
    throw new NotImplementedException('ModerationService.capNhatTrangThaiDaKiemTra');
  }

  /**
   * UC39. Phê duyệt phát hành game - sequence #2: UI → ModerationService
   * Vai trò gọi: Admin, Manager
   * Luồng theo sơ đồ:
   *   #3 → ModerationDAO.kiemTraTrangThaiGameVaFile()
   *   #4 ← traVeKetQuaKiemTra()
   *   #5 ← thongBaoGameKhongDuDieuKien()
   *   #7 → ModerationDAO.capNhatTrangThaiPhatHanhStore()
   *   #8 ← xacNhanCapNhatThanhCong()
   *   #9 → AuditLogService.ghiNhanNhatKyQuanTri
   *   #10 → AuditLogDAO.luuNhatKyPheDuyet()
   *   #11 ← xacNhanLuuNhatKyThanhCong()
   *   #12 ← hoanTatGhiNhatKy()
   *   #13 ← thongBaoPheDuyetThanhCong()
   * @param {object} params
   */
  async yeuCauPheDuyetGame(params = {}) {
    throw new NotImplementedException('ModerationService.yeuCauPheDuyetGame');
  }

  /**
   * UC40. Từ chối phát hành game - sequence #4: UI → ModerationService
   * Vai trò gọi: Admin, Manager
   * Luồng theo sơ đồ:
   *   #5 ↻ this.kiemTraLyDoKhongDuocDeTrong()
   *   #6 ← thongBaoChuaDienLyDo()
   *   #8 → ModerationDAO.capNhatTrangThaiRejected()
   *   #9 ← xacNhanCapNhatThanhCong()
   *   #10 → AuditLogService.ghiNhanNhatKyQuanTri
   *   #11 → AuditLogDAO.luuNhatKyTuChoi()
   *   #12 ← xacNhanLuuNhatKyThanhCong()
   *   #13 ← hoanTatGhiNhatKy()
   *   #14 ← thongBaoTuChoiThanhCong()
   * @param {object} params
   */
  async guiYeuCauTuChoiKemLyDo(params = {}) {
    throw new NotImplementedException('ModerationService.guiYeuCauTuChoiKemLyDo');
  }

  /**
   * UC41. Gỡ bỏ game khẩn cấp - sequence #4: UI → ModerationService
   * Vai trò gọi: Admin, Manager
   * Luồng theo sơ đồ:
   *   #5 → ModerationDAO.capNhatTrangThaiDelisted()
   *   #6 ← xacNhanCapNhatThanhCong()
   *   #7 → AuditLogService.ghiNhanNhatKyQuanTri
   *   #8 → AuditLogDAO.luuNhatKyGoBoKhanCap()
   *   #9 ← xacNhanLuuNhatKyThanhCong()
   *   #10 ← hoanTatGhiNhatKy()
   *   #11 ← thongBaoGoBoGameThanhCong()
   * @param {object} params
   */
  async yeuCauGoBoGameKhanCap(params = {}) {
    throw new NotImplementedException('ModerationService.yeuCauGoBoGameKhanCap');
  }

  /**
   * UC43. Xử lý đánh giá vi phạm - sequence #4: UI → ModerationService
   * Vai trò gọi: Admin, Manager
   * Luồng theo sơ đồ:
   *   #5 → ModerationDAO.capNhatTrangThaiAnHoacXoaDanhGia()
   *   #6 ← xacNhanCapNhatThanhCong()
   *   #7 → AuditLogService.ghiNhanNhatKyQuanTri
   *   #8 → AuditLogDAO.luuNhatKyXuLyDanhGia()
   *   #9 ← xacNhanLuuNhatKyThanhCong()
   *   #10 ← hoanTatGhiNhatKy()
   *   #11 ← thongBaoXuLyDanhGiaThanhCong()
   * @param {object} params
   */
  async yeuCauXuLyDanhGiaViPham(params = {}) {
    throw new NotImplementedException('ModerationService.yeuCauXuLyDanhGiaViPham');
  }

  /**
   * UC47. Giám sát nội dung cộng đồng - sequence #2: UI → ModerationService
   * Vai trò gọi: Admin, Manager
   * Luồng theo sơ đồ:
   *   #3 → ModerationDAO.truyVanNoiDungBiGanCo()
   *   #4 ← traVeDanhSachNoiDungGanCo()
   * @param {object} params
   */
  async yeuCauDanhSachNoiDungGanCo(params = {}) {
    throw new NotImplementedException('ModerationService.yeuCauDanhSachNoiDungGanCo');
  }

  /**
   * UC47. Giám sát nội dung cộng đồng - sequence #7: UI → ModerationService
   * Vai trò gọi: Admin, Manager
   * Luồng theo sơ đồ:
   *   #8 → ModerationDAO.luuTrangThaiKiemDuyet()
   *   #9 ← xacNhanLuuThanhCong()
   *   #10 ← thongBaoCapNhatThanhCong()
   * @param {object} params
   */
  async capNhatTrangThaiKiemDuyet(params = {}) {
    throw new NotImplementedException('ModerationService.capNhatTrangThaiKiemDuyet');
  }

  // ---------------------------------------------------------------- Phương thức nội bộ (self-call trong sơ đồ)

  /**
   * UC40. Từ chối phát hành game - sequence #5: nội bộ
   * @param {object} params
   */
  async kiemTraLyDoKhongDuocDeTrong(params = {}) {
    throw new NotImplementedException('ModerationService.kiemTraLyDoKhongDuocDeTrong');
  }
}

module.exports = ModerationService;
