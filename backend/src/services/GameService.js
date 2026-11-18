'use strict';
const BaseService = require('./BaseService');
const { NotImplementedException } = require('../exceptions');
const GameDAO = require('../dao/GameDAO');

/**
 * GameService - tầng Business Logic.
 * Tên phương thức lấy đúng từ sơ đồ sequence; nội dung bên dưới chỉ là khung cần cài đặt.
 */
class GameService extends BaseService {
  constructor() {
    super();
    this.gameDAO = new GameDAO();
  }

  // ---------------------------------------------------------------- Phương thức công khai (Route / Service khác gọi)

  /**
   * UC9. Thêm game vào giỏ hàng - sequence #7: Service khác → GameService
   * UC11. Quản lý Wishlist - sequence #3: Service khác → GameService
   * @param {object} params
   */
  async kiemTraBanQuyenSanPham(params = {}) {
    throw new NotImplementedException('GameService.kiemTraBanQuyenSanPham');
  }

  /**
   * UC15. Thanh toán - sequence #19: Service khác → GameService
   * @param {object} params
   */
  async capPhatBanQuyen(params = {}) {
    throw new NotImplementedException('GameService.capPhatBanQuyen');
  }

  /**
   * UC24. Cập nhật Patch & Changelog - sequence #2: UI → GameService
   * UC25. Khởi tạo dự án game mới - sequence #4: UI → GameService
   * Vai trò gọi: Developer
   * Luồng theo sơ đồ:
   *   #3 → GameDAO.truyVanThongTinGame()
   *   #4 ← traVeTrangThaiGame()
   *   #5 ← thongBaoGameKhongHopLe()
   *   #5 → GameDAO.kiemTraTenGameTrungLap()
   *   #6 ← traVeKetQuaKiemTraTen()
   *   #7 → StorageClient.taiLenTepCaiDatTam()
   *   #8 ← traVeDuongDanTam()
   * @param {object} params
   */
  async kiemTraThongTinGame(params = {}) {
    throw new NotImplementedException('GameService.kiemTraThongTinGame');
  }

  /**
   * UC24. Cập nhật Patch & Changelog - sequence #9: UI → GameService
   * Vai trò gọi: Developer
   * Luồng theo sơ đồ:
   *   #10 → StorageClient.luuTruBanVa()
   *   #11 ← xacNhanLuuTru()
   *   #12 → GameDAO.capNhatPhienBanMoi()
   *   #13 ← xacNhanCapNhatThanhCong()
   *   #14 ← thongBaoCapNhatThanhCong()
   * @param {object} params
   */
  async guiGoiCapNhat(params = {}) {
    throw new NotImplementedException('GameService.guiGoiCapNhat');
  }

  /**
   * UC25. Khởi tạo dự án game mới - sequence #9: UI → GameService
   * Vai trò gọi: Developer
   * Luồng theo sơ đồ:
   *   #10 ← traVeKetQuaQuetVirus()
   * @param {object} params
   */
  async guiYeuCauQuetVirus(params = {}) {
    throw new NotImplementedException('GameService.guiYeuCauQuetVirus');
  }

  /**
   * UC25. Khởi tạo dự án game mới - sequence #12: UI → GameService
   * Vai trò gọi: Developer
   * Luồng theo sơ đồ:
   *   #13 → GameDAO.taoBanGhiDuAnMoi()
   *   #14 ← xacNhanLuuDuAnThanhCong()
   *   #15 ← thongBaoKhoiTaoThanhCong()
   * @param {object} params
   */
  async luuHoSoDuAnGame(params = {}) {
    throw new NotImplementedException('GameService.luuHoSoDuAnGame');
  }

  /**
   * UC26. Thiết lập giá bán VND - sequence #2: UI → GameService
   * Vai trò gọi: Developer
   * Luồng theo sơ đồ:
   *   #3 ↻ this.kiemTraGiaBanHopLe()
   *   #6 → GameDAO.capNhatGiaBanVND()
   *   #7 ← xacNhanCapNhatGiaThanhCong()
   *   #8 ← thongBaoThietLapGiaThanhCong()
   * @param {object} params
   */
  async yeuCauThietLapGia(params = {}) {
    throw new NotImplementedException('GameService.yeuCauThietLapGia');
  }

  /**
   * UC29. Rollback phiên bản Build - sequence #2: UI → GameService
   * Vai trò gọi: Developer
   * Luồng theo sơ đồ:
   *   #3 → GameDAO.kiemTraDanhSachPhienBanLuuTru()
   *   #4 ← traVeDanhSachPhienBanCu()
   *   #5 ← thongBaoKhongTheRollback()
   * @param {object} params
   */
  async yeuCauRollbackPhienBan(params = {}) {
    throw new NotImplementedException('GameService.yeuCauRollbackPhienBan');
  }

  /**
   * UC29. Rollback phiên bản Build - sequence #9: UI → GameService
   * Vai trò gọi: Developer
   * Luồng theo sơ đồ:
   *   #10 → GameDAO.capNhatPhienBanHienTai()
   *   #11 ← xacNhanCapNhatThanhCong()
   *   #12 ← thongBaoRollbackThanhCong()
   * @param {object} params
   */
  async xacNhanKhoiPhucPhienBan(params = {}) {
    throw new NotImplementedException('GameService.xacNhanKhoiPhucPhienBan');
  }

  /**
   * UC34. Cập nhật trạng thái Game - sequence #2: UI → GameService
   * Vai trò gọi: Developer
   * Luồng theo sơ đồ:
   *   #3 → GameDAO.kiemTraTrangThaiGameHienTai()
   *   #4 ← traVeTrangThaiHienTai()
   *   #5 ↻ this.kiemTraChuyenDoiHopLe()
   *   #6 ← thongBaoTrangThaiKhongHopLe()
   *   #8 → GameDAO.capNhatTrangThaiGameMoi()
   *   #9 ← xacNhanCapNhatThanhCong()
   *   #10 ← thongBaoCapNhatTrangThaiThanhCong()
   * @param {object} params
   */
  async yeuCauCapNhatTrangThaiGame(params = {}) {
    throw new NotImplementedException('GameService.yeuCauCapNhatTrangThaiGame');
  }

  /**
   * UC35. Gỡ game khỏi hệ thống - sequence #2: UI → GameService
   * Vai trò gọi: Developer
   * Luồng theo sơ đồ:
   *   #3 → GameDAO.kiemTraSoLuongNguoiChoiSoHuu()
   *   #4 ← traVeSoLuongNguoiChoi()
   * @param {object} params
   */
  async yeuCauGoGame(params = {}) {
    throw new NotImplementedException('GameService.yeuCauGoGame');
  }

  /**
   * UC35. Gỡ game khỏi hệ thống - sequence #7: UI → GameService
   * Vai trò gọi: Developer
   * Luồng theo sơ đồ:
   *   #8 → GameDAO.capNhatTrangThaiDelisted()
   *   #9 ← xacNhanDelistedThanhCong()
   *   #10 ← thongBaoGoGameThanhCong()
   * @param {object} params
   */
  async thucHienGoGameKhoiHeThong(params = {}) {
    throw new NotImplementedException('GameService.thucHienGoGameKhoiHeThong');
  }

  /**
   * UC36. Ẩn game - sequence #2: UI → GameService
   * Vai trò gọi: Developer
   * Luồng theo sơ đồ:
   *   #3 → GameDAO.capNhatTrangThaiAnGame()
   *   #4 ← xacNhanCapNhatThanhCong()
   *   #5 ← thongBaoAnGameThanhCong()
   * @param {object} params
   */
  async yeuCauAnGame(params = {}) {
    throw new NotImplementedException('GameService.yeuCauAnGame');
  }

  // ---------------------------------------------------------------- Phương thức nội bộ (self-call trong sơ đồ)

  /**
   * UC26. Thiết lập giá bán VND - sequence #3: nội bộ
   * @param {object} params
   */
  async kiemTraGiaBanHopLe(params = {}) {
    throw new NotImplementedException('GameService.kiemTraGiaBanHopLe');
  }

  /**
   * UC34. Cập nhật trạng thái Game - sequence #5: nội bộ
   * @param {object} params
   */
  async kiemTraChuyenDoiHopLe(params = {}) {
    throw new NotImplementedException('GameService.kiemTraChuyenDoiHopLe');
  }
}

module.exports = GameService;
