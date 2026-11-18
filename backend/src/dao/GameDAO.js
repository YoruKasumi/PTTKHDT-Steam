'use strict';
const BaseDAO = require('./BaseDAO');
const { NotImplementedException } = require('../exceptions');

class GameDAO extends BaseDAO {
  /**
   * UC6. Tìm kiếm sản phẩm (#3)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async timKiemSanPhamTheoTuKhoa(params = {}, conn = null) {
    throw new NotImplementedException('GameDAO.timKiemSanPhamTheoTuKhoa');
  }

  /**
   * UC6. Tìm kiếm sản phẩm (#9)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async truyVanSanPhamTheoTheLoai(params = {}, conn = null) {
    throw new NotImplementedException('GameDAO.truyVanSanPhamTheoTheLoai');
  }

  /**
   * UC6. Tìm kiếm sản phẩm (#12)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async truyVanSanPhamTheoKhoangGia(params = {}, conn = null) {
    throw new NotImplementedException('GameDAO.truyVanSanPhamTheoKhoangGia');
  }

  /**
   * UC6. Tìm kiếm sản phẩm (#15)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async truyVanSanPhamTheoTrangThaiSale(params = {}, conn = null) {
    throw new NotImplementedException('GameDAO.truyVanSanPhamTheoTrangThaiSale');
  }

  /**
   * UC6. Tìm kiếm sản phẩm (#21)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async layDanhSachTheoNgayPhatHanh(params = {}, conn = null) {
    throw new NotImplementedException('GameDAO.layDanhSachTheoNgayPhatHanh');
  }

  /**
   * UC6. Tìm kiếm sản phẩm (#24)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async layDanhSachTheoDoPhoBien(params = {}, conn = null) {
    throw new NotImplementedException('GameDAO.layDanhSachTheoDoPhoBien');
  }

  /**
   * UC6. Tìm kiếm sản phẩm (#27)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async layDanhSachTheoGia(params = {}, conn = null) {
    throw new NotImplementedException('GameDAO.layDanhSachTheoGia');
  }

  /**
   * UC7. Xem chi tiết sản phẩm (#3)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async layThongTinSanPham(params = {}, conn = null) {
    throw new NotImplementedException('GameDAO.layThongTinSanPham');
  }

  /**
   * UC7. Xem chi tiết sản phẩm (#5)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async layThongTinCoBan(params = {}, conn = null) {
    throw new NotImplementedException('GameDAO.layThongTinCoBan');
  }

  /**
   * UC7. Xem chi tiết sản phẩm (#8)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async layCauHinhYeuCau(params = {}, conn = null) {
    throw new NotImplementedException('GameDAO.layCauHinhYeuCau');
  }

  /**
   * UC7. Xem chi tiết sản phẩm (#11)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async layDanhSachDanhGia(params = {}, conn = null) {
    throw new NotImplementedException('GameDAO.layDanhSachDanhGia');
  }

  /**
   * UC9. Thêm game vào giỏ hàng (#8)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async kiemTraGameDaSoHuu(params = {}, conn = null) {
    throw new NotImplementedException('GameDAO.kiemTraGameDaSoHuu');
  }

  /**
   * UC15. Thanh toán (#20)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async luuBanQuyenGame(params = {}, conn = null) {
    throw new NotImplementedException('GameDAO.luuBanQuyenGame');
  }

  /**
   * UC24. Cập nhật Patch & Changelog (#3)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async truyVanThongTinGame(params = {}, conn = null) {
    throw new NotImplementedException('GameDAO.truyVanThongTinGame');
  }

  /**
   * UC24. Cập nhật Patch & Changelog (#12)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async capNhatPhienBanMoi(params = {}, conn = null) {
    throw new NotImplementedException('GameDAO.capNhatPhienBanMoi');
  }

  /**
   * UC25. Khởi tạo dự án game mới (#5)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async kiemTraTenGameTrungLap(params = {}, conn = null) {
    throw new NotImplementedException('GameDAO.kiemTraTenGameTrungLap');
  }

  /**
   * UC25. Khởi tạo dự án game mới (#13)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async taoBanGhiDuAnMoi(params = {}, conn = null) {
    throw new NotImplementedException('GameDAO.taoBanGhiDuAnMoi');
  }

  /**
   * UC26. Thiết lập giá bán VND (#6)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async capNhatGiaBanVND(params = {}, conn = null) {
    throw new NotImplementedException('GameDAO.capNhatGiaBanVND');
  }

  /**
   * UC29. Rollback phiên bản Build (#3)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async kiemTraDanhSachPhienBanLuuTru(params = {}, conn = null) {
    throw new NotImplementedException('GameDAO.kiemTraDanhSachPhienBanLuuTru');
  }

  /**
   * UC29. Rollback phiên bản Build (#10)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async capNhatPhienBanHienTai(params = {}, conn = null) {
    throw new NotImplementedException('GameDAO.capNhatPhienBanHienTai');
  }

  /**
   * UC34. Cập nhật trạng thái Game (#3)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async kiemTraTrangThaiGameHienTai(params = {}, conn = null) {
    throw new NotImplementedException('GameDAO.kiemTraTrangThaiGameHienTai');
  }

  /**
   * UC34. Cập nhật trạng thái Game (#8)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async capNhatTrangThaiGameMoi(params = {}, conn = null) {
    throw new NotImplementedException('GameDAO.capNhatTrangThaiGameMoi');
  }

  /**
   * UC35. Gỡ game khỏi hệ thống (#3)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async kiemTraSoLuongNguoiChoiSoHuu(params = {}, conn = null) {
    throw new NotImplementedException('GameDAO.kiemTraSoLuongNguoiChoiSoHuu');
  }

  /**
   * UC35. Gỡ game khỏi hệ thống (#8)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async capNhatTrangThaiDelisted(params = {}, conn = null) {
    throw new NotImplementedException('GameDAO.capNhatTrangThaiDelisted');
  }

  /**
   * UC36. Ẩn game (#3)
   * @param {object} params
   * @param {object} [conn] kết nối transaction (nếu có)
   */
  async capNhatTrangThaiAnGame(params = {}, conn = null) {
    throw new NotImplementedException('GameDAO.capNhatTrangThaiAnGame');
  }
}

module.exports = GameDAO;
