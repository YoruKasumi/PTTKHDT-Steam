'use strict';
const BaseDAO = require('./BaseDAO');
const { NotImplementedException } = require('../exceptions');

class GameDAO extends BaseDAO {
  /**
   * UC6. Tìm kiếm sản phẩm (#3)
   */
  async timKiemSanPhamTheoTuKhoa(params = {}, conn = null) {
    throw new NotImplementedException('GameDAO.timKiemSanPhamTheoTuKhoa');
  }

  /**
   * UC6. Tìm kiếm sản phẩm (#9)
   */
  async truyVanSanPhamTheoTheLoai(params = {}, conn = null) {
    throw new NotImplementedException('GameDAO.truyVanSanPhamTheoTheLoai');
  }

  /**
   * UC6. Tìm kiếm sản phẩm (#12)
   */
  async truyVanSanPhamTheoKhoangGia(params = {}, conn = null) {
    throw new NotImplementedException('GameDAO.truyVanSanPhamTheoKhoangGia');
  }

  /**
   * UC6. Tìm kiếm sản phẩm (#15)
   */
  async truyVanSanPhamTheoTrangThaiSale(params = {}, conn = null) {
    throw new NotImplementedException('GameDAO.truyVanSanPhamTheoTrangThaiSale');
  }

  /**
   * UC6. Tìm kiếm sản phẩm (#21)
   */
  async layDanhSachTheoNgayPhatHanh(params = {}, conn = null) {
    throw new NotImplementedException('GameDAO.layDanhSachTheoNgayPhatHanh');
  }

  /**
   * UC6. Tìm kiếm sản phẩm (#24)
   */
  async layDanhSachTheoDoPhoBien(params = {}, conn = null) {
    throw new NotImplementedException('GameDAO.layDanhSachTheoDoPhoBien');
  }

  /**
   * UC6. Tìm kiếm sản phẩm (#27)
   */
  async layDanhSachTheoGia(params = {}, conn = null) {
    throw new NotImplementedException('GameDAO.layDanhSachTheoGia');
  }

  /**
   * UC7. Xem chi tiết sản phẩm (#3)
   */
  async layThongTinSanPham(params = {}, conn = null) {
    throw new NotImplementedException('GameDAO.layThongTinSanPham');
  }

  /**
   * UC7. Xem chi tiết sản phẩm (#5)
   */
  async layThongTinCoBan(params = {}, conn = null) {
    throw new NotImplementedException('GameDAO.layThongTinCoBan');
  }

  /**
   * UC7. Xem chi tiết sản phẩm (#8)
   */
  async layCauHinhYeuCau(params = {}, conn = null) {
    throw new NotImplementedException('GameDAO.layCauHinhYeuCau');
  }

  /**
   * UC7. Xem chi tiết sản phẩm (#11)
   */
  async layDanhSachDanhGia(params = {}, conn = null) {
    throw new NotImplementedException('GameDAO.layDanhSachDanhGia');
  }

  /**
   * UC9. Thêm game vào giỏ hàng (#8)
   */
  async kiemTraGameDaSoHuu(params = {}, conn = null) {
    throw new NotImplementedException('GameDAO.kiemTraGameDaSoHuu');
  }

  /**
   * UC15. Thanh toán (#20)
   */
  async luuBanQuyenGame(params = {}, conn = null) {
    throw new NotImplementedException('GameDAO.luuBanQuyenGame');
  }

  /**
   * UC24. Cập nhật Patch & Changelog (#3) — Truy vấn thông tin game + phiên bản hiện hành.
   * @param {{ gameId: string, developerId: string }} params
   */
  async truyVanThongTinGame(params = {}, conn = null) {
    return this.one(
      `SELECT g.GameID, g.DeveloperID, g.Title, g.Status,
              gv.VersionID, gv.VersionNumber, gv.BuildFile, gv.FileSize, gv.Sha256
       FROM GAME g
       LEFT JOIN GAMEVERSION gv ON gv.GameID = g.GameID AND gv.IsCurrent = 1
       WHERE g.GameID = ? AND g.DeveloperID = ?
       LIMIT 1`,
      [params.gameId, params.developerId],
      conn,
    );
  }

  /**
   * UC24. Upload patch — Đặt IsCurrent = 0 cho tất cả version của game (phải gọi trước INSERT).
   * @param {{ gameId: string }} params
   */
  async resetCurrentVersion(params = {}, conn = null) {
    return this.query(
      'UPDATE GAMEVERSION SET IsCurrent = 0 WHERE GameID = ?',
      [params.gameId],
      conn,
    );
  }

  /**
   * UC24. Cập nhật Patch & Changelog (#12) — INSERT bản vá mới (IsCurrent = 1).
   * @param {{ gameId, versionNumber, buildFile, fileSize, sha256, changeLog }} params
   */
  async capNhatPhienBanMoi(params = {}, conn = null) {
    await this.query(
      `INSERT INTO GAMEVERSION (GameID, VersionNumber, BuildFile, FileSize, Sha256, ChangeLog, IsCurrent)
       VALUES (?, ?, ?, ?, ?, ?, 1)`,
      [params.gameId, params.versionNumber, params.buildFile, params.fileSize, params.sha256, params.changeLog || null],
      conn,
    );
  }

  /**
   * UC25. Khởi tạo dự án game mới (#5) — Kiểm tra title trùng.
   * @param {{ title: string }} params
   */
  async kiemTraTenGameTrungLap(params = {}, conn = null) {
    return this.one(
      'SELECT GameID FROM GAME WHERE Title = ? LIMIT 1',
      [params.title],
      conn,
    );
  }

  /**
   * UC25. Khởi tạo dự án game mới (#13) — INSERT game + version đầu tiên + genres (transaction).
   * @param {{ gameId, developerId, title, description, price, coverImage, trailerUrl, minSpec, recSpec, genreIds, buildFile, fileSize, sha256, versionNumber, changeLog }} params
   */
  async taoBanGhiDuAnMoi(params = {}, conn = null) {
    // INSERT GAME
    await this.query(
      `INSERT INTO GAME (GameID, DeveloperID, Title, Description, Price, CoverImage, TrailerUrl, MinSpec, RecSpec, Status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending')`,
      [
        params.gameId, params.developerId, params.title, params.description,
        params.price, params.coverImage || '', params.trailerUrl || null,
        params.minSpec || '', params.recSpec || '',
      ],
      conn,
    );

    // INSERT GAMEVERSION (IsCurrent = 1 — không cần reset vì game mới)
    await this.query(
      `INSERT INTO GAMEVERSION (GameID, VersionNumber, BuildFile, FileSize, Sha256, ChangeLog, IsCurrent)
       VALUES (?, ?, ?, ?, ?, ?, 1)`,
      [params.gameId, params.versionNumber || '1.0.0', params.buildFile, params.fileSize, params.sha256, params.changeLog || null],
      conn,
    );

    // INSERT GAME_GENRE
    if (Array.isArray(params.genreIds) && params.genreIds.length > 0) {
      for (const genreId of params.genreIds) {
        await this.query(
          'INSERT IGNORE INTO GAME_GENRE (GameID, GenreID) VALUES (?, ?)',
          [params.gameId, genreId],
          conn,
        );
      }
    }
  }

  /**
   * UC26. Thiết lập giá bán VND (#6)
   */
  async capNhatGiaBanVND(params = {}, conn = null) {
    throw new NotImplementedException('GameDAO.capNhatGiaBanVND');
  }

  /**
   * UC29. Rollback phiên bản Build (#3) — Lấy danh sách tất cả phiên bản của game.
   * @param {{ gameId: string, developerId: string }} params
   */
  async kiemTraDanhSachPhienBanLuuTru(params = {}, conn = null) {
    return this.query(
      `SELECT gv.VersionID, gv.VersionNumber, gv.BuildFile, gv.FileSize, gv.Sha256,
              gv.ChangeLog, gv.UploadDate, gv.IsCurrent
       FROM GAMEVERSION gv
       INNER JOIN GAME g ON g.GameID = gv.GameID
       WHERE gv.GameID = ? AND g.DeveloperID = ?
       ORDER BY gv.UploadDate DESC`,
      [params.gameId, params.developerId],
      conn,
    );
  }

  /**
   * UC29. Rollback phiên bản Build (#10) — Đặt IsCurrent = 1 cho bản cũ (phải reset trước).
   * @param {{ versionId: string }} params
   */
  async capNhatPhienBanHienTai(params = {}, conn = null) {
    await this.query(
      'UPDATE GAMEVERSION SET IsCurrent = 1 WHERE VersionID = ?',
      [params.versionId],
      conn,
    );
  }

  /**
   * UC34. Cập nhật trạng thái Game (#3)
   */
  async kiemTraTrangThaiGameHienTai(params = {}, conn = null) {
    throw new NotImplementedException('GameDAO.kiemTraTrangThaiGameHienTai');
  }

  /**
   * UC34. Cập nhật trạng thái Game (#8)
   */
  async capNhatTrangThaiGameMoi(params = {}, conn = null) {
    throw new NotImplementedException('GameDAO.capNhatTrangThaiGameMoi');
  }

  /**
   * UC35. Gỡ game khỏi hệ thống (#3)
   */
  async kiemTraSoLuongNguoiChoiSoHuu(params = {}, conn = null) {
    throw new NotImplementedException('GameDAO.kiemTraSoLuongNguoiChoiSoHuu');
  }

  /**
   * UC35. Gỡ game khỏi hệ thống (#8)
   */
  async capNhatTrangThaiDelisted(params = {}, conn = null) {
    throw new NotImplementedException('GameDAO.capNhatTrangThaiDelisted');
  }

  /**
   * UC36. Ẩn game (#3)
   */
  async capNhatTrangThaiAnGame(params = {}, conn = null) {
    throw new NotImplementedException('GameDAO.capNhatTrangThaiAnGame');
  }

  // ─── Các hàm bổ sung cho DRM / Game management ───

  /**
   * Lấy thông tin game + phiên bản hiện hành để Manager xem khi duyệt.
   * @param {{ gameId: string }} params
   */
  async layGameVaPhienBanHienHanh(params = {}, conn = null) {
    return this.one(
      `SELECT g.GameID, g.DeveloperID, g.Title, g.Status,
              gv.VersionID, gv.VersionNumber, gv.BuildFile, gv.FileSize, gv.Sha256
       FROM GAME g
       INNER JOIN GAMEVERSION gv ON gv.GameID = g.GameID AND gv.IsCurrent = 1
       WHERE g.GameID = ?
       LIMIT 1`,
      [params.gameId],
      conn,
    );
  }

  /**
   * Cập nhật FileSize và Sha256 sau khi auto-DRM wrapper.
   * @param {{ versionId: string, fileSize: number, sha256: string }} params
   */
  async capNhatFileInfoSauDrm(params = {}, conn = null) {
    await this.query(
      'UPDATE GAMEVERSION SET FileSize = ?, Sha256 = ? WHERE VersionID = ?',
      [params.fileSize, params.sha256, params.versionId],
      conn,
    );
  }

  /**
   * Cập nhật GAME.Status = 'Approved', ReleaseDate = COALESCE(ReleaseDate, NOW()).
   * @param {{ gameId: string }} params
   */
  async pheDuyetGame(params = {}, conn = null) {
    await this.query(
      `UPDATE GAME SET Status = 'Approved', ReleaseDate = COALESCE(ReleaseDate, NOW()) WHERE GameID = ?`,
      [params.gameId],
      conn,
    );
  }

  /**
   * Cập nhật GAME.Status = 'Rejected'.
   * @param {{ gameId: string }} params
   */
  async tuChoiGame(params = {}, conn = null) {
    await this.query(
      `UPDATE GAME SET Status = 'Rejected' WHERE GameID = ?`,
      [params.gameId],
      conn,
    );
  }

  /**
   * Cập nhật GAME.Status = 'Delisted'.
   * @param {{ gameId: string }} params
   */
  async delistedGame(params = {}, conn = null) {
    await this.query(
      `UPDATE GAME SET Status = 'Delisted' WHERE GameID = ?`,
      [params.gameId],
      conn,
    );
  }

  /**
   * Lấy DeveloperID của game (để gửi thông báo).
   * @param {{ gameId: string }} params
   */
  async layDeveloperIdCuaGame(params = {}, conn = null) {
    return this.one(
      'SELECT DeveloperID FROM GAME WHERE GameID = ? LIMIT 1',
      [params.gameId],
      conn,
    );
  }
}

module.exports = GameDAO;
